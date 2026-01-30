import type {
  AdminTutorActiveThread,
  AdminTutorThread,
  UserSummary,
} from '@/components/admin-messages/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface UseAdminTutorMessagePollingOptions {
  threads: AdminTutorThread[];
  activeThread: AdminTutorActiveThread | null;
  tutors: UserSummary[];
  isAdmin: boolean;
  messagesUrl: string;
}

interface UseAdminTutorMessagePollingReturn {
  threadsState: AdminTutorThread[];
  activeThreadState: AdminTutorActiveThread | null;
  tutorsState: UserSummary[];
}

export function useAdminTutorMessagePolling({
  threads,
  activeThread,
  tutors,
  isAdmin,
  messagesUrl,
}: UseAdminTutorMessagePollingOptions): UseAdminTutorMessagePollingReturn {
  const [threadsState, setThreadsState] = useState<AdminTutorThread[]>(threads);
  const [activeThreadState, setActiveThreadState] =
    useState<AdminTutorActiveThread | null>(activeThread);
  const [tutorsState, setTutorsState] = useState<UserSummary[]>(tutors);

  const conversationKey = useMemo(() => {
    if (!activeThreadState) return 'none';

    return `admin-tutor-${activeThreadState.admin.id}-${activeThreadState.tutor.id}`;
  }, [activeThreadState]);

  const poll = useCallback(async () => {
    try {
      const params = new URLSearchParams();

      if (activeThreadState) {
        if (isAdmin) {
          params.set('tutor_id', String(activeThreadState.tutor.id));
        } else {
          params.set('admin_id', String(activeThreadState.admin.id));
        }
      }

      const response = await fetch(
        `${messagesUrl}/poll${params.toString() ? `?${params.toString()}` : ''}`,
        {
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        },
      );

      if (!response.ok) return;

      const payload = await response.json();
      setThreadsState(payload.threads ?? []);
      setActiveThreadState(payload.activeThread ?? null);
      setTutorsState(payload.tutors ?? []);
    } catch {
      // Swallow polling errors
    }
  }, [activeThreadState, isAdmin, messagesUrl]);

  useEffect(() => {
    let isMounted = true;

    const doPoll = async () => {
      if (!isMounted) return;
      await poll();
    };

    doPoll();
    const timer = window.setInterval(doPoll, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, [conversationKey, poll]);

  return { threadsState, activeThreadState, tutorsState };
}
