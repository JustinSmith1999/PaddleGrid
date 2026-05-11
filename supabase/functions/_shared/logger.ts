/**
 * Structured logging utility for Supabase Edge Functions.
 * Outputs JSON logs compatible with Supabase's log drain.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  function_name: string;
  request_id: string;
  message: string;
  duration_ms?: number;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = new Set([
  'authorization',
  'password',
  'passwd',
  'secret',
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'apikey',
  'api_secret',
  'private_key',
  'credit_card',
  'card_number',
  'cvv',
  'ssn',
  'stripe_secret_key',
  'service_role_key',
]);

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 8) return '[max depth]';

  if (value === null || value === undefined) return value;

  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return value;

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, depth + 1));
  }

  if (typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitize(val, depth + 1);
      }
    }
    return sanitized;
  }

  return String(value);
}

function generateRequestId(): string {
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface RequestLogger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
  withDuration<T>(label: string, fn: () => T | Promise<T>): Promise<T>;
  requestId: string;
}

export function createRequestLogger(functionName: string, _req?: Request): RequestLogger {
  const requestId = generateRequestId();
  const requestStart = performance.now();

  function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      function_name: functionName,
      request_id: requestId,
      message,
      duration_ms: Math.round(performance.now() - requestStart),
    };

    if (data) {
      const sanitized = sanitize(data) as Record<string, unknown>;
      Object.assign(entry, sanitized);
    }

    const output = JSON.stringify(entry);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'debug':
        console.debug(output);
        break;
      default:
        console.log(output);
    }
  }

  return {
    requestId,

    debug(message: string, data?: Record<string, unknown>) {
      log('debug', message, data);
    },

    info(message: string, data?: Record<string, unknown>) {
      log('info', message, data);
    },

    warn(message: string, data?: Record<string, unknown>) {
      log('warn', message, data);
    },

    error(message: string, data?: Record<string, unknown>) {
      log('error', message, data);
    },

    async withDuration<T>(label: string, fn: () => T | Promise<T>): Promise<T> {
      const start = performance.now();
      log('info', `${label} started`);
      try {
        const result = await fn();
        const elapsed = Math.round(performance.now() - start);
        log('info', `${label} completed`, { operation_duration_ms: elapsed });
        return result;
      } catch (err) {
        const elapsed = Math.round(performance.now() - start);
        log('error', `${label} failed`, {
          operation_duration_ms: elapsed,
          error: err instanceof Error ? { name: err.name, message: err.message } : String(err),
        });
        throw err;
      }
    },
  };
}
