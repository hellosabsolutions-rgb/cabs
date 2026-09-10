import { ActivityAuditLog } from '../models/ActivityAuditLog.js';
import { logger } from '../utils/logger.js';

class AuditQueuePipeline {
  constructor() {
    this.buffer = [];
    this.batchSize = 25;
    this.flushIntervalMs = 2000; // Flushes every 2 seconds
    this.timer = null;
    this.isFlushing = false;

    this.startFlushTimer();
  }

  enqueue(item) {
    this.buffer.push(item);
    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }

  startFlushTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    }, this.flushIntervalMs);
  }

  async flush() {
    if (this.isFlushing || this.buffer.length === 0) return;
    this.isFlushing = true;

    const toProcess = this.buffer.splice(0, this.buffer.length);
    try {
      await ActivityAuditLog.insertMany(toProcess, { ordered: false });
      logger.debug(`[AuditQueue] Flushed ${toProcess.length} audit logs to database`);
    } catch (err) {
      logger.error('[AuditQueue] Failed to flush audit logs', { error: err.message, count: toProcess.length });
      // Re-queue items that failed if buffer has space
      if (this.buffer.length < 500) {
        this.buffer.unshift(...toProcess);
      }
    } finally {
      this.isFlushing = false;
    }
  }
}

export const auditQueue = new AuditQueuePipeline();
