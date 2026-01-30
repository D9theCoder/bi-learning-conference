import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface AccessGateWarningCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function AccessGateWarningCard({
  icon: Icon,
  title,
  description,
}: AccessGateWarningCardProps) {
  return (
    <Card className="gap-0 border-yellow-200 bg-yellow-50 py-0 dark:border-yellow-800 dark:bg-yellow-900/10">
      <CardContent className="py-12 text-center">
        <Icon className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
        <h3 className="mb-2 text-lg font-semibold text-yellow-800 dark:text-yellow-400">
          {title}
        </h3>
        <p className="text-sm text-yellow-700 dark:text-yellow-500">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
