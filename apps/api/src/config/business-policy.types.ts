export type PolicyValue = string | number | boolean | null;

export interface BusinessPolicyVersion {
  policyVersion: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  values: Record<string, PolicyValue>;
}

export interface BusinessPolicyDocument {
  schemaVersion: "1.0";
  policies: BusinessPolicyVersion[];
}
