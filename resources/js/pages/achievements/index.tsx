import { AchievementCard } from '@/components/achievements/achievement-card';
import { AchievementsSummary } from '@/components/achievements/achievements-summary';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { achievements } from '@/routes';
import type { AchievementsPageProps, BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Search, Trophy } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Achievements',
    href: achievements().url,
  },
];

export default function AchievementsPage({
  achievements: achievementsData,
  summary,
}: AchievementsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    'All',
    ...Array.from(
      new Set(
        achievementsData
          .map((item) => item.category)
          .filter((category): category is string => Boolean(category)),
      ),
    ),
  ];

  const filteredAchievements = achievementsData.filter((achievement) => {
    const matchesSearch = achievement.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || achievement.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Achievements" />

      <div className="flex flex-1 flex-col gap-6 overflow-x-auto p-4 lg:p-6">
        <PageHeader
          icon={Trophy}
          title="Achievements"
          description="Earn badges and unlock achievements by completing challenges and milestones."
          iconClassName="text-yellow-500"
        />

        <AchievementsSummary summary={summary} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search achievements..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAchievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>

        {filteredAchievements.length === 0 && (
          <EmptyState message="No achievements found matching your criteria." />
        )}
      </div>
    </AppLayout>
  );
}
