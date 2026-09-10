import EventEmitter from 'events';
import { logger } from '../utils/logger.js';
import { auditQueue } from './auditQueue.js';

class DomainEventBus extends EventEmitter {
  constructor() {
    super();
    // Allow up to 100 listeners per event
    this.setMaxListeners(100);

    // Register default event listeners for audit logging & telemetry
    this.on('AUDIT_EVENT', (data) => {
      try {
        auditQueue.enqueue({
          time: new Date().toISOString(),
          text: data.text || 'System action performed',
          actor: data.actor || 'Super Admin (System)',
          details: data.details || {}
        });
      } catch (err) {
        logger.error('Failed to enqueue audit event', { error: err.message });
      }
    });

    this.on('error', (err) => {
      logger.error('Unhandled DomainEventBus error', { error: err.message });
    });
  }

  /**
   * Helper to dispatch and log domain events
   */
  emitDomainEvent(eventName, payload = {}) {
    logger.info(`[DomainEvent] ${eventName}`, { payload });
    this.emit(eventName, payload);
  }
}

export const eventBus = new DomainEventBus();
