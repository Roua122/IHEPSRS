import { Injectable } from "@nestjs/common";

const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const FAILURE_THRESHOLD = 5;

interface AttemptState {
  failures: number[];
  lockedUntil?: number;
}

@Injectable()
export class LoginAttemptTrackerService {
  private readonly state = new Map<string, AttemptState>();

  isLocked(subject: string, at = Date.now()): boolean {
    const entry = this.state.get(subject);
    if (!entry?.lockedUntil) {
      return false;
    }

    if (at >= entry.lockedUntil) {
      this.state.delete(subject);
      return false;
    }

    return true;
  }

  recordFailure(subject: string, at = Date.now()): void {
    const existing = this.state.get(subject) ?? { failures: [] };
    const cutoff = at - FAILURE_WINDOW_MS;
    const failures = existing.failures.filter((value) => value >= cutoff);
    failures.push(at);

    const next: AttemptState = { failures };
    if (failures.length >= FAILURE_THRESHOLD) {
      next.lockedUntil = at + LOCK_DURATION_MS;
    }

    this.state.set(subject, next);
  }

  clear(subject: string): void {
    this.state.delete(subject);
  }

  remainingLockMs(subject: string, at = Date.now()): number {
    const entry = this.state.get(subject);
    if (!entry?.lockedUntil || entry.lockedUntil <= at) {
      return 0;
    }
    return entry.lockedUntil - at;
  }
}
