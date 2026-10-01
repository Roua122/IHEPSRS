export const USER_STATUSES = [
  "Invited",
  "Active",
  "Locked",
  "Disabled",
  "Archived",
] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export const USER_STATUS_TRANSITIONS: Readonly<
  Record<UserStatus, readonly UserStatus[]>
> = {
  Invited: ["Active"],
  Active: ["Locked", "Disabled"],
  Locked: ["Active", "Disabled"],
  Disabled: ["Archived"],
  Archived: [],
};

export function canTransitionUserStatus(
  from: UserStatus,
  to: UserStatus,
): boolean {
  return USER_STATUS_TRANSITIONS[from].includes(to);
}

export function assertUserStatusTransition(
  from: UserStatus,
  to: UserStatus,
): void {
  if (!canTransitionUserStatus(from, to)) {
    throw new Error(`UserAccount transition is not allowed: ${from} -> ${to}`);
  }
}
