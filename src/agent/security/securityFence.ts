/**
 * CAPA 1: SEGURIDAD & GUARDRAILS (Security Fence)
 * 
 * Protege al agente Hera contra:
 * 1. Prompt Injection & Jailbreaks
 * 2. Exposición de secretos del sistema (.env, API keys, tokens)
 * 3. Ejecución no autorizada de comandos o intenciones administrativas
 * 4. Fuga de datos de identificación personal (PII) o infraestructura
 */

export interface SecurityScanResult {
  isSafe: boolean;
  sanitizedInput: string;
  violations: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Patrones sospechosos de Prompt Injections
const INJECTION_PATTERNS = [
  /ignore\s+previous\s+instructions/i,
  /ignore\s+all\s+prior\s+prompts/i,
  /system\s+prompt\s+leak/i,
  /you\s+are\s+now\s+dan/i,
  /override\s+system\s+instructions/i,
  /print\s+system\s+prompt/i,
  /reveal\s+your\s+initial\s+prompt/i,
  /act\s+as\s+an\s+unrestricted/i,
  /sudo\s+/i,
  /rm\s+-rf/i,
  /process\.env/i,
  /select\s+\*\s+from\s+sqlite_master/i,
  /drop\s+table/i
];

// Palabras prohibidas de infraestructura / secretos
const SECRET_KEYWORDS = [
  'DEEPSEEK_API_KEY',
  'GEMINI_API_KEY',
  'JWT_SECRET',
  'DATABASE_URL',
  'process.env',
  '/etc/passwd',
  '.env'
];

export class SecurityFence {
  /**
   * Escanea y sanitiza la entrada del usuario antes de que llegue al Cerebro Agéntico
   */
  public static scanInput(input: string): SecurityScanResult {
    const violations: string[] = [];
    let riskLevel: SecurityScanResult['riskLevel'] = 'LOW';

    // 1. Detección de Prompt Injections
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        violations.push(`Prompt Injection Pattern detected: ${pattern.source}`);
        riskLevel = 'HIGH';
      }
    }

    // 2. Intent Verification & Privilegios
    const adminCommands = ['bash', 'sh', 'exec', 'system', 'eval', 'cat /', 'ls /', 'chmod'];
    for (const cmd of adminCommands) {
      if (input.toLowerCase().includes(cmd)) {
        violations.push(`Unpermitted administrative command attempt: ${cmd}`);
        riskLevel = 'CRITICAL';
      }
    }

    // 3. Secrets Shield Check
    for (const secretKey of SECRET_KEYWORDS) {
      if (input.includes(secretKey)) {
        violations.push(`Attempt to access system secret: ${secretKey}`);
        riskLevel = 'CRITICAL';
      }
    }

    const isSafe = riskLevel !== 'HIGH' && riskLevel !== 'CRITICAL';
    const sanitizedInput = input.trim();

    return {
      isSafe,
      sanitizedInput,
      violations,
      riskLevel
    };
  }

  /**
   * Escanea y sanitiza la salida del agente antes de que llegue al usuario
   */
  public static sanitizeOutput(output: string): string {
    let sanitized = output;

    // Enmascarar posibles claves de API o variables de entorno que el LLM pudiera filtrar
    for (const secretKey of SECRET_KEYWORDS) {
      const regex = new RegExp(secretKey, 'gi');
      sanitized = sanitized.replace(regex, '[REDACTED_SECRET]');
    }

    // Enmascarar tokens JWT o llaves de API tipo sk-
    sanitized = sanitized.replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED_API_KEY]');

    return sanitized;
  }
}
