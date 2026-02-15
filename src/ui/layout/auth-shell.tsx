import { Container } from '@/ui/layout/container';

export function AuthShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <Container className="flex min-h-screen max-w-lg flex-col justify-center">
        <div className="rounded-xl border bg-background p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
      </Container>
    </div>
  );
}
