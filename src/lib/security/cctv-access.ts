import crypto from 'crypto';

const COOKIE_NAME = 'cctv-access';
const TTL_SECONDS = 60 * 60 * 12;

function getSecret() {
  return process.env.NEXTAUTH_SECRET ?? 'dev-cctv-secret';
}

export function cctvCookieName() {
  return COOKIE_NAME;
}

export function hashCctvPassword(password: string, salt: string) {
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

export function createCctvAccessToken(userId: string) {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = `${userId}.${exp}`;
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
  return `${exp}.${sig}`;
}

export function verifyCctvAccessToken(token: string | undefined, userId: string) {
  if (!token) return false;
  const [expRaw, sig] = token.split('.');
  const exp = Number(expRaw);
  if (!exp || !sig || exp < Math.floor(Date.now() / 1000)) return false;
  const payload = `${userId}.${exp}`;
  const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

