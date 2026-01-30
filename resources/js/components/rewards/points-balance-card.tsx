import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins } from 'lucide-react';

interface PointsBalanceCardProps {
  balance: number;
}

export function PointsBalanceCard({ balance }: PointsBalanceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="size-5 text-yellow-500" />
          Your Points: {balance}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
