import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface AttendanceSummaryCardsProps {
  totalSessions: number;
  attendedSessions: number;
  attendanceRate: number;
}

export function AttendanceSummaryCards({
  totalSessions,
  attendedSessions,
  attendanceRate,
}: AttendanceSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm text-gray-500">Total Sessions</p>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{totalSessions}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm text-gray-500">Attended</p>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">
            {attendedSessions}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm text-gray-500">Attendance Rate</p>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-600">{attendanceRate}%</p>
        </CardContent>
      </Card>
    </div>
  );
}
