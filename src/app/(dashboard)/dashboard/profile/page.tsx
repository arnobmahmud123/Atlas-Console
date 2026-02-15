import { serverFetch, safeJson } from '@/lib/http/server-fetch';
import { ProfilePanel } from '@/ui/components/profile-panel';

export default async function UserProfilePage() {
  const res = await serverFetch('/api/me');
  const payload = await safeJson<{ ok: boolean; user: any }>(res);
  const user = payload?.user ?? { email: 'user', role: 'USER', UserProfile: null };
  return <ProfilePanel user={user} variant="user" />;
}

