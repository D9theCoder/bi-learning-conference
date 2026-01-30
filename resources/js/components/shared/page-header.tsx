import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconClassName?: string;
  className?: string;
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  iconClassName = 'text-blue-500',
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-3">
        <Icon className={`size-8 ${iconClassName}`} />
        <h1 className="text-3xl font-bold">{title}</h1>
      </div>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
