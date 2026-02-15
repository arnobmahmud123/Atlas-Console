import type { AuthCredentials } from '../types/auth.types';

export interface AuthRepository {
  validateCredentials(input: AuthCredentials): Promise<{ userId: string } | null>;
}
