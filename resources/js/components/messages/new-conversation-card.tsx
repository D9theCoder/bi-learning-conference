import type { ContactUser } from '@/components/messages/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NewConversationCardProps {
  contacts: ContactUser[];
  selectedContactId: number | '';
  onContactChange: (id: number | '') => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function NewConversationCard({
  contacts,
  selectedContactId,
  onContactChange,
  onSubmit,
}: NewConversationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Start a new conversation</CardTitle>
      </CardHeader>
      <CardContent>
        {contacts.length > 0 ? (
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-3 md:flex-row md:items-center"
          >
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="new-partner"
            >
              {contacts[0]?.role === 'tutor'
                ? 'Select a tutor'
                : 'Select a student'}
            </label>
            <Select
              value={selectedContactId ? String(selectedContactId) : ''}
              onValueChange={(value) =>
                onContactChange(value ? Number(value) : '')
              }
            >
              <SelectTrigger id="new-partner" className="md:max-w-sm">
                <SelectValue
                  placeholder={
                    contacts[0]?.role === 'tutor'
                      ? 'Select a tutor'
                      : 'Select a student'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={String(contact.id)}>
                    {contact.name}{' '}
                    {contact.role === 'tutor' ? '(Tutor)' : '(Student)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="submit"
              className="md:w-auto"
              disabled={!selectedContactId}
            >
              Start chat
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            No eligible contacts yet. Enroll in a course to message your tutor
            or accept students in your course.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
