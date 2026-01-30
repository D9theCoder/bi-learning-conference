import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { messages } from '@/routes';
import { Link } from '@inertiajs/react';
import { MessageSquare, Star } from 'lucide-react';

interface TutorCardProps {
  tutor: {
    id: number;
    name: string;
    avatar?: string;
    expertise?: string[];
    rating?: number;
  };
}

export function TutorCard({ tutor }: TutorCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Avatar className="size-12">
            <AvatarImage src={tutor.avatar} />
            <AvatarFallback>{tutor.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-base">{tutor.name}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        {tutor.rating && (
          <div className="flex items-center gap-1 text-sm">
            <Star className="size-4 fill-yellow-500 text-yellow-500" />
            <span>{tutor.rating.toFixed(1)}</span>
          </div>
        )}
        {tutor.expertise && tutor.expertise.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tutor.expertise.map((skill, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="mt-auto">
        <Link href={`${messages().url}?partner=${tutor.id}`} className="w-full">
          <Button className="w-full" size="sm">
            <MessageSquare className="mr-2 size-4" />
            Contact Tutor
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
