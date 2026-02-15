import { z } from 'zod';

const emailSchema = z.string().email();

export class Email {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(raw: string) {
    const parsed = emailSchema.safeParse(raw);
    if (!parsed.success) return null;
    return new Email(parsed.data);
  }

  toString() {
    return this.value;
  }
}
