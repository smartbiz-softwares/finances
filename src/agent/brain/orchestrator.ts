import Database from 'better-sqlite3';
import { SecurityFence } from '../security/securityFence';
import { MemoryManager } from '../memory/memoryManager';
import { MirrorToneEngine } from '../profile/mirrorToneEngine';
import { ToolRegistry } from '../tools/toolRegistry';
import { LearningPipeline } from '../learning/learningPipeline';
import { AuditLogger } from '../observability/auditLogger';
import { eventBus } from '../eventBus';

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
  public async processUserQuery(userId: string, userMessage: string, deepseekApiKey: string): Promise<string> {
    const startTime = Date.now();
    const interactionId = 'int-' + Math.random().toString(36).substring(2, 9);
    const toolsUsed: string[] = [];

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

      return `⚠️ Tu consulta no pudo ser procesada debido a una restricción de seguridad o privilegio denegado: ${securityCheck.violations.join(', ')}.`;
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
- Mantén el tono espejo indicado en las instrucciones de mimetismo.`;

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
            tool_choice: 'auto'
          })
        });

        if (!response.ok) {
          throw new Error(`DeepSeek API error status: ${response.status}`);
        }

        const data = await response.json() as any;
        const choiceMessage = data.choices?.[0]?.message;

        if (!choiceMessage) {
          finalReplyText = 'Lo sentimos, el servidor de razonamiento no devolvió una respuesta válida.';
          break;
        }

        // Si DeepSeek solicita ejecutar una o más herramientas
        if (choiceMessage.tool_calls && choiceMessage.tool_calls.length > 0) {
          messages.push(choiceMessage);

          for (const toolCall of choiceMessage.tool_calls) {
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
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

    return sanitizedOutput;
  }
}
