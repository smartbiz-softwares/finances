# Plan de Mejora — IA de HeraWallet

Estado actual (jul 2026): agente DeepSeek con 9 herramientas (resumen, listado de
movimientos, proyección de inversión, crear/borrar transacciones, crear/listar/borrar
deudas y préstamos, notificaciones), guardarraíles anti-duplicado y anti-alucinación,
memoria corta de 10 mensajes, Modo Live de voz (Whisper STT + Piper TTS es/en).

## Fase 1 — Robustez (1-2 semanas)
- [ ] Confirmación explícita para borrados: la IA propone el borrado como widget
      `pending_action` (igual que el recibo) y el usuario confirma con botón.
- [ ] Editar movimientos por chat (`update_transaction`: importe, categoría, cuenta).
- [ ] Elegir cuenta destino al registrar ("apúntalo en la Visa"): parámetro
      `accountName` en `create_transaction` con búsqueda difusa.
- [ ] Abonos parciales de deudas por chat (`pay_debt`: descuenta saldo y sube paidAmount).
- [ ] Presupuestos por categoría (`set_budget` / avisos al 80% vía notificación).

## Fase 2 — Memoria e inteligencia (2-4 semanas)
- [ ] Memoria larga real: resumen de conversación persistido por usuario
      (tabla `agent_memory`) inyectado al system prompt, no solo 10 mensajes.
- [ ] Detección de gastos recurrentes (suscripciones) con propuesta de registro automático.
- [ ] Informe semanal proactivo por notificación + SMS opcional (Twilio).
- [ ] Categorizador entrenado con histórico del usuario (sus categorías reales, no genéricas).

## Fase 3 — Voz nivel humano (paralela)
- [ ] Streaming de respuesta: hablar mientras el modelo genera (frases completas).
- [ ] Detección de silencio (VAD) en Modo Live: dejar de grabar solo, sin tocar el orbe.
- [ ] Barge-in: interrumpir a Hera hablándole encima.
- [ ] Voces premium opcionales (Kokoro-82M local o ElevenLabs si hay presupuesto);
      Piper queda como base gratuita.

## Fase 4 — Multimodal y escala
- [ ] Extractos bancarios PDF/CSV: importación masiva con revisión previa.
- [ ] Fotos de facturas multi-ítem: desglose línea a línea en varias transacciones.
- [ ] Modo familiar/empresa: varias personas sobre las mismas cuentas con roles.
- [ ] Evaluación continua: suite de prompts de regresión (los bugs de jul-2026:
      duplicados, "registrado" sin tool, columnas fantasma) ejecutada en CI.

## Deuda técnica correlacionada
- `App.tsx` con ~12k líneas: extraer chat, onboarding y panel a componentes.
- Migrar SQLite→MySQL pendiente de decisión (esquema MySQL ya se inicializa).
- Rotar claves expuestas durante el desarrollo antes del lanzamiento público.
