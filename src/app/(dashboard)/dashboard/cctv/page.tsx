import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/modules/auth/services/auth-options';
import { env } from '@/config/env';
import { getSetting } from '@/services/site-settings.service';
import { cookies } from 'next/headers';
import { cctvCookieName, verifyCctvAccessToken } from '@/lib/security/cctv-access';
import { CctvAccessGate } from '@/ui/components/cctv-access-gate';

type CctvConfig = {
  enabled?: boolean;
  passwordRequired?: boolean;
  channelId?: string;
  videoId?: string;
};

function getEmbedUrl(config: CctvConfig) {
  const channelId = config.channelId?.trim();
  const videoId = config.videoId?.trim();
  if (channelId) {
    return `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(channelId)}`;
  }
  if (videoId) {
    return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
  }
  return null;
}

export default async function CctvPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const setting = await getSetting('settings_cctv');
  const dbConfig = (setting?.value ?? null) as CctvConfig | null;
  const config: CctvConfig = {
    enabled: dbConfig?.enabled ?? true,
    passwordRequired: Boolean(dbConfig?.passwordRequired),
    channelId: dbConfig?.channelId || env.YOUTUBE_CHANNEL_ID || '',
    videoId: dbConfig?.videoId || env.YOUTUBE_LIVE_VIDEO_ID || ''
  };
  const embedUrl = config.enabled ? getEmbedUrl(config) : null;
  const cookieStore = await cookies();
  const token = cookieStore.get(cctvCookieName())?.value;
  const hasAccess = !config.passwordRequired || verifyCctvAccessToken(token, session.user.id);

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Live CCTV</p>
        <h1 className="mt-2 text-2xl font-semibold">Supershop Live Camera</h1>
        <p className="mt-2 text-sm text-slate-300">If stream is offline, try again later.</p>
      </div>

      {!embedUrl ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6 text-sm text-amber-100">
          Stream is not configured or disabled. Admin can update this in Settings {'>'} CCTV.
        </div>
      ) : !hasAccess ? (
        <CctvAccessGate />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="mx-auto aspect-video w-full max-h-[70vh] overflow-hidden rounded-2xl border border-white/10">
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title="Supershop CCTV Live"
              className="h-full w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
