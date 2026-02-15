import { prisma } from '@/database/prisma/client';
import { User } from '../../domain/entities/User';

export interface UserRepository {
  create(user: User): Promise<void>;
}

export class PrismaUserRepository implements UserRepository {
  async create(user: User) {
    const now = new Date();
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email.toString(),
        updated_at: now
      }
    });
  }
}
