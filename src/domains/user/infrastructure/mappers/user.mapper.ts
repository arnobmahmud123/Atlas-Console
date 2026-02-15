import type { User as PrismaUser } from '@prisma/client';
import { Email } from '../../domain/value-objects/Email';
import { User } from '../../domain/entities/User';

export function toDomain(prismaUser: PrismaUser): User | null {
  const email = Email.create(prismaUser.email);
  if (!email) return null;
  return new User({ id: prismaUser.id, email });
}
