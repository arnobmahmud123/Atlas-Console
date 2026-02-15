import { User } from '../../domain/entities/User';

export function UserCard({ user }: { user: User }) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-sm font-medium">{user.email.toString()}</p>
      {user.name ? <p className="text-sm text-muted-foreground">{user.name}</p> : null}
    </div>
  );
}
