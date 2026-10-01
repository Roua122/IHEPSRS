const fs = require("node:fs");
const path = require("node:path");

const policyPath = path.resolve(
  process.cwd(),
  process.env.POLICY_CONFIG_PATH || "config/policies.json",
);

const raw = fs.readFileSync(policyPath, "utf8");
const document = JSON.parse(raw);

if (document.schemaVersion !== "1.0") {
  throw new Error("Unsupported policy schemaVersion");
}

if (!Array.isArray(document.policies) || document.policies.length === 0) {
  throw new Error("At least one policy version is required");
}

const versions = new Set();

for (const policy of document.policies) {
  if (!policy.policyVersion) {
    throw new Error("policyVersion is required");
  }

  if (versions.has(policy.policyVersion)) {
    throw new Error(`Duplicate policyVersion: ${policy.policyVersion}`);
  }
  versions.add(policy.policyVersion);

  const from = Date.parse(policy.effectiveFrom);
  const to = policy.effectiveTo ? Date.parse(policy.effectiveTo) : Infinity;

  if (!Number.isFinite(from)) {
    throw new Error(`Invalid effectiveFrom: ${policy.policyVersion}`);
  }

  if (policy.effectiveTo && !Number.isFinite(to)) {
    throw new Error(`Invalid effectiveTo: ${policy.policyVersion}`);
  }

  if (to <= from) {
    throw new Error(`Invalid effective period: ${policy.policyVersion}`);
  }
}

console.log(
  `Configuration check passed: ${document.policies.length} policy version(s), no secrets printed.`,
);
