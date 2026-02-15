import Link from 'next/link';
import { AuthShell } from '@/ui/layout/auth-shell';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset password" subtitle="We will email you a reset link">
      <form className="space-y-4">
        <Input type="email" name="email" placeholder="Email" />
        <Button className="w-full">Send reset link</Button>
      </form>
      <div className="mt-4 text-sm">
        <Link className="text-muted-foreground hover:text-foreground" href="/login">
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
