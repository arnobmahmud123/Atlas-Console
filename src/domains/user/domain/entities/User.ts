import { Email } from '../value-objects/Email';

export class User {
  readonly id: string;
  readonly email: Email;
  readonly name?: string | null;

  constructor(params: { id: string; email: Email; name?: string | null }) {
    this.id = params.id;
    this.email = params.email;
    this.name = params.name ?? null;
  }
}
