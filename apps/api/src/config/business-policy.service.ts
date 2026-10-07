import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type {
  BusinessPolicyDocument,
  BusinessPolicyVersion,
  PolicyValue,
} from "./business-policy.types";

@Injectable()
export class BusinessPolicyService {
  private readonly document: BusinessPolicyDocument;

  constructor(private readonly config: ConfigService) {
    const configuredPath =
      this.config.get<string>("POLICY_CONFIG_PATH") ?? "config/policies.json";

    const absolutePath = resolve(process.cwd(), configuredPath);
    const raw = readFileSync(absolutePath, "utf8");

    this.document = this.validateDocument(JSON.parse(raw) as unknown);
  }

  getPolicyAt(at: Date = new Date()): BusinessPolicyVersion {
    const time = at.getTime();

    const matches = this.document.policies.filter((policy) => {
      const from = Date.parse(policy.effectiveFrom);
      const to = policy.effectiveTo ? Date.parse(policy.effectiveTo) : Infinity;
      return from <= time && time < to;
    });

    if (matches.length !== 1) {
      throw new Error(
        `Expected exactly one effective policy at ${at.toISOString()}, found ${matches.length}`,
      );
    }

    // Defensive copy: callers must not mutate the loaded historical policy.
    return {
      ...matches[0],
      values: { ...matches[0].values },
    };
  }

  getValue(
    key: string,
    at: Date = new Date(),
  ): { value: PolicyValue | undefined; policyVersion: string } {
    const policy = this.getPolicyAt(at);

    return {
      value: policy.values[key],
      policyVersion: policy.policyVersion,
    };
  }

  private validateDocument(input: unknown): BusinessPolicyDocument {
    if (!input || typeof input !== "object") {
      throw new Error("Policy configuration must be a JSON object");
    }

    const candidate = input as Partial<BusinessPolicyDocument>;

    if (candidate.schemaVersion !== "1.0") {
      throw new Error("Unsupported policy configuration schemaVersion");
    }

    if (!Array.isArray(candidate.policies) || candidate.policies.length === 0) {
      throw new Error("Policy configuration must contain at least one policy");
    }

    const seenVersions = new Set<string>();

    for (const policy of candidate.policies) {
      if (
        !policy ||
        typeof policy.policyVersion !== "string" ||
        !policy.policyVersion.trim()
      ) {
        throw new Error("Every policy requires a policyVersion");
      }

      if (seenVersions.has(policy.policyVersion)) {
        throw new Error(`Duplicate policyVersion: ${policy.policyVersion}`);
      }
      seenVersions.add(policy.policyVersion);

      const from = Date.parse(policy.effectiveFrom);
      const to = policy.effectiveTo ? Date.parse(policy.effectiveTo) : Infinity;

      if (!Number.isFinite(from)) {
        throw new Error(
          `Invalid effectiveFrom in policy ${policy.policyVersion}`,
        );
      }

      if (policy.effectiveTo && !Number.isFinite(to)) {
        throw new Error(
          `Invalid effectiveTo in policy ${policy.policyVersion}`,
        );
      }

      if (to <= from) {
        throw new Error(
          `effectiveTo must be after effectiveFrom in policy ${policy.policyVersion}`,
        );
      }

      if (!policy.values || typeof policy.values !== "object") {
        throw new Error(`Policy ${policy.policyVersion} requires values`);
      }
    }

    // Detect overlapping effective periods.
    const sorted = [...candidate.policies].sort(
      (a, b) => Date.parse(a.effectiveFrom) - Date.parse(b.effectiveFrom),
    );

    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      const previousEnd = previous.effectiveTo
        ? Date.parse(previous.effectiveTo)
        : Infinity;

      if (Date.parse(current.effectiveFrom) < previousEnd) {
        throw new Error(
          `Policy effective periods overlap: ${previous.policyVersion} and ${current.policyVersion}`,
        );
      }
    }

    return candidate as BusinessPolicyDocument;
  }
}
