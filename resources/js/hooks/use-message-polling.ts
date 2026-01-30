import type {
  ActiveThread,
  ContactUser,
  Thread,
} from '@/components/messages/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface UseMessagePollingOptions {
  threads: Thread[];
  activeThread: ActiveThread | null;
  contacts: ContactUser[];
  isAdmin: boolean;
  messagesUrl: string;
}

interface UseMessagePollingReturn {
  threadsState: Thread[];
  activeThreadState: ActiveThread | null;
  contactsState: ContactUser[];
}

export function useMessagePolling({
  threads,
  activeThread,
  contacts,
  isAdmin,
  messagesUrl,
}: UseMessagePollingOptions): UseMessagePollingReturn {
  const [threadsState, setThreadsState] = useState<Thread[]>(threads);
  const [activeThreadState, setActiveThreadState] =
    useState<ActiveThread | null>(activeThread);
  const [contactsState, setContactsState] = useState<ContactUser[]>(contacts);

  const conversationKey = useMemo(() => {
    if (!activeThreadState) return 'none';

    if (
      isAdmin &&
      'tutor' in activeThreadState &&
      'student' in activeThreadState
    ) {
      return `admin-${activeThreadState.tutor?.id}-${activeThreadState.student?.id}`;
    }

    if (!isAdmin && 'partner' in activeThreadState) {
      return `partner-${activeThreadState.partner?.id}`;
    }

    return 'none';
  }, [activeThreadState, isAdmin]);

  const poll = useCallback(async () => {
    try {
      const params = new URLSearchParams();

      if (
        isAdmin &&
        activeThreadState &&
        'tutor' in activeThreadState &&
        'student' in activeThreadState
      ) {
        if (activeThreadState.tutor?.id && activeThreadState.student?.id) {
          params.set('tutor_id', String(activeThreadState.tutor.id));
          params.set('student_id', String(activeThreadState.student.id));
        }
      } else if (
        !isAdmin &&
        activeThreadState &&
        'partner' in activeThreadState
      ) {
        if (activeThreadState.partner?.id) {
          params.set('partner', String(activeThreadState.partner.id));
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
      setContactsState(payload.contacts ?? []);
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

  return { threadsState, activeThreadState, contactsState };
}
