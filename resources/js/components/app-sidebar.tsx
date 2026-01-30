import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useRoles } from '@/hooks/use-roles';
import {
  achievements,
  adminMessages,
  calendar,
  courses,
  dashboard,
  home,
  messages,
  rewards,
  tutors,
} from '@/routes';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
  BookOpen,
  Calendar as CalendarIcon,
  Folder,
  Gift,
  GraduationCap,
  LayoutGrid,
  MessageSquare,
  Shield,
  Trophy,
  Users,
  UsersRound,
} from 'lucide-react';
import AppLogo from './app-logo';

const studentNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: dashboard().url,
    icon: LayoutGrid,
  },
  {
    title: 'My Courses',
    href: courses().url,
    icon: BookOpen,
  },
  {
    title: 'Achievements',
    href: achievements().url,
    icon: Trophy,
  },
  {
    title: 'Rewards',
    href: rewards().url,
    icon: Gift,
  },
  {
    title: 'Tutors',
    href: tutors().url,
    icon: Users,
  },
  {
    title: 'Calendar',
    href: calendar().url,
    icon: CalendarIcon,
  },
  {
    title: 'Messages',
    href: messages().url,
    icon: MessageSquare,
  },
];

const tutorNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: dashboard().url,
    icon: LayoutGrid,
  },
  {
    title: 'Students',
    href: '/students',
    icon: GraduationCap,
  },
  {
    title: 'Calendar',
    href: calendar().url,
    icon: CalendarIcon,
  },
  {
    title: 'Messages',
    href: messages().url,
    icon: MessageSquare,
  },
];

export function AppSidebar() {
  const { isAdmin, isStudent, isTutor } = useRoles();
  const page = usePage<{ auth?: { adminTutorChatAvailable?: boolean } }>();
  const { url } = page;

  const showStudentView = isStudent;
  const baseNavItems = showStudentView ? studentNavItems : tutorNavItems;
  const navItems: NavItem[] = [...baseNavItems];

  if (isAdmin || isTutor) {
    const manageLink: NavItem = {
      title: 'Manage Courses',
      href: '/courses/manage',
      icon: Folder,
    };

    const insertIndex = navItems.findIndex(
      (item) => item.title === 'My Courses',
    );
    if (insertIndex >= 0) {
      navItems.splice(insertIndex + 1, 0, manageLink);
    } else {
      const dashboardIndex = navItems.findIndex(
        (item) => item.title === 'Dashboard',
      );
      if (dashboardIndex >= 0) {
        navItems.splice(dashboardIndex + 1, 0, manageLink);
      } else {
        navItems.unshift(manageLink);
      }
    }
  }

  if (isAdmin) {
    const adminUsersLink: NavItem = {
      title: 'User Management',
      href: '/admin/users',
      icon: UsersRound,
    };

    const manageIndex = navItems.findIndex(
      (item) => item.title === 'Manage Courses',
    );

    if (manageIndex >= 0) {
      navItems.splice(manageIndex + 1, 0, adminUsersLink);
    } else {
      navItems.push(adminUsersLink);
    }
  }

  // Fix active state for My Courses to avoid highlighting when in Manage Courses
  const myCoursesIndex = navItems.findIndex(
    (item) => item.title === 'My Courses',
  );
  if (myCoursesIndex >= 0) {
    navItems[myCoursesIndex].isActive =
      url === '/courses' ||
      (url.startsWith('/courses/') && !url.startsWith('/courses/manage'));
  }

  const homeHref = navItems[0]?.href ?? home().url;

  if (isTutor && page.props.auth?.adminTutorChatAvailable) {
    navItems.push({
      title: 'Admin Messages',
      href: adminMessages().url,
      icon: Shield,
    });
  }

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={homeHref}>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
