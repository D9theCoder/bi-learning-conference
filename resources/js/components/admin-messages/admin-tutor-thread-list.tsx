import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminMessages as adminMessagesRoute } from '@/routes';
import { Link } from '@inertiajs/react';
import type { AdminTutorThread } from './types';

interface AdminTutorThreadListProps {
  threads: AdminTutorThread[];
  isAdmin: boolean;
}

const formatDate = (value?: string) => {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? '' : parsed.toLocaleDateString();
};

export function AdminTutorThreadList({
  threads,
  isAdmin,
}: AdminTutorThreadListProps) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Conversations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {threads.map((thread) => {
            const counterpart = isAdmin ? thread.tutor : thread.admin;
            const href = isAdmin
              ? `${adminMessagesRoute().url}?tutor_id=${thread.tutor.id}`
              : `${adminMessagesRoute().url}?admin_id=${thread.admin.id}`;
            const roleLabel = isAdmin ? 'Tutor' : 'Admin';

            return (
              <Link
                key={thread.id}
                href={href}
                className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent"
              >
                <Avatar>
                  <AvatarImage src={counterpart.avatar} />
                  <AvatarFallback>{counterpart.name?.[0] ?? 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{counterpart.name}</span>
                    <Badge variant="secondary">{roleLabel}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(thread.latest_message_at)}
                  </div>
                </div>
                {thread.unread_count > 0 && (
                  <Badge variant="destructive">{thread.unread_count}</Badge>
                )}
              </Link>
            );
          })}
          {threads.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              No conversations yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
