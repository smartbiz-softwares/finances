import Database from 'better-sqlite3';
import { SecurityFence } from '../security/securityFence.ts';
import { MemoryManager } from '../memory/memoryManager.ts';
import { MirrorToneEngine } from '../profile/mirrorToneEngine.ts';
import { ToolRegistry } from '../tools/toolRegistry.ts';
import { LearningPipeline } from '../learning/learningPipeline.ts';
import { AuditLogger } from '../observability/auditLogger.ts';
import { eventBus } from '../eventBus.ts';

/** Techo de tokens de salida por llamada al modelo. */
const MAX_COMPLETION_TOKENS = 2000;

/** Consumo real reportado por DeepSeek, acumulado en todas las iteraciones. */
export interface AgentUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  /** Parte del prompt servida desde caché: DeepSeek la cobra mucho más barata. */
  cachedPromptTokens: number;
  llmCalls: number;
}

export interface AgentResult {
  text: string;
  usage: AgentUsage;
}

export const emptyUsage = (): AgentUsage => ({
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  cachedPromptTokens: 0,
  llmCalls: 0
});

export class AgentOrchestrator {
  private memoryManager: MemoryManager;
  private toolRegistry: ToolRegistry;
  private learningPipeline: LearningPipeline;
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
    this.memoryManager = new MemoryManager();
    this.toolRegistry = new ToolRegistry();
    this.learningPipeline = new LearningPipeline(this.memoryManager);
  }

  /**
   * Procesa la consulta del usuario a través de la Arquitectura Enterprise de 8 Capas
   */
  public async processUserQuery(userId: string, userMessage: string, deepseekApiKey: string, options?: { voiceMode?: boolean }): Promise<AgentResult> {
    const startTime = Date.now();
    const interactionId = 'int-' + Math.random().toString(36).substring(2, 9);
    const toolsUsed: string[] = [];
    const usage = emptyUsage();

    // --- CAPA 1: SEGURIDAD & GUARDRAILS ---
    const securityCheck = SecurityFence.scanInput(userMessage);

    if (!securityCheck.isSafe) {
      AuditLogger.logInteraction({
        id: interactionId,
        userId,
        userMessage,
        model: 'security-fence-blocked',
        latencyMs: Date.now() - startTime,
        toolsUsed: [],
        memoryNotesConsulted: [],
        securityViolations: securityCheck.violations,
        agentResponse: 'Consulta denegada por políticas de seguridad.',
        timestamp: new Date().toISOString()
      });

      // Bloqueada antes de llamar al modelo: no hay consumo que cobrar.
      return {
        text: `⚠️ Tu consulta no pudo ser procesada debido a una restricción de seguridad o privilegio denegado: ${securityCheck.violations.join(', ')}.`,
        usage
      };
    }

    // --- CAPA 3: RECUPERACIÓN DE MEMORIA JERÁRQUICA ---
    const memorySnippet = this.memoryManager.buildMemoryContextSnippet(userId, securityCheck.sanitizedInput);

    // --- CAPA 4: PERFIL Y MIMETISMO DE TONO ---
    const toneProfile = MirrorToneEngine.analyzeTone(securityCheck.sanitizedInput);
    const toneInstruction = MirrorToneEngine.buildToneInstruction(toneProfile);

    // --- CAPA 7: PREDICTOR PROACTIVO DE COMPORTAMIENTOS ---
    const behaviorWarning = this.learningPipeline.predictBehavioralPatterns(userId, this.db);

    // --- CAPA 5 & 2: CONSTRUCCIÓN DEL SYSTEM PROMPT ---
    const userObj = this.db.prepare('SELECT displayName, email FROM users WHERE id = ?').get(userId) as any;
    const userName = userObj?.displayName || (userObj?.email ? userObj.email.split('@')[0] : '') || 'Usuario';

    const systemPrompt = `Eres Hera, un CFO Personal y Coach Financiero Experto en tiempo real.
Estás conversando con el usuario: ${userName}. Dirígete a él/ella por su nombre (${userName}) de forma natural, personalizada y profesional.

${memorySnippet}

${toneInstruction}

${behaviorWarning ? `ALERTA PREVENTIVA RELEVANTE:\n${behaviorWarning}\n` : ''}

REGLAS EJECUTIVAS:
- No utilices cuadrículas o símbolos de bloques ASCII (ej. ▰▰▰ o ████).
- Proporciona siempre análisis accionables, sobrios y bien estructurados.
- Mantén el tono espejo indicado en las instrucciones de mimetismo.

REGLAS DE HERRAMIENTAS (OBLIGATORIAS):
- Para registrar, modificar o consultar datos reales del usuario DEBES invocar la herramienta correspondiente (create_transaction, etc.). Nunca simules el resultado.
- PROHIBIDO afirmar que un movimiento quedó "registrado", inventar IDs de transacción o mostrar resúmenes de escrituras si en este turno no ejecutaste la herramienta y recibiste success:true. Si no la ejecutaste, dilo y ejecútala.
- Cada movimiento se registra UNA sola vez: no repitas la misma llamada con los mismos datos.
- Préstamos y deudas: usa create_debt con type="debt" si el usuario debe dinero, type="receivable" si le deben a él.
- Para BORRAR una transacción o deuda: primero localízala (get_user_transactions / get_user_debts), confirma con el usuario cuál es si hay ambigüedad, y solo entonces llama a delete_transaction / delete_debt con el id exacto. Nunca borres sin id verificado.${options?.voiceMode ? `

MODO VOZ EN VIVO (prioridad máxima): tu respuesta será leída en voz alta.
- Máximo 2-3 frases cortas y naturales, como una conversación hablada.
- PROHIBIDO: markdown, asteriscos, listas, tablas, emojis, ids técnicos.
- Ve directo al dato. Ejemplo bueno: "Listo, registré el gasto de 20 dólares en comida. Te quedan 80 en efectivo."` : ''}`;

    // Historial de conversación (Short Memory)
    const recentHistory = this.db.prepare('SELECT role, content FROM chat_messages WHERE userId = ? ORDER BY createdAt DESC LIMIT 10').all(userId).reverse() as any[];

    let messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...recentHistory.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: securityCheck.sanitizedInput }
    ];

    // --- CAPA 6: REGISTRO DE HERRAMIENTAS ---
    const availableTools = this.toolRegistry.getToolDefinitions();

    let finalReplyText = '';
    let iterations = 0;
    const maxIterations = 5;
    // Firmas de escrituras ya ejecutadas en ESTA consulta (anti-duplicados).
    const executedWriteCalls = new Set<string>();

    // --- CAPA 2: REASONER / TOOL CALLING LOOP ---
    while (iterations < maxIterations) {
      try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekApiKey.trim()}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: messages,
            tools: availableTools,
            tool_choice: 'auto',
            // Techo de coste por respuesta: sin esto la salida no tiene límite.
            max_tokens: MAX_COMPLETION_TOKENS
          })
        });

        if (!response.ok) {
          throw new Error(`DeepSeek API error status: ${response.status}`);
        }

        const data = await response.json() as any;

        // Consumo real de esta llamada. Se acumula aunque después falle el
        // parseo: el modelo ya facturó estos tokens.
        if (data.usage) {
          usage.promptTokens += data.usage.prompt_tokens ?? 0;
          usage.completionTokens += data.usage.completion_tokens ?? 0;
          usage.totalTokens += data.usage.total_tokens
            ?? ((data.usage.prompt_tokens ?? 0) + (data.usage.completion_tokens ?? 0));
          usage.cachedPromptTokens += data.usage.prompt_cache_hit_tokens ?? 0;
        }
        usage.llmCalls++;

        const choiceMessage = data.choices?.[0]?.message;

        if (!choiceMessage) {
          finalReplyText = 'Lo sentimos, el servidor de razonamiento no devolvió una respuesta válida.';
          break;
        }

        // Si el modelo cortó por longitud, el texto queda incompleto pero
        // facturado. Se avisa en lugar de entregar una respuesta truncada muda.
        if (data.choices?.[0]?.finish_reason === 'length') {
          console.warn(`[AgentOrchestrator] Respuesta truncada por max_tokens (usuario ${userId})`);
        }

        // Si DeepSeek solicita ejecutar una o más herramientas
        if (choiceMessage.tool_calls && choiceMessage.tool_calls.length > 0) {
          messages.push(choiceMessage);

          for (const toolCall of choiceMessage.tool_calls) {
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments || '{}');

            // Guardarraíl contra duplicados: si el modelo pide DOS VECES la
            // misma escritura con los mismos argumentos en una misma consulta
            // (visto en producción: doble create_transaction = saldo doblado),
            // la segunda no se ejecuta.
            const callSignature = `${toolName}:${JSON.stringify(toolArgs)}`;
            const isWriteTool = ['create_transaction', 'send_user_notification', 'create_debt', 'delete_transaction', 'delete_debt'].includes(toolName);
            if (isWriteTool && executedWriteCalls.has(callSignature)) {
              console.warn(`[AgentOrchestrator] Tool duplicada bloqueada: ${toolName} con argumentos idénticos`);
              messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify({ success: false, skipped: true, reason: 'Operación duplicada: esta misma escritura ya se ejecutó en esta consulta. No repetir.' })
              });
              continue;
            }
            if (isWriteTool) executedWriteCalls.add(callSignature);

            toolsUsed.push(toolName);

            console.log(`[AgentOrchestrator] Ejecutando tool: ${toolName}`);

            const toolResult = await this.toolRegistry.executeTool(toolName, userId, toolArgs, this.db);

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult)
            });
          }

          iterations++;
        } else {
          // El modelo ha terminado su razonamiento y entrega la respuesta final
          finalReplyText = choiceMessage.content || 'Sin respuesta generada.';
          break;
        }
      } catch (err: any) {
        console.error('[AgentOrchestrator] Error durante la llamada a DeepSeek:', err);
        finalReplyText = 'Lo sentimos, ocurrió una interrupción en el servidor de inteligencia financiera. Por favor inténtalo de nuevo.';
        break;
      }
    }

    // Si se agotaron las iteraciones sin respuesta final, el usuario recibiría
    // texto vacío pese a que las llamadas ya se facturaron.
    if (!finalReplyText) {
      finalReplyText = 'He consultado varias fuentes pero no logré cerrar el análisis. Reformula la consulta y lo intento de nuevo.';
    }

    // --- CAPA 1: SANITIZAR SALIDA DE SEGURIDAD ---
    const sanitizedOutput = SecurityFence.sanitizeOutput(finalReplyText);

    const latencyMs = Date.now() - startTime;

    // --- CAPA 8: REGISTRO DE AUDITORÍA Y METRICAS ---
    AuditLogger.logInteraction({
      id: interactionId,
      userId,
      userMessage: securityCheck.sanitizedInput,
      model: 'deepseek-chat',
      latencyMs,
      toolsUsed,
      memoryNotesConsulted: ['PERFIL_USUARIO.md'],
      securityViolations: securityCheck.violations,
      agentResponse: sanitizedOutput,
      timestamp: new Date().toISOString()
    });

    // --- EMITIR EVENTO EN EVENT BUS ---
    eventBus.emitEvent('USER_CHAT_COMPLETED', userId, {
      userMessage: securityCheck.sanitizedInput,
      agentResponse: sanitizedOutput,
      latencyMs
    });

    // --- CAPA 7: PIPELINE DE APRENDIZAJE EN SEGUNDO PLANO ---
    this.learningPipeline.processConversationInsight(userId, securityCheck.sanitizedInput, sanitizedOutput, this.db)
      .catch(e => console.error('[LearningPipeline Error]:', e));

    return { text: sanitizedOutput, usage };
  }
}
