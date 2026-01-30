import {
  QuizPowerupBar,
  QuizQuestionPanel,
  QuizSubmitDialog,
  QuizTakeSidebar,
} from '@/components/courses/quiz';
import { SuccessModal } from '@/components/ui/success-modal';
import { useQuizPowerups } from '@/hooks/use-quiz-powerups';
import { useQuizTimer } from '@/hooks/use-quiz-timer';
import AppLayout from '@/layouts/app-layout';
import type { AnswerConfig, Course, Powerup, PowerupUsage } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Clock, ListMinus, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface QuizQuestion {
  id: number;
  type: 'multiple_choice' | 'fill_blank' | 'essay';
  question: string;
  answer_config: AnswerConfig;
  points: number;
  order: number;
}

interface QuizTakeProps {
  course: Course;
  assessment: {
    id: number;
    title: string;
    description?: string | null;
    type: 'practice' | 'quiz' | 'final_exam';
    time_limit_minutes?: number | null;
    max_score: number;
    powerups?: Powerup[];
  };
  questions: QuizQuestion[];
  attempt: {
    id: number;
    answers: Record<number, string>;
    started_at: string;
    remaining_time?: number | null;
    is_remedial?: boolean;
  };
  usedPowerups: PowerupUsage[];
}

export default function QuizTake({
  course,
  assessment,
  questions,
  attempt,
  usedPowerups: initialUsedPowerups,
}: QuizTakeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>(
    attempt.answers ?? {},
  );
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [powerupCelebration, setPowerupCelebration] = useState<{
    key: number;
    name: string;
    slug: string;
  } | null>(null);
  const powerupTimeoutRef = useRef<number | null>(null);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).filter(
    (key) =>
      answers[parseInt(key)] !== '' && answers[parseInt(key)] !== undefined,
  ).length;

  const handleSubmit = useCallback(() => {
    router.post(
      `/courses/${course.id}/quiz/${assessment.id}/submit`,
      {
        answers,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setShowSubmitConfirm(false);
          setShowSuccessModal(true);
        },
      },
    );
  }, [answers, course.id, assessment.id]);

  const { remainingTime, isSaving, setRemainingTime } = useQuizTimer({
    initialRemainingTime: attempt.remaining_time ?? null,
    courseId: course.id,
    assessmentId: assessment.id,
    answers,
    onAutoSubmit: handleSubmit,
  });

  const {
    usedPowerups,
    applyPowerup,
    isUsing: isUsingPowerup,
    error: powerupError,
    clearError: clearPowerupError,
  } = useQuizPowerups({
    courseId: course.id,
    assessmentId: assessment.id,
    initialUsedPowerups,
  });

  const hiddenOptionsByQuestion = useMemo(() => {
    const map = new Map<number, number[]>();

    usedPowerups.forEach((usage) => {
      if (usage.slug !== '50-50') {
        return;
      }

      const details = usage.details as {
        question_id?: number | string;
        removed_options?: Array<number | string>;
      };

      if (!details?.question_id || !details.removed_options) {
        return;
      }

      const questionId = Number(details.question_id);
      const removedOptions = details.removed_options
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value));

      if (!Number.isFinite(questionId) || removedOptions.length === 0) {
        return;
      }

      const existing = map.get(questionId) ?? [];
      const merged = new Set([...existing, ...removedOptions]);
      map.set(questionId, Array.from(merged));
    });

    return map;
  }, [usedPowerups]);

  const hiddenOptionsForCurrent =
    hiddenOptionsByQuestion.get(currentQuestion.id) ?? [];

  const triggerPowerupCelebration = useCallback((powerup: Powerup) => {
    if (powerupTimeoutRef.current) {
      window.clearTimeout(powerupTimeoutRef.current);
    }

    setPowerupCelebration({
      key: Date.now(),
      name: powerup.name,
      slug: powerup.slug,
    });

    powerupTimeoutRef.current = window.setTimeout(() => {
      setPowerupCelebration(null);
      powerupTimeoutRef.current = null;
    }, 950);
  }, []);

  const handleUsePowerup = useCallback(
    async (powerup: Powerup, questionId?: number) => {
      const response = await applyPowerup(powerup.id, questionId);

      if (response) {
        triggerPowerupCelebration(powerup);
      }

      if (response?.remaining_time !== undefined) {
        setRemainingTime(response.remaining_time ?? null);
      }
    },
    [applyPowerup, setRemainingTime, triggerPowerupCelebration],
  );

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  };

  const titleLabel =
    assessment.type === 'final_exam'
      ? 'Final Exam'
      : assessment.type === 'practice'
        ? 'Practice'
        : 'Quiz';

  const powerupTheme = useMemo(() => {
    if (!powerupCelebration) {
      return {
        icon: Sparkles,
        glow: 'from-amber-400 via-yellow-300 to-orange-500',
        chip: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100',
        badge:
          'bg-white/90 text-slate-900 shadow-[0_20px_60px_rgba(251,191,36,0.35)] dark:bg-slate-900/90 dark:text-white',
      };
    }

    switch (powerupCelebration.slug) {
      case '50-50':
        return {
          icon: ListMinus,
          glow: 'from-cyan-400 via-sky-300 to-indigo-400',
          chip: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-500/20 dark:text-cyan-100',
          badge:
            'bg-white/90 text-slate-900 shadow-[0_20px_60px_rgba(56,189,248,0.35)] dark:bg-slate-900/90 dark:text-white',
        };
      case 'extra-time':
        return {
          icon: Clock,
          glow: 'from-amber-400 via-orange-300 to-rose-400',
          chip: 'bg-orange-100 text-orange-900 dark:bg-orange-500/20 dark:text-orange-100',
          badge:
            'bg-white/90 text-slate-900 shadow-[0_20px_60px_rgba(251,146,60,0.35)] dark:bg-slate-900/90 dark:text-white',
        };
      default:
        return {
          icon: Sparkles,
          glow: 'from-lime-400 via-emerald-300 to-teal-400',
          chip: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100',
          badge:
            'bg-white/90 text-slate-900 shadow-[0_20px_60px_rgba(16,185,129,0.35)] dark:bg-slate-900/90 dark:text-white',
        };
    }
  }, [powerupCelebration]);

  useEffect(() => {
    return () => {
      if (powerupTimeoutRef.current) {
        window.clearTimeout(powerupTimeoutRef.current);
      }
    };
  }, []);

  const PowerupIcon = powerupTheme.icon;

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Courses', href: '/courses' },
        { title: course.title, href: `/courses/${course.id}` },
        { title: assessment.title, href: '#' },
      ]}
    >
      <Head title={`Taking ${titleLabel} - ${assessment.title}`} />

      {powerupCelebration ? (
        <div
          key={powerupCelebration.key}
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          role="status"
          aria-live="polite"
        >
          <div className="absolute inset-0 animate-[powerup-burst_600ms_ease-out] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.65)_0%,transparent_60%)] opacity-80 [animation-fill-mode:forwards] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12)_0%,transparent_70%)]" />
          <div className="absolute inset-0 animate-[powerup-glow_900ms_ease-out] bg-[conic-gradient(from_120deg,transparent,rgba(255,255,255,0.75),transparent)] mix-blend-screen [animation-fill-mode:forwards]" />
          <div className="absolute inset-0">
            {[
              'left-[12%] top-[20%] rotate-12',
              'left-[80%] top-[18%] -rotate-12',
              'left-[18%] top-[70%] -rotate-6',
              'left-[78%] top-[72%] rotate-6',
              'left-[45%] top-[10%] -rotate-3',
              'left-[52%] top-[85%] rotate-3',
            ].map((position) => (
              <div
                key={position}
                className={`absolute h-3 w-8 ${position} animate-[powerup-confetti_850ms_ease-out] rounded-full bg-gradient-to-r ${powerupTheme.glow} [animation-fill-mode:forwards]`}
              />
            ))}
          </div>
          <div className="absolute inset-0">
            {[
              'left-[20%] top-[30%]',
              'left-[70%] top-[25%]',
              'left-[30%] top-[75%]',
              'left-[65%] top-[70%]',
              'left-[50%] top-[50%]',
            ].map((position) => (
              <div
                key={position}
                className={`absolute h-3 w-3 ${position} animate-[powerup-spark_700ms_ease-out] rounded-full bg-white/80 shadow-[0_0_20px_rgba(255,255,255,0.9)] [animation-fill-mode:forwards]`}
              />
            ))}
          </div>
          <div
            className={`relative flex max-w-[90vw] items-center gap-4 rounded-full border border-white/70 px-6 py-4 ${powerupTheme.badge} animate-[powerup-pop_900ms_cubic-bezier(0.2,0.8,0.2,1.1)] [animation-fill-mode:forwards]`}
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full ${powerupTheme.chip}`}
            >
              <PowerupIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-slate-500 dark:text-slate-300">
                Powerup Activated
              </p>
              <p className="truncate text-2xl font-semibold">
                {powerupCelebration.name}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
        <QuizTakeSidebar
          questions={questions}
          answers={answers}
          currentIndex={currentIndex}
          remainingTime={remainingTime}
          isSaving={isSaving}
          onQuestionSelect={goToQuestion}
        />

        <div className="flex-1 p-4 lg:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium">
            <span
              className={`rounded-full px-3 py-1 ${assessment.type === 'final_exam' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : assessment.type === 'practice' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}
            >
              {assessment.type === 'final_exam'
                ? 'Final Exam'
                : assessment.type === 'practice'
                  ? 'Practice'
                  : 'Quiz'}
            </span>
            {attempt.is_remedial && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                Remedial Attempt
              </span>
            )}
          </div>

          {assessment.powerups && assessment.powerups.length > 0 ? (
            <QuizPowerupBar
              powerups={assessment.powerups}
              usedPowerups={usedPowerups}
              currentQuestion={currentQuestion}
              remainingTime={remainingTime}
              isUsing={isUsingPowerup}
              error={powerupError}
              onClearError={clearPowerupError}
              onUsePowerup={handleUsePowerup}
            />
          ) : null}

          <QuizQuestionPanel
            question={currentQuestion}
            questionIndex={currentIndex}
            totalQuestions={questions.length}
            answer={answers[currentQuestion.id]}
            hiddenOptionIndexes={hiddenOptionsForCurrent}
            onAnswerChange={handleAnswerChange}
            onPrevious={() => goToQuestion(currentIndex - 1)}
            onNext={() => goToQuestion(currentIndex + 1)}
            onSubmit={() => setShowSubmitConfirm(true)}
          />

          {showSubmitConfirm && (
            <QuizSubmitDialog
              answeredCount={answeredCount}
              totalQuestions={questions.length}
              onConfirm={handleSubmit}
              onCancel={() => setShowSubmitConfirm(false)}
            />
          )}

          <SuccessModal
            open={showSuccessModal}
            onOpenChange={setShowSuccessModal}
            title="Assessment submitted!"
            description="Your answers are in. We will update your results shortly."
          />
        </div>
      </div>
    </AppLayout>
  );
}
