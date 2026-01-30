import { AccessGateWarningCard } from '@/components/courses/shared';
import {
  ScheduleCalendarView,
  ScheduleStudentView,
  ScheduleTutorView,
} from '@/components/courses/tabs/schedule';
import { useRoles } from '@/hooks/use-roles';
import type {
  Course,
  Lesson,
  StudentMeetingSchedule,
  StudentWithSubmissions,
  User,
} from '@/types';
import { CalendarDays } from 'lucide-react';

interface ScheduleTabProps {
  course: Course & {
    instructor: User;
  };
  lessons: Lesson[];
  isEnrolled: boolean;
  isTutor?: boolean;
  students?: StudentWithSubmissions[];
  meetingSchedules?: StudentMeetingSchedule[];
}

export function ScheduleTab({
  course,
  lessons,
  isEnrolled,
  isTutor = false,
  students = [],
  meetingSchedules = [],
}: ScheduleTabProps) {
  const { isAdmin } = useRoles();
  const canView = isEnrolled || isAdmin || isTutor;

  if (! canView) {
    return (
      <AccessGateWarningCard
        icon={CalendarDays}
        title="Schedule Not Available"
        description="Enroll in this course to view your meeting schedule."
      />
    );
  }

  if (isTutor) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ScheduleTutorView
          courseId={course.id}
          lessons={lessons}
          students={students}
        />
        <ScheduleCalendarView schedules={meetingSchedules} />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <ScheduleStudentView schedules={meetingSchedules} />
      <ScheduleCalendarView schedules={meetingSchedules} title="Your Calendar" />
    </div>
  );
}
