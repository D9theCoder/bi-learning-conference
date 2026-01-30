import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lesson, User } from '@/types';
import { CalendarCheck, CheckCircle, XCircle } from 'lucide-react';

interface StudentWithAttendance extends User {
  attendances?: Array<{ lesson_id: number }>;
}

interface AttendanceTutorMatrixProps {
  lessons: Lesson[];
  students: StudentWithAttendance[];
}

export function AttendanceTutorMatrix({
  lessons,
  students,
}: AttendanceTutorMatrixProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <CalendarCheck className="h-5 w-5 text-yellow-600" />
          Attendance Management
        </CardTitle>
        <p className="text-sm text-gray-500">
          Track student attendance across all sessions.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="mb-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 font-medium text-gray-500">Student</th>
                {lessons.map((lesson, idx) => (
                  <th
                    key={lesson.id}
                    className="p-3 text-center font-medium whitespace-nowrap text-gray-500"
                  >
                    S{idx + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={student.avatar}
                            alt={student.name}
                          />
                          <AvatarFallback>
                            {student.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {student.name}
                        </div>
                      </div>
                    </td>
                    {lessons.map((lesson) => {
                      const hasAttended = student.attendances?.some(
                        (a: { lesson_id: number }) => a.lesson_id === lesson.id,
                      );
                      return (
                        <td key={lesson.id} className="p-3 text-center">
                          <div className="flex justify-center">
                            {hasAttended ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-gray-200 dark:text-gray-700" />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={lessons.length + 1}
                    className="p-6 text-center text-gray-500"
                  >
                    No students enrolled.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
