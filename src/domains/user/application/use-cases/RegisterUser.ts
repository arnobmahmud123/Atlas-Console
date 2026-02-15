import { Email } from '../../domain/value-objects/Email';
import { User } from '../../domain/entities/User';
import type { UserRepository } from '../../infrastructure/prisma/user.repository';

export class RegisterUser {
  constructor(private readonly repo: UserRepository) {}

  async execute(input: { id: string; email: string; name?: string | null }) {
    const email = Email.create(input.email);
    if (!email) return null;

    const user = new User({ id: input.id, email, name: input.name });
    await this.repo.create(user);

    return user;
  }
}
