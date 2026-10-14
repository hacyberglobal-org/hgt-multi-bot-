import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files = async (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('server never embeds provider secrets as runtime fallbacks', async () => {
  const source = await files('../server.ts');
  assert.doesNotMatch(source, /process\.env\.(?:GEMINI_API_KEY|CONSOLE_SECRET)\s*=\s*['"`][^'"`]+['"`]/);
  assert.doesNotMatch(source, /process\.env\.CLOUDFLARE_(?:API_TOKEN|TOKEN_ID)\s*=\s*['"`][^'"`]+['"`]/);
});

test('browser code does not ship a Telegram bot token fallback', async () => {
  const app = await files('../src/App.tsx');
  const setup = await files('../src/components/TelegramBotSetup.tsx');
  assert.doesNotMatch(app, /spark_bot_billing_token['"`]\)\s*\|\|\s*['"`]\d{8,}:[A-Za-z0-9_-]{20,}['"`]/);
  assert.doesNotMatch(setup, /return\s+['"`]\d{8,}:[A-Za-z0-9_-]{20,}['"`]/);
});

test('missing integrations are reported as unavailable rather than simulated success', async () => {
  const setup = await files('../src/components/TelegramBotSetup.tsx');
  assert.doesNotMatch(setup, /MOCK INTERNET ACCESS ACCEPTED/);
  assert.doesNotMatch(setup, /Simulated Handshake Success/);
});
