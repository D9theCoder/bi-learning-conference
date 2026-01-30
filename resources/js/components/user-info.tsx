import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useInitials } from '@/hooks/use-initials';
import { type User } from '@/types';

export function UserInfo({
  user,
  showEmail = false,
  roles,
}: {
  user: User;
  showEmail?: boolean;
  roles?: string[];
}) {
  const getInitials = useInitials();

  return (
    <>
      <Avatar className="h-8 w-8 overflow-hidden rounded-full">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        {showEmail && (
          <span className="truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        )}
      </div>
      {roles && roles.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {roles.map((role) => (
            <Badge
              key={role}
              variant="secondary"
              className="text-xs capitalize"
            >
              {role}
            </Badge>
          ))}
        </div>
      )}
    </>
  );
}
