import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

export interface PendingApplicationNotification {
  notificationId: string;
  applicationId: string;
  personId: string;
  event: "ApplicationSubmitted" | "ApplicationResubmitted" | "NeedMoreInfo";
  queuedAt: string;
  deliveryStatus: "Pending";
}

/**
 * FR-030: local prototype outbox, NOT an email-delivery claim.
 * Delivery/retries must be owned by the team's Notification adapter.
 */
@Injectable()
export class ApplicationNotificationOutboxService {
  private readonly pending: PendingApplicationNotification[] = [];

  enqueue(input: {
    applicationId: string;
    personId: string;
    event: PendingApplicationNotification["event"];
  }): void {
    this.pending.push({
      notificationId: randomUUID(),
      ...input,
      queuedAt: new Date().toISOString(),
      deliveryStatus: "Pending",
    });
  }

  /** Internal integration hook; never expose the queue cross-person in HTTP. */
  pendingForDelivery(): readonly PendingApplicationNotification[] {
    return this.pending.map((entry) => ({ ...entry }));
  }
}
