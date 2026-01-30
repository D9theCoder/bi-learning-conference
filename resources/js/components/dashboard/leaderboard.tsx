import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Award, Medal, Trophy } from 'lucide-react';

interface LeaderboardEntry {
  id: number;
  name: string;
  avatar?: string;
  xp: number;
  level: number;
  rank: number;
  isCurrentUser?: boolean;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  className?: string;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="size-5 text-yellow-500" />;
    case 2:
      return <Medal className="size-5 text-gray-400" />;
    case 3:
      return <Award className="size-5 text-amber-600" />;
    default:
      return null;
  }
};

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20';
    case 2:
      return 'bg-gray-500/10 text-gray-500 dark:bg-gray-500/20';
    case 3:
      return 'bg-amber-600/10 text-amber-600 dark:bg-amber-600/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function Leaderboard({
  entries,
  className,
}: LeaderboardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold">Leaderboard</span>
          <Badge variant="outline">Global</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="flex flex-col gap-2">
            {entries.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                No leaderboard data yet
              </p>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3 transition-all hover:bg-muted/50',
                    entry.isCurrentUser &&
                      'border-primary bg-primary/5 shadow-sm',
                  )}
                >
                  <div
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-full font-bold',
                      getRankColor(entry.rank),
                    )}
                  >
                    {getRankIcon(entry.rank) || entry.rank}
                  </div>

                  <Avatar className="size-10 shrink-0">
                    <AvatarImage src={entry.avatar} alt={entry.name} />
                    <AvatarFallback>
                      {entry.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        entry.isCurrentUser && 'text-primary',
                      )}
                    >
                      {entry.name}
                      {entry.isCurrentUser && (
                        <Badge variant="secondary" className="ml-2">
                          You
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Level {entry.level}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {entry.xp.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
