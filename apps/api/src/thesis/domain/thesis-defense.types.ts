/** TH005–TH008: prototype defense evidence; records are copied on read. */
export interface DefenseCommitteeMember {
  personId: string;
  role: string;
}
export interface DefenseCommittee {
  committeeId: string;
  thesisId: string;
  members: DefenseCommitteeMember[];
  proposedByUserId: string;
  proposedAt: string;
  reason: string;
  status: "Proposed" | "Approved";
  approvedByUserId?: string;
  approvedAt?: string;
}
export type DefenseOutcome =
  "Pass" | "PassWithCorrections" | "ReDefense" | "Fail";
export interface DefenseSession {
  sessionId: string;
  thesisId: string;
  committeeId: string;
  scheduledAt: string;
  scheduledByUserId: string;
  createdAt: string;
  heldAt?: string;
  minutes?: string;
  outcome?: DefenseOutcome;
  decidedAt?: string;
  decidedByUserId?: string;
  decisionReason?: string;
  extraDefenseException?: {
    approvedByUserId: string;
    approvedAt: string;
    reason: string;
  };
}
export interface CorrectionAttempt {
  submittedByUserId: string;
  submittedAt: string;
  evidenceNote: string;
  verifiedByUserId?: string;
  verifiedAt?: string;
  approved?: boolean;
  verificationReason?: string;
}
export interface ThesisCorrection {
  correctionId: string;
  thesisId: string;
  sessionId: string;
  requirement: string;
  status: "Open" | "Submitted" | "Verified";
  createdAt: string;
  attempts: CorrectionAttempt[];
}
