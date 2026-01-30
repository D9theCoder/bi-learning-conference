import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  );
}
