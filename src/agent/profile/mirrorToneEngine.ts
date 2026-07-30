/**
 * CAPA 4: PERFIL & MIMETISMO DE TONO (Mirror Tone Engine)
 * 
 * Analiza 10 dimensiones de la comunicación del usuario:
 * 1. Nivel de formalidad (formal vs informal/casual)
 * 2. Brevedad / Longitud de respuestas (conciso vs explicativo)
 * 3. Densidad de Emojis (sin emojis, moderado, frecuente)
 * 4. Uso de listas y viñetas
 * 5. Nivel técnico / financiero (técnico vs coloquial)
 * 6. Idioma y regionalismos
 * 7. Tipo de humor / empatía
 * 8. Frecuencia y ritmo
 * 9. Paciencia
 * 10. Formato visual preferido
 */

export interface ToneProfile {
  formality: 'FORMAL' | 'INFORMAL' | 'CASUAL';
  verbosity: 'CONCISE' | 'BALANCED' | 'DETAILED';
  emojiDensity: 'NONE' | 'LOW' | 'HIGH';
  usesBulletPoints: boolean;
  technicality: 'BASIC' | 'INTERMEDIATE' | 'EXPERT';
  sentiment: 'STRESSED' | 'ENTHUSIASTIC' | 'FRUSTRATED' | 'NEUTRAL';
}

export class MirrorToneEngine {
  /**
   * Analiza el mensaje del usuario y extrae sus preferencias conversacionales y estado emocional
   */
  public static analyzeTone(message: string): ToneProfile {
    const lower = message.toLowerCase();
    const length = message.length;

    // 1. Formalidad
    let formality: ToneProfile['formality'] = 'INFORMAL';
    if (lower.includes('estimado') || lower.includes('cordial') || lower.includes('usted')) {
      formality = 'FORMAL';
    } else if (lower.includes('ey') || lower.includes('hola bro') || lower.includes('qué tal') || lower.includes('buenas') || lower.includes('oye')) {
      formality = 'CASUAL';
    }

    // 2. Verbosidad
    let verbosity: ToneProfile['verbosity'] = 'BALANCED';
    if (length < 40) {
      verbosity = 'CONCISE';
    } else if (length > 200) {
      verbosity = 'DETAILED';
    }

    // 3. Emojis
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}]/gu;
    const emojiCount = (message.match(emojiRegex) || []).length;
    let emojiDensity: ToneProfile['emojiDensity'] = 'LOW';
    if (emojiCount === 0) emojiDensity = 'NONE';
    if (emojiCount > 2) emojiDensity = 'HIGH';

    // 4. Viñetas
    const usesBulletPoints = message.includes('- ') || message.includes('* ') || message.includes('1.');

    // 5. Nivel técnico
    let technicality: ToneProfile['technicality'] = 'INTERMEDIATE';
    if (lower.includes('ebitda') || lower.includes('roi') || lower.includes('var') || lower.includes(' sharpe') || lower.includes('tae')) {
      technicality = 'EXPERT';
    } else if (lower.includes('plata') || lower.includes('cuanto me queda') || lower.includes('gaste') || lower.includes('dinero')) {
      technicality = 'BASIC';
    }

    // 6. Análisis de Sentimiento y Empatía
    let sentiment: ToneProfile['sentiment'] = 'NEUTRAL';
    if (lower.includes('preocupad') || lower.includes('estresad') || lower.includes('no me alcanza') || lower.includes('apretado') || lower.includes('miedo') || lower.includes('deuda') || lower.includes('problema')) {
      sentiment = 'STRESSED';
    } else if (lower.includes('meta') || lower.includes('logr') || lower.includes('viaje') || lower.includes('casa') || lower.includes('ahorr') || lower.includes('vamos') || lower.includes('genial') || lower.includes('excelente')) {
      sentiment = 'ENTHUSIASTIC';
    } else if (lower.includes('harto') || lower.includes('molest') || lower.includes('malo') || lower.includes('error') || lower.includes('no entiendo')) {
      sentiment = 'FRUSTRATED';
    }

    return {
      formality,
      verbosity,
      emojiDensity,
      usesBulletPoints,
      technicality,
      sentiment
    };
  }

  /**
   * Genera la directiva de prompt que instruye al LLM a responder mimetizando al usuario y empatizando
   */
  public static buildToneInstruction(profile: ToneProfile): string {
    let directive = `\n=== INSTRUCCIÓN DE MIMETISMO Y EMPATÍA (MIRROR TONE) ===\n`;

    // Adaptación de empatía y tono situacional
    if (profile.sentiment === 'STRESSED') {
      directive += `- Muestra empatía profunda y comprensión sincera. No juzgues ni regañes; sé reconfortante y ofrece soluciones prácticas de alivio inmediato.\n`;
    } else if (profile.sentiment === 'ENTHUSIASTIC') {
      directive += `- Muestra entusiasmo contagioso y simpatía. Celebra la visión del usuario y actúa como su aliado y principal impulsor de sus metas.\n`;
    } else if (profile.sentiment === 'FRUSTRATED') {
      directive += `- Muestra paciencia absoluta, escucha empática y brinda claridad directa sin rodeos para resolver su inquietud.\n`;
    } else {
      directive += `- Muestra una simpatía natural, calidez conversacional y tono positivo de compañerismo.\n`;
    }

    if (profile.formality === 'CASUAL') {
      directive += `- Responde en un tono muy cercano, fresco, empático e informal (tutea con naturalidad).\n`;
    } else if (profile.formality === 'FORMAL') {
      directive += `- Responde en un tono estrictamente ejecutivo, sobrio, respetuoso y profesional.\n`;
    } else {
      directive += `- Responde en un tono claro, directo, amigable y empático.\n`;
    }

    if (profile.verbosity === 'CONCISE') {
      directive += `- Sé sumamente conciso. Ve directo al grano sin introducciones innecesarias.\n`;
    } else if (profile.verbosity === 'DETAILED') {
      directive += `- Proporciona un desglose detallado con explicaciones paso a paso.\n`;
    }

    if (profile.emojiDensity === 'NONE') {
      directive += `- No utilices emojis en tu respuesta.\n`;
    } else if (profile.emojiDensity === 'HIGH') {
      directive += `- Usa emojis expresivos de forma natural para acompañar las secciones.\n`;
    }

    if (profile.technicality === 'EXPERT') {
      directive += `- Emplea terminología financiera avanzada (ROI, EBITDA, tasa efectiva, margen neto).\n`;
    } else if (profile.technicality === 'BASIC') {
      directive += `- Expresa los conceptos con lenguaje sencillo, cotidiano y accesible.\n`;
    }

    return directive;
  }
}
