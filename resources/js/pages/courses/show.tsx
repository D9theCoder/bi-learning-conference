import { EnrollModal } from '@/components/courses/enroll-modal';
import {
  CourseHeader,
  CourseTabs,
  SessionTabContent,
} from '@/components/courses/show';
import { useRoles } from '@/hooks/use-roles';
import AppLayout from '@/layouts/app-layout';
import {
  Assessment,
  AssessmentSubmission,
  Course,
  CourseContent,
  Lesson,
  StudentMeetingSchedule,
  StudentWithSubmissions,
  User,
} from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import {
  AssessmentTab,
  AttendanceTab,
  GradebookTab,
  ScheduleTab,
  ScoringTab,
} from './tabs';

interface CourseShowProps {
  course: Course & {
    instructor: User;
    lessons: (Lesson & {
      contents: CourseContent[];
    })[];
  };
  isEnrolled: boolean;
  isTutor?: boolean;
  students?: StudentWithSubmissions[];
  assessments?: Assessment[];
  submissions?: AssessmentSubmission[];
  meetingSchedules?: StudentMeetingSchedule[];
}

export default function CourseShow({
  course,
  isEnrolled,
  isTutor = false,
  students = [],
  assessments = [],
  submissions = [],
  meetingSchedules = [],
}: CourseShowProps) {
  // Read initial session from URL query parameter
  const getInitialSessionId = useCallback((): string => {
    if (typeof window === 'undefined')
      return course.lessons.length > 0 ? course.lessons[0].id.toString() : '';

    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');

    if (
      sessionParam &&
      course.lessons.some((l) => l.id.toString() === sessionParam)
    ) {
      return sessionParam;
    }

    return course.lessons.length > 0 ? course.lessons[0].id.toString() : '';
  }, [course]);

  const [activeSessionId, setActiveSessionId] =
    useState<string>(getInitialSessionId);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const { isAdmin } = useRoles();
  const page = usePage<{ auth?: { user?: { id: number } } }>();
  const currentUserId = page.props.auth?.user?.id;

  const canManageCourse =
    isAdmin ||
    (isTutor &&
      currentUserId !== undefined &&
      course.instructor_id === currentUserId);

  const canViewContent = isAdmin || canManageCourse || isEnrolled;

  const handleSessionChange = (sessionId: string) => {
    setActiveSessionId(sessionId);

    // Update URL with new session parameter
    const url = new URL(window.location.href);
    url.searchParams.set('session', sessionId);

    router.get(
      url.pathname + url.search,
      {},
      {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      },
    );
  };

  // Listen to browser navigation changes
  useEffect(() => {
    const handlePopState = () => {
      setActiveSessionId(getInitialSessionId());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getInitialSessionId]);

  const activeSession = course.lessons.find(
    (l) => l.id.toString() === activeSessionId,
  );

  const coursesHref = isAdmin || isTutor ? '/courses/manage' : '/courses';

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Courses', href: coursesHref },
        { title: course.title, href: '#' },
      ]}
    >
      <Head title={course.title} />

      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <CourseHeader
          title={course.title}
          category={course.category}
          durationMinutes={course.duration_minutes}
          difficulty={course.difficulty}
          instructor={course.instructor}
        />

        <CourseTabs
          sessionContent={
            <SessionTabContent
              lessons={course.lessons}
              activeSessionId={activeSessionId}
              onSessionChange={handleSessionChange}
              activeSession={activeSession}
              canViewContent={canViewContent}
              canManageCourse={canManageCourse}
              isEnrolled={isEnrolled}
              courseId={course.id}
              assessments={assessments}
              isAdmin={isAdmin}
              isTutor={isTutor}
              meetingSchedules={meetingSchedules}
              onEnrollClick={() => setIsEnrollModalOpen(true)}
            />
          }
          scheduleContent={
            <ScheduleTab
              course={course}
              lessons={course.lessons}
              isEnrolled={isEnrolled}
              isTutor={isTutor}
              students={students}
              meetingSchedules={meetingSchedules}
            />
          }
          assessmentContent={
            <AssessmentTab
              course={course}
              assessments={assessments}
              submissions={submissions}
              isTutor={isTutor}
            />
          }
          gradebookContent={
            <GradebookTab
              course={course}
              isEnrolled={isEnrolled}
              isTutor={isTutor}
              students={students}
              assessments={assessments}
              submissions={submissions}
            />
          }
          scoringContent={
            <ScoringTab
              course={course}
              isEnrolled={isEnrolled}
              isTutor={isTutor}
              students={students}
              assessments={assessments}
              submissions={submissions}
            />
          }
          attendanceContent={
            <AttendanceTab
              course={course}
              isEnrolled={isEnrolled}
              isTutor={isTutor}
              students={students}
            />
          }
        />
      </div>

      <EnrollModal
        courseId={course.id}
        courseTitle={course.title}
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
      />
    </AppLayout>
  );
}
