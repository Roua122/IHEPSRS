const { spawn, spawnSync } = require("node:child_process");

const isWindows = process.platform === "win32";

const API_PORT = "3300";
const MOCK_PORT = "3400";
const API_URL = `http://127.0.0.1:${API_PORT}/api`;
const MOCK_URL = `http://127.0.0.1:${MOCK_PORT}`;

function startService(filter, extraEnv = {}) {
  const child = spawn("pnpm", ["--filter", filter, "start"], {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      ...extraEnv,
    },
    shell: isWindows,
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[${filter}] ${chunk}`);
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[${filter}] ${chunk}`);
  });

  return child;
}

async function waitFor(url, timeoutMs = 30000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Service may still be starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const body = await response.json();
  return { response, body };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function stop(child) {
  if (!child || child.exitCode !== null || !child.pid) {
    return;
  }

  if (isWindows) {
    spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
      shell: true,
    });
    return;
  }

  child.kill("SIGTERM");
}

async function main() {
  const api = startService("@ihepsrs/api", {
    NODE_ENV: "test",
    APP_VERSION: "0.1.5-test",
    API_PORT,
    CORS_ORIGIN: "http://localhost:5173",
    LOG_LEVEL: "info",
    INTEGRATION_CONTRACT_VERSION: "1.0",
    POLICY_CONFIG_PATH: "config/policies.json",
    DATABASE_URL: "postgresql://smoke:smoke@127.0.0.1:5432/smoke",
  });

  const mock = startService("@ihepsrs/mock-university", {
    MOCK_UNIVERSITY_PORT: MOCK_PORT,
    CENTRAL_API_URL: API_URL,
  });

  try {
    await waitFor(`${API_URL}/health`);
    await waitFor(`${MOCK_URL}/health`);

    const health = await requestJson(`${API_URL}/health`);
    assert(
      health.response.status === 200,
      "Central API health must return 200",
    );
    assert(health.body.status === "ok", "Central API health status must be ok");

    const config = await requestJson(`${API_URL}/config/status`);
    assert(config.response.status === 200, "Config status must return 200");
    assert(
      config.body.secretsExposed === false,
      "Config status must not expose secrets",
    );

    const correlationId = "FND005-CI-001";
    const missing = await requestJson(`${API_URL}/__ci_missing__`, {
      headers: {
        "x-correlation-id": correlationId,
      },
    });

    assert(missing.response.status === 404, "Missing endpoint must return 404");
    assert(missing.body.code === "NOT_FOUND", "404 must use NOT_FOUND");
    assert(
      missing.body.correlationId === correlationId,
      "Error body must preserve correlation id",
    );
    assert(
      missing.response.headers.get("x-correlation-id") === correlationId,
      "Response header must preserve correlation id",
    );
    assert(!("stack" in missing.body), "Error response must not expose stack");

    const generatedCorrelation =
      health.response.headers.get("x-correlation-id");
    assert(
      generatedCorrelation && generatedCorrelation.length >= 8,
      "API must generate correlation id when none is supplied",
    );

    const students = await requestJson(`${MOCK_URL}/students`);
    assert(students.response.status === 200, "Mock students must return 200");
    assert(Array.isArray(students.body), "Mock students must return an array");
    assert(students.body.length > 0, "Mock students must contain seed data");

    console.log("");
    console.log("CI smoke baseline passed.");
    console.log(`Generated correlationId: ${generatedCorrelation}`);
  } finally {
    stop(api);
    stop(mock);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
