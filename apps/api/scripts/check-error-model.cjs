const baseUrl = process.env.API_CHECK_URL || "http://localhost:3000/api";

async function main() {
  const correlationId = "FND003-SMOKE-001";
  const response = await fetch(`${baseUrl}/__missing_for_error_model_check__`, {
    headers: {
      "x-correlation-id": correlationId,
    },
  });

  const body = await response.json();

  const required = ["timestamp", "path", "method", "status", "code", "message"];

  const missing = required.filter((key) => !(key in body));

  if (response.status !== 404) {
    throw new Error(`Expected HTTP 404, got ${response.status}`);
  }

  if (missing.length > 0) {
    throw new Error(`Missing error fields: ${missing.join(", ")}`);
  }

  if (body.correlationId !== correlationId) {
    throw new Error(
      `Correlation id mismatch. Expected ${correlationId}, got ${body.correlationId}`,
    );
  }

  if ("stack" in body) {
    throw new Error("Client error response must not expose stack");
  }

  console.log("Common error model check passed.");
  console.log(JSON.stringify(body, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
