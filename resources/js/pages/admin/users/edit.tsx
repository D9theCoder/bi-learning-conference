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
import type { BreadcrumbItem, EditUserPageProps } from '@/types';
import { Form, Head, Link } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'User Management', href: '/admin/users' },
  { title: 'Edit User', href: '#' },
];

export default function EditUserPage({ user }: EditUserPageProps) {
  const [role, setRole] = useState(user.role ?? 'student');

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Edit User" />

      <div className="flex flex-1 flex-col gap-6 overflow-x-auto p-4 lg:p-6">
        <PageHeader
          icon={ShieldCheck}
          title="Edit User"
          description="Update account details and role access for this user."
          iconClassName="text-indigo-500"
        />

        <Card className="w-full">
          <CardContent className="p-6">
            <Form
              action={`/admin/users/${user.id}`}
              method="post"
              className="space-y-6"
            >
              {({ errors, processing }) => (
                <>
                  <input type="hidden" name="_method" value="put" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={user.name}
                        placeholder="Jane Doe"
                      />
                      <InputError message={errors.name} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={user.email}
                        placeholder="jane@example.com"
                      />
                      <InputError message={errors.email} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="tutor">Tutor</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="role" value={role} />
                    <InputError message={errors.role} />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={processing}>
                      Save changes
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
