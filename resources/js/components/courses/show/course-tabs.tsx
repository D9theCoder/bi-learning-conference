import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRoles } from '@/hooks/use-roles';
import { router } from '@inertiajs/react';
import {
  BookOpen,
  Clock,
  CalendarCheck,
  CheckCircle,
  ClipboardList,
  Star,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';

interface CourseTabsProps {
  sessionContent: ReactNode;
  scheduleContent: ReactNode;
  assessmentContent: ReactNode;
  gradebookContent: ReactNode;
  scoringContent: ReactNode;
  attendanceContent: ReactNode;
}

type TabValue =
  | 'session'
  | 'schedule'
  | 'assessment'
  | 'gradebook'
  | 'scoring'
  | 'attendance';

const validTabs: TabValue[] = [
  'session',
  'schedule',
  'assessment',
  'gradebook',
  'scoring',
  'attendance',
];

export function CourseTabs({
  sessionContent,
  scheduleContent,
  assessmentContent,
  gradebookContent,
  scoringContent,
  attendanceContent,
}: CourseTabsProps) {
  const { isAdmin, isTutor } = useRoles();
  const canAccessGradebook = isAdmin || isTutor;

  // Read initial tab from URL query parameter
  const getInitialTab = useCallback((): TabValue => {
    if (typeof window === 'undefined') return 'session';

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as TabValue | null;

    // Validate tab parameter
    if (tabParam && validTabs.includes(tabParam)) {
      if (tabParam === 'gradebook' && !canAccessGradebook) {
        return 'session';
      }
      return tabParam;
    }

    return 'session';
  }, [canAccessGradebook]);

  const [activeTab, setActiveTab] = useState<TabValue>(getInitialTab);

  // Sync tab changes to URL
  const handleTabChange = (value: string) => {
    const newTab = value as TabValue;
    setActiveTab(newTab);

    // Update URL with new tab parameter using Inertia router
    const url = new URL(window.location.href);
    url.searchParams.set('tab', newTab);

    router.get(
      url.pathname + url.search,
      {},
      {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      },
    );
  };

  // Listen to browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const newTab = getInitialTab();
      setActiveTab(newTab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getInitialTab]);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <div className="border-b">
        <TabsList className="flex h-auto w-full flex-wrap items-center justify-start gap-0 rounded-none bg-transparent p-0">
          <TabsTrigger
            value="session"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm data-[state=active]:border-yellow-500 data-[state=active]:text-yellow-600 data-[state=active]:shadow-none"
          >
            <BookOpen className="mr-1.5 h-4 w-4" />
            Session
          </TabsTrigger>
          <TabsTrigger
            value="schedule"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm data-[state=active]:border-yellow-500 data-[state=active]:text-yellow-600 data-[state=active]:shadow-none"
          >
            <Clock className="mr-1.5 h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger
            value="assessment"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm data-[state=active]:border-yellow-500 data-[state=active]:text-yellow-600 data-[state=active]:shadow-none"
          >
            <ClipboardList className="mr-1.5 h-4 w-4" />
            Assessment
          </TabsTrigger>
          {canAccessGradebook && (
            <TabsTrigger
              value="gradebook"
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm data-[state=active]:border-yellow-500 data-[state=active]:text-yellow-600 data-[state=active]:shadow-none"
            >
              <Star className="mr-1.5 h-4 w-4" />
              Gradebook
            </TabsTrigger>
          )}
          <TabsTrigger
            value="scoring"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm data-[state=active]:border-yellow-500 data-[state=active]:text-yellow-600 data-[state=active]:shadow-none"
          >
            <CheckCircle className="mr-1.5 h-4 w-4" />
            Scoring
          </TabsTrigger>
          <TabsTrigger
            value="attendance"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm data-[state=active]:border-yellow-500 data-[state=active]:text-yellow-600 data-[state=active]:shadow-none"
          >
            <CalendarCheck className="mr-1.5 h-4 w-4" />
            Attendance
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="session" className="mt-4 space-y-6">
        {sessionContent}
      </TabsContent>

      <TabsContent value="schedule" className="mt-4">
        {scheduleContent}
      </TabsContent>

      <TabsContent value="assessment" className="mt-4">
        {assessmentContent}
      </TabsContent>

      {canAccessGradebook && (
        <TabsContent value="gradebook" className="mt-4">
          {gradebookContent}
        </TabsContent>
      )}

      <TabsContent value="scoring" className="mt-4">
        {scoringContent}
      </TabsContent>

      <TabsContent value="attendance" className="mt-4">
        {attendanceContent}
      </TabsContent>
    </Tabs>
  );
}
