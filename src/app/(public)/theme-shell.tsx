import { getSetting } from '@/services/site-settings.service';

export async function ThemeShell({ children }: { children: React.ReactNode }) {
  const active = await getSetting('active_theme');
  const customHtml = await getSetting('theme_html');
  const activeTheme = typeof active?.value === 'string' ? active.value : 'default';
  const html = typeof customHtml?.value === 'string' ? customHtml.value : '';

  if (activeTheme === 'html' && html) {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return <>{children}</>;
}
