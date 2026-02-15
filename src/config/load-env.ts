import { env } from './env';

// Importing this file ensures env is validated at startup.
// Use for side-effect bootstrapping when needed.
export function ensureEnvLoaded() {
  return env;
}
