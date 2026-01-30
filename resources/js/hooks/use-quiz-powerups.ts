import axios from 'axios';
import { useCallback, useState } from 'react';
import type { PowerupUsage } from '@/types';

interface UseQuizPowerupsOptions {
  courseId: number;
  assessmentId: number;
  initialUsedPowerups: PowerupUsage[];
}

interface PowerupUseResponse {
  usage: PowerupUsage;
  remaining_time?: number | null;
  used_count?: number;
  limit?: number;
}

export function useQuizPowerups({
  courseId,
  assessmentId,
  initialUsedPowerups,
}: UseQuizPowerupsOptions) {
  const [usedPowerups, setUsedPowerups] = useState<PowerupUsage[]>(
    initialUsedPowerups,
  );
  const [isUsing, setIsUsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const applyPowerup = useCallback(
    async (
      powerupId: number,
      questionId?: number,
    ): Promise<PowerupUseResponse | null> => {
      setIsUsing(true);
      setError(null);

      try {
        const payload: { powerup_id: number; question_id?: number } = {
          powerup_id: powerupId,
        };

        if (questionId) {
          payload.question_id = questionId;
        }

        const response = await axios.post<PowerupUseResponse>(
          `/courses/${courseId}/quiz/${assessmentId}/powerups/use`,
          payload,
          {
            headers: { Accept: 'application/json' },
          },
        );

        if (response.data?.usage) {
          setUsedPowerups((prev) => [...prev, response.data.usage]);
        }

        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const message =
            (error.response?.data as { message?: string })?.message ??
            'Failed to use powerup.';
          setError(message);
        } else {
          setError('Failed to use powerup.');
        }

        return null;
      } finally {
        setIsUsing(false);
      }
    },
    [assessmentId, courseId],
  );

  return { usedPowerups, applyPowerup, isUsing, error, clearError };
}
