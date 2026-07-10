import { getCodexRunner, shutdownCodexRunner } from '../lib/codex-runner';

const args = process.argv.slice(2);
const warmupOnly = args.includes('--warmup-only');

async function main() {
  const runner = getCodexRunner({ sandbox: 'read-only', approvalPolicy: 'never' });

  console.log('[smoke] warming up app-server…');
  await runner.warmup();
  console.log('[smoke] app-server ready');

  if (warmupOnly) return;

  const result = await runner.complete({
    system: 'You are a JSON emitter. Reply with valid JSON only.',
    userMessage: 'Return {"ok":true,"source":"preframe-codex-runner"}',
    timeoutMs: 120_000,
  });

  console.log('[smoke] turn completed');
  console.log(JSON.stringify({
    model: result.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    textPreview: result.text.slice(0, 200),
  }, null, 2));
}

main()
  .catch(err => {
    console.error('[smoke] failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => shutdownCodexRunner());