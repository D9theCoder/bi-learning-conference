import InputError from '@/components/input-error';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Form, Head, Link } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'User Management', href: '/admin/users' },
  { title: 'Create User', href: '/admin/users/create' },
];

export default function CreateUserPage() {
  const [role, setRole] = useState('student');

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create User" />

      <div className="flex flex-1 flex-col gap-6 overflow-x-auto p-4 lg:p-6">
        <PageHeader
          icon={UserPlus}
          title="Create User"
          description="Provision a new student or tutor account for the platform."
          iconClassName="text-emerald-500"
        />

        <Card className="w-full">
          <CardContent className="p-6">
            <Form action="/admin/users" method="post" className="space-y-6">
              {({ errors, processing }) => (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" name="name" placeholder="Jane Doe" />
                      <InputError message={errors.name} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="jane@example.com"
                      />
                      <InputError message={errors.email} />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" name="password" type="password" />
                      <InputError message={errors.password} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password_confirmation">
                        Confirm password
                      </Label>
                      <Input
                        id="password_confirmation"
                        name="password_confirmation"
                        type="password"
                      />
                      <InputError message={errors.password_confirmation} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="tutor">Tutor</SelectItem>
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="role" value={role} />
                    <InputError message={errors.role} />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={processing}>
                      Create user
                    </Button>
                    <Link href="/admin/users">
                      <Button type="button" variant="secondary">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
