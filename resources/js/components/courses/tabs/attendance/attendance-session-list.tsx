import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lesson } from '@/types';
import { CalendarCheck, CheckCircle, XCircle } from 'lucide-react';

interface AttendanceSessionListProps {
  lessons: Lesson[];
}

export function AttendanceSessionList({ lessons }: AttendanceSessionListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <CalendarCheck className="h-5 w-5 text-yellow-600" />
          Session Attendance
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          View attendance records for each session
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className="flex items-center justify-between rounded-lg border p-3 dark:border-gray-700"
            >
              <div className="flex flex-col">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Session {index + 1}: {lesson.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {lesson.duration_minutes
                    ? `${lesson.duration_minutes} mins`
                    : 'Duration not set'}
                </p>
              </div>
              {lesson.has_attended ? (
                <Badge className="flex items-center gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle className="h-3 w-3" />
                  Attended
                </Badge>
              ) : (
                <Badge className="flex items-center gap-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <XCircle className="h-3 w-3" />
                  Not Attended
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
