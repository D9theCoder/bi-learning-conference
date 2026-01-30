import { AccessGateWarningCard } from '@/components/courses/shared';
import {
  AttendanceSessionList,
  AttendanceSummaryCards,
  AttendanceTutorMatrix,
} from '@/components/courses/tabs/attendance';
import { Card, CardContent } from '@/components/ui/card';
import { useRoles } from '@/hooks/use-roles';
import { Course, Lesson, StudentWithSubmissions, User } from '@/types';
import { CalendarCheck } from 'lucide-react';

interface AttendanceTabProps {
  course: Course & {
    instructor: User;
    lessons: Lesson[];
  };
  isEnrolled: boolean;
  isTutor?: boolean;
  students?: StudentWithSubmissions[];
}

export function AttendanceTab({
  course,
  isEnrolled,
  isTutor = false,
  students = [],
}: AttendanceTabProps) {
  const { isAdmin } = useRoles();
  const canView = isEnrolled || isAdmin || isTutor;

  if (!canView) {
    return (
      <AccessGateWarningCard
        icon={CalendarCheck}
        title="Attendance Not Available"
        description="Enroll in this course to view your attendance records."
      />
    );
  }

  if (isTutor) {
    return (
      <AttendanceTutorMatrix lessons={course.lessons} students={students} />
    );
  }

  if (course.lessons.length === 0) {
    return (
      <Card className="border border-dashed">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No sessions have been added to this course yet.
        </CardContent>
      </Card>
    );
  }

  const totalSessions = course.lessons.length;
  const attendedSessions = course.lessons.filter(
    (lesson) => lesson.has_attended,
  ).length;
  const attendanceRate =
    totalSessions > 0
      ? Math.round((attendedSessions / totalSessions) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {isEnrolled && (
        <AttendanceSummaryCards
          totalSessions={totalSessions}
          attendedSessions={attendedSessions}
          attendanceRate={attendanceRate}
        />
      )}
      <AttendanceSessionList lessons={course.lessons} />
    </div>
  );
}
