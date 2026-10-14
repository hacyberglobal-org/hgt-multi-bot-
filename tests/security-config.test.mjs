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


test('production source contains no seeded demo verification or fabricated receipt records', async () => {
  const argyle = await files('../src/lib/argyleService.ts');
  const server = await files('../server.ts');
  assert.doesNotMatch(argyle, /INITIAL_DEMO_REQUEST_ID|arg_tok_sbx_ephemeral_demo_token/);
  assert.doesNotMatch(server, /Paid \$130 via PayPal|Bitcoin payment completed 0\.002 BTC/);
});

test('production source contains no stealth or MFA-bypass controls', async () => {
  const connector = await files('../src/components/RealDriverConnector.tsx');
  const types = await files('../src/types.ts');
  assert.doesNotMatch(connector + types, /stealthUserAgent|sslFingerprintCloak|autoMfaBypassAlert|AntiDetectionArmor/);
});

test('server does not accept privileged provider credentials from request bodies', async () => {
  const server = await files('../server.ts');
  assert.doesNotMatch(server, /req\.body\.apiToken\s*\|\|\s*process\.env\.CLOUDFLARE_API_TOKEN/);
  assert.doesNotMatch(server, /const \{ token, tokenId \} = req\.body/);
  assert.doesNotMatch(server, /req\.body\.token\s*\|\|\s*process\.env\.TELEGRAM_BOT_TOKEN/);
});

test('client code contains no hardcoded Telegram bot-token-like values', async () => {
  const app = await files('../src/App.tsx');
  const connector = await files('../src/components/RealDriverConnector.tsx');
  assert.doesNotMatch(app + connector, /['\x60"]\d{8,}:[A-Za-z0-9_-]{20,}['\x60"]/);
});
