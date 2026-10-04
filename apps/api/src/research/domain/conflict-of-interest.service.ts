import { HttpStatus, Injectable } from "@nestjs/common";

import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-code";
import { BusinessPolicyService } from "../../config/business-policy.service";

interface PairEvidence {
  leftResearcherId: string;
  rightResearcherId: string;
}

interface CoauthorshipEvidence extends PairEvidence {
  publicationDate: string;
}

export interface ConflictDecision {
  conflict: boolean;
  reason?: string;
  policyVersion: string;
}

function pairKey(left: string, right: string): string {
  return [left, right].sort().join("::");
}

@Injectable()
export class ConflictOfInterestService {
  private readonly directSupervision = new Set<string>();
  private readonly sharedProject = new Set<string>();
  private readonly coauthorship: CoauthorshipEvidence[] = [];

  constructor(private readonly policies: BusinessPolicyService) {}

  evaluate(input: {
    principalResearcherId: string;
    reviewerId: string;
    hasDeclaredConflict: boolean | undefined;
    at?: Date;
  }): ConflictDecision {
    const policy = this.policies.getPolicyAt(input.at ?? new Date());

    if (typeof input.hasDeclaredConflict !== "boolean") {
      throw new AppException({
        code: ErrorCode.Validation,
        status: HttpStatus.BAD_REQUEST,
        message:
          "BR-061: Manual conflict disclosure is required before reviewer assignment",
      });
    }

    if (input.principalResearcherId === input.reviewerId) {
      return {
        conflict: true,
        reason: "BR-061: Self-review conflict",
        policyVersion: policy.policyVersion,
      };
    }

    const key = pairKey(input.principalResearcherId, input.reviewerId);
    if (this.directSupervision.has(key)) {
      return {
        conflict: true,
        reason: "BR-061: Direct supervision conflict",
        policyVersion: policy.policyVersion,
      };
    }

    if (this.sharedProject.has(key)) {
      return {
        conflict: true,
        reason: "BR-061: Shared project membership conflict",
        policyVersion: policy.policyVersion,
      };
    }

    if (input.hasDeclaredConflict) {
      return {
        conflict: true,
        reason: "BR-061: Manual conflict disclosure",
        policyVersion: policy.policyVersion,
      };
    }

    const coauthorPeriods = this.coauthorship.filter(
      (evidence) =>
        pairKey(evidence.leftResearcherId, evidence.rightResearcherId) === key,
    );
    if (coauthorPeriods.length > 0) {
      const configured = policy.values["research.coi.recentCoauthorshipMonths"];
      if (typeof configured !== "number" || configured <= 0) {
        return {
          conflict: true,
          reason:
            "BR-061: Co-authorship evidence exists but the recent-coauthorship period is not configured; fail closed",
          policyVersion: policy.policyVersion,
        };
      }

      const at = input.at ?? new Date();
      const threshold = new Date(at);
      threshold.setUTCMonth(threshold.getUTCMonth() - configured);
      const recent = coauthorPeriods.some((evidence) => {
        const publishedAt = Date.parse(evidence.publicationDate);
        return (
          Number.isFinite(publishedAt) && publishedAt >= threshold.getTime()
        );
      });
      if (recent) {
        return {
          conflict: true,
          reason: `BR-061: Recent co-authorship within configured ${configured}-month period`,
          policyVersion: policy.policyVersion,
        };
      }
    }

    return { conflict: false, policyVersion: policy.policyVersion };
  }

  registerDirectSupervisionEvidence(evidence: PairEvidence): void {
    this.directSupervision.add(
      pairKey(evidence.leftResearcherId, evidence.rightResearcherId),
    );
  }

  registerSharedProjectEvidence(evidence: PairEvidence): void {
    this.sharedProject.add(
      pairKey(evidence.leftResearcherId, evidence.rightResearcherId),
    );
  }

  registerCoauthorshipEvidence(evidence: CoauthorshipEvidence): void {
    this.coauthorship.push({ ...evidence });
  }
}
