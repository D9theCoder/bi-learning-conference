import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, UserManagementPageProps } from '@/types';
import { Form, Head, Link, router } from '@inertiajs/react';
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Plus,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'User Management', href: '/admin/users' },
];

const roleOptions = [
  { value: 'all', label: 'All roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'tutor', label: 'Tutor' },
  { value: 'student', label: 'Student' },
];

const roleStyles: Record<string, string> = {
  admin: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200',
  tutor: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200',
  student:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200',
};

export default function UserManagementPage({
  users,
  filters,
}: UserManagementPageProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search ?? '');
  const [role, setRole] = useState(filters.role ?? 'all');
  const currentRole = filters.role ?? 'all';
  const currentSortBy = filters.sort_by ?? 'created_at';
  const currentSortDir = filters.sort_dir ?? 'desc';

  const handleFilterChange = useCallback(
    (
      key: keyof UserManagementPageProps['filters'],
      value: string | undefined,
    ) => {
      router.get(
        '/admin/users',
        { ...filters, [key]: value, page: 1 },
        { preserveState: true, replace: true },
      );
    },
    [filters],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (filters.search ?? '')) {
        handleFilterChange('search', searchTerm || undefined);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [filters.search, handleFilterChange, searchTerm]);

  useEffect(() => {
    const nextRole = role === 'all' ? undefined : role;
    if (role !== currentRole) {
      handleFilterChange('role', nextRole);
    }
  }, [currentRole, handleFilterChange, role]);

  const handleSort = useCallback(
    (column: UserManagementPageProps['filters']['sort_by']) => {
      if (!column) {
        return;
      }

      const defaultDir = column === 'created_at' ? 'desc' : 'asc';
      const nextDir =
        currentSortBy === column
          ? currentSortDir === 'asc'
            ? 'desc'
            : 'asc'
          : defaultDir;

      router.get(
        '/admin/users',
        {
          ...filters,
          sort_by: column,
          sort_dir: nextDir,
          page: 1,
        },
        { preserveState: true, replace: true },
      );
    },
    [currentSortBy, currentSortDir, filters],
  );

  const hasPagination = useMemo(() => users.last_page > 1, [users.last_page]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="User Management" />

      <div className="flex flex-1 flex-col gap-6 overflow-x-auto p-4 lg:p-6">
        <PageHeader
          icon={UsersRound}
          title="User Management"
          description="Create and manage student and tutor accounts across the platform."
          iconClassName="text-amber-500"
        />

        <Card className="border-dashed">
          <CardContent className="grid gap-4 p-4 md:grid-cols-[1.2fr_auto] md:items-center">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name or email..."
              className="w-full"
            />
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Link href="/admin/users/create" className="ml-auto">
                <Button className="inline-flex items-center gap-2">
                  <Plus className="size-4" />
                  Create User
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card noPadding>
          <CardContent noPadding>
            <div className="p-2">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto px-0 font-medium"
                      onClick={() => handleSort('name')}
                    >
                      User
                      {currentSortBy === 'name' ? (
                        currentSortDir === 'asc' ? (
                          <ArrowUp className="ml-2 size-4" />
                        ) : (
                          <ArrowDown className="ml-2 size-4" />
                        )
                      ) : null}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto px-0 font-medium"
                      onClick={() => handleSort('email')}
                    >
                      Email
                      {currentSortBy === 'email' ? (
                        currentSortDir === 'asc' ? (
                          <ArrowUp className="ml-2 size-4" />
                        ) : (
                          <ArrowDown className="ml-2 size-4" />
                        )
                      ) : null}
                    </Button>
                  </TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto px-0 font-medium"
                      onClick={() => handleSort('created_at')}
                    >
                      Created
                      {currentSortBy === 'created_at' ? (
                        currentSortDir === 'asc' ? (
                          <ArrowUp className="ml-2 size-4" />
                        ) : (
                          <ArrowDown className="ml-2 size-4" />
                        )
                      ) : null}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {user.roles.map((role) => (
                          <Badge
                            key={role.id}
                            variant="outline"
                            className={roleStyles[role.name] ?? ''}
                          >
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/users/${user.id}/edit`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="inline-flex items-center gap-2"
                          >
                            <Pencil className="size-4" />
                            Edit
                          </Button>
                        </Link>
                        {user.can_delete ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="inline-flex items-center gap-2"
                              >
                                <Trash2 className="size-4" />
                                Delete
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogTitle>
                                Delete {user.name}?
                              </DialogTitle>
                              <DialogDescription>
                                This will deactivate the user and remove access
                                to the platform. You can restore the account
                                later if needed.
                              </DialogDescription>
                              <Form
                                method="delete"
                                action={`/admin/users/${user.id}`}
                                className="space-y-6"
                              >
                                {({ processing }) => (
                                  <DialogFooter className="gap-2">
                                    <DialogClose asChild>
                                      <Button variant="secondary">
                                        Cancel
                                      </Button>
                                    </DialogClose>
                                    <Button
                                      variant="destructive"
                                      disabled={processing}
                                      asChild
                                    >
                                      <button type="submit">
                                        Confirm delete
                                      </button>
                                    </Button>
                                  </DialogFooter>
                                )}
                              </Form>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Button size="sm" variant="secondary" disabled>
                            Current user
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {users.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState message="No users match these filters." />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {hasPagination && (
          <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
            <span>
              Showing {users.data.length} of {users.total}
            </span>
            <div className="flex items-center gap-1">
              {users.links.map((link, i) =>
                link.url ? (
                  <Link
                    key={i}
                    href={link.url}
                    className={`flex h-8 min-w-8 items-center justify-center rounded-md border px-3 ${
                      link.active
                        ? 'bg-primary text-primary-foreground'
                        : 'border-transparent hover:bg-muted'
                    }`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ) : (
                  <span
                    key={i}
                    className="flex h-8 min-w-8 items-center justify-center px-3 text-muted-foreground opacity-50"
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ),
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
