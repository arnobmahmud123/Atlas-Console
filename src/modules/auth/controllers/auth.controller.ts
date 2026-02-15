'use server';

import { headers } from 'next/headers';
import { AuthService } from '../services/auth.service';

const service = new AuthService();

export async function loginAction(formData: FormData) {
  const hdrs = await headers();
  return service.login(formData, hdrs);
}
