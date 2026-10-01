export type IntegrationMessageType =
  | 'StudentUpsert'
  | 'ResearcherUpsert'
  | 'ProgramUpsert'
  | 'PublicationUpsert';

export interface IntegrationEnvelope<TPayload = unknown> {
  messageId: string;
  sourceSystem: string;
  schemaVersion: string;
  messageType: IntegrationMessageType;
  correlationId: string;
  eventTime: string;
  institutionId?: string;
  payload: TPayload;
}

export interface StudentUpsertPayload {
  externalId: string;
  studentNumber: string;
  fullName: string;
  email?: string;
  institutionId: string;
}

export interface HealthResponse {
  service: string;
  status: 'ok';
  timestamp: string;
}
