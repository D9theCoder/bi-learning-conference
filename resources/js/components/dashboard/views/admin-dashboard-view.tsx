import { DashboardWelcomeHeader } from '@/components/dashboard/sections';
import { StatCard } from '@/components/dashboard/stat-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminDashboardData } from '@/types';
import { BookOpen, GraduationCap, TrendingUp, Users } from 'lucide-react';

interface AdminDashboardViewProps {
  userName: string;
  adminData: AdminDashboardData;
  isLoading: boolean;
}

export function AdminDashboardView({
  userName,
  adminData,
  isLoading,
}: AdminDashboardViewProps) {
  return (
    <div className="flex h-full flex-1 flex-col gap-8 overflow-x-auto p-4 lg:p-8">
      <DashboardWelcomeHeader userName={userName} isAdmin pointsBalance={0} />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Tutors"
          value={adminData.summary.tutor_count}
          color="blue"
          disableHover
          animate={!isLoading}
        />
        <StatCard
          icon={BookOpen}
          label="Total Courses"
          value={adminData.summary.course_count}
          color="green"
          disableHover
          animate={!isLoading}
        />
        <StatCard
          icon={GraduationCap}
          label="Total Students"
          value={adminData.summary.student_count}
          color="orange"
          disableHover
          animate={!isLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="Active Enrollments"
          value={adminData.summary.active_enrollment_count}
          color="pink"
          disableHover
          animate={!isLoading}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Tutors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {adminData.tutors.map((tutor) => (
              <div key={tutor.id} className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarImage src={tutor.avatar} />
                  <AvatarFallback>{tutor.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{tutor.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {tutor.course_count} courses · {tutor.student_count}{' '}
                    students
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {adminData.courses.slice(0, 10).map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {course.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {course.instructor?.name ?? 'Unassigned'}
                  </p>
                </div>
                <Badge variant={course.is_published ? 'default' : 'secondary'}>
                  {course.is_published ? 'Published' : 'Draft'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Students</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {adminData.students.slice(0, 10).map((student) => (
              <div key={student.id} className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarImage src={student.avatar} />
                  <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{student.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Level {student.level} · {student.total_xp} XP
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
