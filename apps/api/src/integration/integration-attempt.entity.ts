export enum IntegrationOutcome {
    SUCCEEDED = 'Succeeded',
    TRANSIENT_FAIL = 'TransientFail',
    PERMANENT_FAIL = 'PermanentFail',
    SECURITY_FAIL = 'SecurityFail',
  }
  
  export class IntegrationAttempt {
    attemptId!: string; // UUID
    messageId!: string;
    attemptNo!: number;
    startedAt!: Date;
    endedAt?: Date;
    outcome!: IntegrationOutcome;
    errorCode?: string;
    workerId?: string;
    durationMs?: number;
  }
  