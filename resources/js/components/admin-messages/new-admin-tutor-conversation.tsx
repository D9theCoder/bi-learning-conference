import type { UserSummary } from '@/components/admin-messages/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NewAdminTutorConversationProps {
  tutors: UserSummary[];
  selectedTutorId: number | '';
  onTutorChange: (id: number | '') => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function NewAdminTutorConversation({
  tutors,
  selectedTutorId,
  onTutorChange,
  onSubmit,
}: NewAdminTutorConversationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Start a new conversation</CardTitle>
      </CardHeader>
      <CardContent>
        {tutors.length > 0 ? (
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-3 md:flex-row md:items-center"
          >
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="new-tutor"
            >
              Select a tutor
            </label>
            <Select
              value={selectedTutorId ? String(selectedTutorId) : ''}
              onValueChange={(value) =>
                onTutorChange(value ? Number(value) : '')
              }
            >
              <SelectTrigger id="new-tutor" className="md:max-w-sm">
                <SelectValue placeholder="Select a tutor" />
              </SelectTrigger>
              <SelectContent>
                {tutors.map((tutor) => (
                  <SelectItem key={tutor.id} value={String(tutor.id)}>
                    {tutor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="submit"
              className="md:w-auto"
              disabled={!selectedTutorId}
            >
              Start chat
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            No tutors available for new conversations yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
