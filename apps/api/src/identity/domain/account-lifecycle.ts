import type { UserStatus } from "./user-status";
import { UserAccount } from "./user-account";

export interface AccountLifecycleEvent {
  sourceIds: readonly string[];
  userId: string;
  fromStatus: UserStatus;
  toStatus: UserStatus;
}

export function changeAccountStatus(
  account: UserAccount,
  nextStatus: UserStatus,
): AccountLifecycleEvent {
  const fromStatus = account.status;
  account.transitionTo(nextStatus);

  return {
    sourceIds: ["FR-001", "BR-040", "UC-19"],
    userId: account.userId,
    fromStatus,
    toStatus: nextStatus,
  };
}
