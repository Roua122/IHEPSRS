export type NodeEnvironment = "development" | "test" | "production";

export interface ValidatedEnvironment {
  nodeEnv: NodeEnvironment;
  appVersion: string;
  apiPort: number;
  corsOrigin: string;
  logLevel: string;
  integrationContractVersion: string;
  policyConfigPath: string;
  databaseUrl: string;
}

function asNonEmptyString(
  value: unknown,
  fallback: string | undefined,
  name: string,
): string {
  const resolved =
    typeof value === "string" && value.trim() ? value.trim() : fallback;

  if (!resolved) {
    throw new Error(`Missing required configuration: ${name}`);
  }

  return resolved;
}

function asPort(value: unknown, fallback: number, name: string): number {
  const raw =
    typeof value === "string" && value.trim() ? value : String(fallback);
  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid port for ${name}: ${raw}`);
  }

  return parsed;
}

export function validateEnvironment(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const nodeEnvRaw = asNonEmptyString(
    input.NODE_ENV,
    "development",
    "NODE_ENV",
  );

  if (!["development", "test", "production"].includes(nodeEnvRaw)) {
    throw new Error("NODE_ENV must be one of: development, test, production");
  }

  const validated: ValidatedEnvironment = {
    nodeEnv: nodeEnvRaw as NodeEnvironment,
    appVersion: asNonEmptyString(input.APP_VERSION, "0.1.2", "APP_VERSION"),
    apiPort: asPort(input.API_PORT, 3000, "API_PORT"),
    corsOrigin: asNonEmptyString(
      input.CORS_ORIGIN,
      "http://localhost:5173",
      "CORS_ORIGIN",
    ),
    logLevel: asNonEmptyString(input.LOG_LEVEL, "info", "LOG_LEVEL"),
    integrationContractVersion: asNonEmptyString(
      input.INTEGRATION_CONTRACT_VERSION,
      "1.0",
      "INTEGRATION_CONTRACT_VERSION",
    ),
    policyConfigPath: asNonEmptyString(
      input.POLICY_CONFIG_PATH,
      "config/policies.json",
      "POLICY_CONFIG_PATH",
    ),
    databaseUrl: asNonEmptyString(
      input.DATABASE_URL,
      undefined,
      "DATABASE_URL",
    ),
  };

  // Nest ConfigModule expects a plain object.
  return {
    NODE_ENV: validated.nodeEnv,
    APP_VERSION: validated.appVersion,
    API_PORT: validated.apiPort,
    CORS_ORIGIN: validated.corsOrigin,
    LOG_LEVEL: validated.logLevel,
    INTEGRATION_CONTRACT_VERSION: validated.integrationContractVersion,
    POLICY_CONFIG_PATH: validated.policyConfigPath,
    DATABASE_URL: validated.databaseUrl,
  };
}
