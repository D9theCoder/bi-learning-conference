import { router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

interface UseQuizTimerOptions {
  initialRemainingTime: number | null;
  courseId: number;
  assessmentId: number;
  answers: Record<number, string>;
  onAutoSubmit: () => void;
}

export function useQuizTimer({
  initialRemainingTime,
  courseId,
  assessmentId,
  answers,
  onAutoSubmit,
}: UseQuizTimerOptions) {
  const [remainingTime, setRemainingTimeState] = useState<number | null>(
    initialRemainingTime,
  );
  const [isSaving, setIsSaving] = useState(false);

  const saveProgress = useCallback(() => {
    setIsSaving(true);
    router.post(
      `/courses/${courseId}/quiz/${assessmentId}/save`,
      { answers },
      {
        preserveScroll: true,
        preserveState: true,
        onFinish: () => setIsSaving(false),
      },
    );
  }, [answers, courseId, assessmentId]);

  // Timer countdown
  useEffect(() => {
    if (remainingTime === null || remainingTime <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setRemainingTimeState((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          onAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime, onAutoSubmit]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveProgress();
    }, 30000);

    return () => clearInterval(interval);
  }, [saveProgress]);

  const extendTime = useCallback((seconds: number) => {
    if (seconds <= 0) {
      return;
    }

    setRemainingTimeState((prev) =>
      prev === null ? prev : Math.max(prev + seconds, 0),
    );
  }, []);

  const setRemainingTime = useCallback((value: number | null) => {
    setRemainingTimeState(value);
  }, []);

  return { remainingTime, isSaving, saveProgress, extendTime, setRemainingTime };
}
