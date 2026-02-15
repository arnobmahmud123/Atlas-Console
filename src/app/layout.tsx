import '@/styles/globals.css';
import type { Metadata } from 'next';
import { getSetting } from '@/services/site-settings.service';

export const metadata: Metadata = {
  title: 'SaaS App',
  description: 'Production-grade SaaS starter'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const customCssSetting = await getSetting('custom_css');
  const customCss = typeof customCssSetting?.value === 'string' ? customCssSetting.value : '';

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased" suppressHydrationWarning>
        {customCss ? <style dangerouslySetInnerHTML={{ __html: customCss }} /> : null}
        {children}
      </body>
    </html>
  );
}
