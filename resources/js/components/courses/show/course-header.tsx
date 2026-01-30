import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Globe } from 'lucide-react';
import { DifficultyBadge } from './difficulty-badge';

interface CourseHeaderProps {
  title: string;
  category?: string | null;
  durationMinutes?: number | null;
  difficulty?: string | null;
  instructor: {
    name: string;
    avatar?: string;
  };
}

export function CourseHeader({
  title,
  category,
  durationMinutes,
  difficulty,
  instructor,
}: CourseHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
          {title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Globe className="h-4 w-4" /> {category || 'General'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" /> {durationMinutes ?? 0} mins
          </span>
          <DifficultyBadge difficulty={difficulty || 'All Levels'} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={instructor.avatar} />
          <AvatarFallback>{instructor.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase">
            Primary Instructor
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {instructor.name}
          </p>
        </div>
      </div>
    </div>
  );
}
