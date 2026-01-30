import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';

interface EnrollModalProps {
  courseId: number;
  courseTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EnrollModal({
  courseId,
  courseTitle,
  isOpen,
  onClose,
}: EnrollModalProps) {
  const { post, processing } = useForm({});

  const handleEnroll = () => {
    post(`/courses/${courseId}/enroll`, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll in Course</DialogTitle>
          <DialogDescription>
            Are you sure you want to enroll in <strong>{courseTitle}</strong>?
            You will gain access to all course materials and track your
            progress.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleEnroll} disabled={processing}>
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Enrollment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
