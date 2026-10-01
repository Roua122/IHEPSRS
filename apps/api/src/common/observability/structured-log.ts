import { getCorrelationId } from './correlation-context';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLogEvent {
  level: LogLevel;
  event: string;
  message?: string;
  correlationId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  [key: string]: unknown;
}

export function writeStructuredLog(event: StructuredLogEvent): void {
  const entry = {
    timestamp: new Date().toISOString(),
    ...event,
    correlationId: event.correlationId ?? getCorrelationId(),
  };

  const serialized = JSON.stringify(entry);

  switch (event.level) {
    case 'error':
      console.error(serialized);
      break;
    case 'warn':
      console.warn(serialized);
      break;
    case 'debug':
      console.debug(serialized);
      break;
    default:
      console.log(serialized);
  }
}
