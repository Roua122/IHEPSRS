const baseUrl = process.env.API_CHECK_URL || 'http://127.0.0.1:3000/api';

async function requestJson(path, headers = {}) {
  const response = await fetch(`${baseUrl}${path}`, { headers });
  let body = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return { response, body };
}

async function main() {
  const suppliedCorrelationId = 'FND004-SMOKE-001';

  const explicit = await requestJson('/__observability_missing__', {
    'x-correlation-id': suppliedCorrelationId,
  });

  const explicitHeader = explicit.response.headers.get('x-correlation-id');

  if (explicit.response.status !== 404) {
    throw new Error(`Expected 404, got ${explicit.response.status}`);
  }

  if (explicitHeader !== suppliedCorrelationId) {
    throw new Error(
      `Expected response correlation id ${suppliedCorrelationId}, got ${explicitHeader}`,
    );
  }

  if (explicit.body?.correlationId !== suppliedCorrelationId) {
    throw new Error('Error body correlationId does not match supplied id');
  }

  const generated = await requestJson('/health');
  const generatedHeader = generated.response.headers.get('x-correlation-id');

  if (!generatedHeader || generatedHeader.length < 8) {
    throw new Error('Expected generated x-correlation-id response header');
  }

  if (generated.response.status !== 200) {
    throw new Error(`Health check failed with ${generated.response.status}`);
  }

  console.log('Logging/correlation check passed.');
  console.log(`Supplied correlationId: ${explicitHeader}`);
  console.log(`Generated correlationId: ${generatedHeader}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
