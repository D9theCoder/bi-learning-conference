interface DashedEmptyStateProps {
  message: string;
  className?: string;
}

export function DashedEmptyState({
  message,
  className = '',
}: DashedEmptyStateProps) {
  return (
    <div
      className={`rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground dark:border-gray-700 ${className}`}
    >
      {message}
    </div>
  );
}
