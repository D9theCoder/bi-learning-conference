import { usePage } from '@inertiajs/react';

type RoleState = {
  isAdmin: boolean;
  isStudent: boolean;
  isTutor: boolean;
  roles: string[];
};

export function useRoles(): RoleState {
  const page = usePage<{ auth?: { roles?: string[] } }>();
  const roles = page.props.auth?.roles ?? [];

  return {
    roles,
    isAdmin: roles.includes('admin'),
    isStudent: roles.includes('student'),
    isTutor: roles.includes('tutor'),
  };
}
