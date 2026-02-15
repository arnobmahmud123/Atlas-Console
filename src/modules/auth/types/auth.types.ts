export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; errors: Record<string, string[]> };
