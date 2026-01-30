import { useRoles } from '@/hooks/use-roles';
import { Coins } from 'lucide-react';
interface DashboardWelcomeHeaderProps {
  userName: string;
  pointsBalance?: number;
  isTutor?: boolean;
  isAdmin?: boolean;
}

export function DashboardWelcomeHeader({
  userName,
  pointsBalance = 0,
  isTutor = false,
  isAdmin = false,
}: DashboardWelcomeHeaderProps) {
  const { isStudent } = useRoles();
  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-2">
        <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight lg:text-4xl">
          Welcome back, {userName}!
        </h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? 'Monitor platform activity, course health, and student engagement.'
            : isTutor
            ? 'Monitor your classes, student activity, and upcoming deadlines at a glance.'
            : "Ready to continue your learning streak? You're doing great!"}
        </p>
      </div>
      {isStudent && (
        <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground">
          <>
            <Coins className="size-4 text-primary" />
            <span className="text-foreground">Points</span>
            <span className="text-lg font-bold text-foreground">
              {pointsBalance}
            </span>
          </>
        </div>
      )}
    </div>
  );
}
