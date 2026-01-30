import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import CountUp from 'react-countup';

export interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: number;
  variant?: 'default' | 'accent';
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'pink' | 'yellow';
  className?: string;
  animate?: boolean;
  disableHover?: boolean;
}

const colorStyles = {
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  orange:
    'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  purple:
    'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  yellow:
    'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  variant = 'default',
  color,
  className,
  animate = false,
  disableHover = false,
}: StatCardProps) {
  const isNumber =
    typeof value === 'number' ||
    (typeof value === 'string' && !isNaN(Number(value)));
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  return (
    <Card
      className={cn(
        'overflow-hidden border border-border shadow-sm',
        disableHover
          ? 'cursor-default'
          : 'transition-all hover:scale-[1.02] hover:border-primary/30',
        className,
      )}
    >
      <CardContent className="flex items-center gap-4 p-6">
        <div
          className={cn(
            'relative flex size-12 items-center justify-center rounded-xl shadow-sm',
            color
              ? colorStyles[color]
              : variant === 'accent'
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground',
          )}
        >
          {animate &&
          label.toLowerCase().includes('streak') &&
          numericValue > 0 ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Icon className="size-6" />
            </motion.div>
          ) : (
            <Icon className="size-6" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight">
              {isNumber ? (
                <CountUp
                  end={numericValue as number}
                  duration={2}
                  separator=","
                />
              ) : (
                value
              )}
            </p>
            {trend !== undefined && (
              <Badge
                variant={trend >= 0 ? 'default' : 'secondary'}
                className={cn(
                  'ml-auto',
                  trend >= 0
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200',
                )}
              >
                {trend >= 0 ? '+' : ''}
                {trend}%
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
