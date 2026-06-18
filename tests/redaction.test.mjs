import test from 'node:test';
import assert from 'node:assert/strict';
import { runCli } from './helpers.mjs';

test('redact command masks tokens, home paths, emails, and env assignments', () => {
  const input = 'OPENAI_API_KEY=sk-test-secret home C:/Users/Alice token ghp_abcdef123456 alice@example.com';
  const result = runCli(['redact'], { env: { REPOPROOF_STDIN: input } });

  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /sk-test-secret/);
  assert.doesNotMatch(result.stdout, /ghp_abcdef/);
  assert.doesNotMatch(result.stdout, /alice@example.com/);
  assert.match(result.stdout, /\[REDACTED_SECRET\]/);
});
