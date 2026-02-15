import { z } from 'zod';

const optionalInput = () =>
  z.preprocess(value => {
    if (value === null || value === undefined) return undefined;
    const str = String(value).trim();
    return str.length ? str : undefined;
  }, z.string().optional());

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  otp: optionalInput().pipe(z.string().min(6).max(8).optional()),
  recovery_code: optionalInput().pipe(z.string().min(8).optional())
});

export type LoginInput = z.infer<typeof loginSchema>;
