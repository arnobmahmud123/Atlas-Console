import { z } from 'zod';

export function sanitizeString(input: unknown) {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>]/g, '').trim();
}

// Keep this as ZodString so callers can chain .min/.email/.uuid/.url safely.
export const zSanitizedString = () => z.string().trim();
export const zSanitizedOptionalString = () => z.string().trim().optional();
export const zDecimalString = () =>
  z.preprocess(sanitizeString, z.string().regex(/^\d+(\.\d+)?$/));

export const zIntString = () =>
  z.preprocess(sanitizeString, z.string().regex(/^\d+$/));
