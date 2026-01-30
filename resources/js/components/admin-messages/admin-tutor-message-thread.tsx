import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { adminMessages as adminMessagesRoute } from '@/routes';
import { useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import type { AdminTutorActiveThread, AdminTutorMessage } from './types';

interface AdminTutorMessageThreadProps {
  activeThread?: AdminTutorActiveThread | null;
  isAdmin: boolean;
  currentUserId: number;
}

export function AdminTutorMessageThread({
  activeThread,
  isAdmin,
  currentUserId,
}: AdminTutorMessageThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data, setData, post, processing, reset } = useForm({
    tutor_id: activeThread?.tutor.id ?? 0,
    admin_id: activeThread?.admin.id ?? 0,
    content: '',
  });

  useEffect(() => {
    if (activeThread) {
      setData('tutor_id', activeThread.tutor.id);
      setData('admin_id', activeThread.admin.id);
    } else {
      setData('tutor_id', 0);
      setData('admin_id', 0);
    }
  }, [activeThread, setData]);

  const prevMessageCountRef = useRef(activeThread?.messages.data.length ?? 0);
  const isNearBottomRef = useRef(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    }
  };

  useEffect(() => {
    const currentCount = activeThread?.messages.data.length ?? 0;
    const prevCount = prevMessageCountRef.current;

    if (scrollRef.current && currentCount > prevCount) {
      if (isNearBottomRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }

    prevMessageCountRef.current = currentCount;
  }, [activeThread?.messages.data.length]);

  const threadKey = useMemo(() => {
    if (!activeThread) {
      return 'none';
    }

    return `${activeThread.admin.id}-${activeThread.tutor.id}`;
  }, [activeThread]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      isNearBottomRef.current = true;
    }
  }, [threadKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeThread) {
      return;
    }

    post(adminMessagesRoute().url, {
      preserveScroll: true,
      onSuccess: () => {
        reset('content');
      },
    });
  };

  const isMyMessage = (message: AdminTutorMessage): boolean => {
    if (message.sender_id !== undefined && message.sender_id !== null) {
      return message.sender_id === currentUserId;
    }

    return (
      message.user_id === currentUserId || message.tutor_id === currentUserId
    );
  };

  const heading = activeThread
    ? isAdmin
      ? activeThread.tutor.name
      : activeThread.admin.name
    : 'Select a conversation';

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>{heading}</CardTitle>
      </CardHeader>
      <CardContent>
        {activeThread ? (
          <div className="space-y-4">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="max-h-[500px] space-y-3 overflow-y-auto scroll-smooth p-1"
            >
              <AnimatePresence initial={false}>
                {activeThread.messages.data.map((message) => {
                  const isMine = isMyMessage(message);
                  const isAdminSender =
                    message.sender_id === activeThread.admin.id ||
                    message.user_id === activeThread.admin.id;
                  const timestamp = message.sent_at ?? message.created_at ?? '';
                  const formattedTimestamp =
                    timestamp && !Number.isNaN(new Date(timestamp).valueOf())
                      ? new Date(timestamp).toLocaleString()
                      : '';

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                        mass: 0.8,
                        layout: {
                          type: 'spring',
                          stiffness: 300,
                          damping: 25,
                        },
                      }}
                      layout="position"
                      className={cn(
                        'max-w-[80%] rounded-2xl p-3 shadow-sm',
                        isMine
                          ? 'ml-auto rounded-tr-none bg-primary text-primary-foreground'
                          : 'mr-auto rounded-tl-none bg-muted text-foreground',
                      )}
                    >
                      <p
                        className={cn(
                          'mb-1 text-xs font-semibold',
                          isMine
                            ? 'text-primary-foreground/80'
                            : 'text-muted-foreground',
                        )}
                      >
                        {isAdminSender ? 'Admin' : 'Tutor'}
                      </p>
                      <p className="whitespace-pre-wrap">
                        {message.content ?? ''}
                      </p>
                      <p
                        className={cn(
                          'mt-1 text-xs',
                          isMine
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground',
                        )}
                      >
                        {formattedTimestamp}
                      </p>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="flex gap-2">
                <Textarea
                  value={data.content}
                  onChange={(e) => setData('content', e.target.value)}
                  placeholder="Type a message..."
                  rows={2}
                />
                <Button
                  type="submit"
                  disabled={processing || !data.content.trim()}
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <p className="text-center text-muted-foreground">
            {isAdmin
              ? 'Select a tutor to start chatting'
              : 'Admins will appear here once they reach out'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
