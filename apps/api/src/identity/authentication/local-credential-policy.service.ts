import { Injectable } from "@nestjs/common";

const PROTOTYPE_COMMON_OR_BREACHED_PASSWORDS = new Set(
  [
    "password1234",
    "password12345",
    "qwerty123456",
    "123456789012",
    "admin12345678",
    "letmein123456",
    "welcome123456",
  ].map((value) => value.toLowerCase()),
);

export interface PasswordPolicyDecision {
  accepted: boolean;
  reason?: "TOO_SHORT" | "COMMON_OR_BREACHED";
}

@Injectable()
export class LocalCredentialPolicyService {
  evaluate(password: string): PasswordPolicyDecision {
    if (password.length < 12) {
      return { accepted: false, reason: "TOO_SHORT" };
    }

    if (PROTOTYPE_COMMON_OR_BREACHED_PASSWORDS.has(password.toLowerCase())) {
      return { accepted: false, reason: "COMMON_OR_BREACHED" };
    }

    return { accepted: true };
  }
}
