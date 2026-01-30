import { AdminTutorMessageThread } from '@/components/admin-messages/admin-tutor-message-thread';
import { AdminTutorThreadList } from '@/components/admin-messages/admin-tutor-thread-list';
import { NewAdminTutorConversation } from '@/components/admin-messages/new-admin-tutor-conversation';
import type {
  AdminTutorActiveThread,
  AdminTutorThread,
  UserSummary,
} from '@/components/admin-messages/types';
import { PageHeader } from '@/components/shared/page-header';
import { useAdminTutorMessagePolling } from '@/hooks/use-admin-tutor-message-polling';
import AppLayout from '@/layouts/app-layout';
import { adminMessages, messages as messagesRoute } from '@/routes';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { MessageSquare } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Admin Messages', href: adminMessages().url },
];

interface AdminMessagesPageProps {
  threads: AdminTutorThread[];
  activeThread?: AdminTutorActiveThread | null;
  isAdmin: boolean;
  currentUserId: number;
  tutors: UserSummary[];
}

export default function AdminMessagesPage({
  threads,
  activeThread,
  isAdmin,
  currentUserId,
  tutors,
}: AdminMessagesPageProps) {
  const messagesUrl = adminMessages().url;

  const { threadsState, activeThreadState, tutorsState } =
    useAdminTutorMessagePolling({
      threads,
      activeThread: activeThread ?? null,
      tutors,
      isAdmin,
      messagesUrl,
    });

  const [selectedTutorId, setSelectedTutorId] = useState<number | ''>(
    tutorsState[0]?.id ?? '',
  );

  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTutorId) return;

    const params = new URLSearchParams();
    params.set('tutor_id', String(selectedTutorId));
    router.visit(`${messagesUrl}?${params.toString()}`);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Admin Messages" />

      <div className="flex flex-1 flex-col gap-6 overflow-x-auto p-4 lg:p-6">
        <PageHeader
          icon={MessageSquare}
          title="Admin-Tutor Chat"
          description="Private conversations between admins and tutors."
          iconClassName="text-emerald-500"
        />

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted p-1 text-sm">
            <Link
              href={messagesRoute().url}
              className={cn(
                'rounded-md px-3 py-1.5 font-medium text-muted-foreground transition hover:text-foreground',
              )}
            >
              Tutor-Student Conversations
            </Link>
            <Link
              href={adminMessages().url}
              className={cn(
                'rounded-md px-3 py-1.5 font-medium transition',
                'bg-background text-foreground shadow-sm',
              )}
            >
              Admin-Tutor Chat
            </Link>
          </div>
        )}

        {isAdmin && (
          <NewAdminTutorConversation
            tutors={tutorsState}
            selectedTutorId={selectedTutorId}
            onTutorChange={setSelectedTutorId}
            onSubmit={handleCreateThread}
          />
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <AdminTutorThreadList threads={threadsState} isAdmin={isAdmin} />
          <AdminTutorMessageThread
            activeThread={activeThreadState}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </AppLayout>
  );
}
