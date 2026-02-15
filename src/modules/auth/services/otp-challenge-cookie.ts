import crypto from 'crypto';

type Purpose = 'ADMIN_LOGIN' | 'WITHDRAWAL';

type Payload = {
  u: string; // userId
  p: Purpose; // purpose
  h: string; // sha256(code)
  e: number; // expiresAt epoch ms
};

function base64url(input: Buffer | string) {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function base64urlToBuffer(input: string) {
  const pad = input.length % 4 ? '='.repeat(4 - (input.length % 4)) : '';
  const b64 = input.replaceAll('-', '+').replaceAll('_', '/') + pad;
  return Buffer.from(b64, 'base64');
}

function secret() {
  return (
    process.env.APP_ENCRYPTION_KEY ||
    process.env.NEXTAUTH_SECRET ||
    'dev_insecure_secret_change_me'
  );
}

function sign(b64Payload: string) {
  return crypto.createHmac('sha256', secret()).update(b64Payload).digest();
}

export function createOtpChallengeValue(payload: Payload) {
  const b64 = base64url(JSON.stringify(payload));
  const sig = base64url(sign(b64));
  return `${b64}.${sig}`;
}

export function readOtpChallengeValue(value: string | null | undefined) {
  if (!value) return null;
  let v = value.trim();
  // Some runtimes/clients may quote cookie values.
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  const [b64, sig] = v.split('.');
  if (!b64 || !sig) return null;
  const expected = sign(b64);
  const got = base64urlToBuffer(sig);
  if (got.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(got, expected)) return null;
  try {
    const payload = JSON.parse(base64urlToBuffer(b64).toString('utf8')) as Payload;
    if (!payload?.u || !payload?.p || !payload?.h || !payload?.e) return null;
    return payload;
  } catch {
    return null;
  }
}
