import { EventEmitter } from 'events';

/**
 * BUS DE EVENTOS DECOPLADO (Event Bus)
 * 
 * Permite que los motores de pronóstico, aprendizaje, observabilidad y notificaciones
 * escuchen eventos del sistema de forma asíncrona y desacoplada.
 */

export interface SystemEvent {
  eventType: 'PAYMENT_CREATED' | 'GOAL_UPDATED' | 'USER_CHAT_COMPLETED' | 'SECURITY_VIOLATION';
  userId: string;
  payload: any;
  timestamp: string;
}

class SystemEventBus extends EventEmitter {
  public emitEvent(eventType: SystemEvent['eventType'], userId: string, payload: any) {
    const event: SystemEvent = {
      eventType,
      userId,
      payload,
      timestamp: new Date().toISOString()
    };
    console.log(`[EventBus] Emitiendo evento: ${eventType} para usuario: ${userId}`);
    this.emit(eventType, event);
  }
}

export const eventBus = new SystemEventBus();
