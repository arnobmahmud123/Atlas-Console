import { serverFetch, safeJson } from '@/lib/http/server-fetch';
import { ProfilePanel } from '@/ui/components/profile-panel';

export default async function AdminProfilePage() {
  const res = await serverFetch('/api/me');
  const payload = await safeJson<{ ok: boolean; user: any }>(res);
  const user = payload?.user ?? { email: 'admin', role: 'ADMIN', UserProfile: null };
  return <ProfilePanel user={user} variant="admin" />;
}

