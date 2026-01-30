import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const sortLabels: Record<string, string> = {
  latest: 'Latest',
  popular: 'Popular',
  progress: 'Progress',
};

interface CourseFiltersProps {
  filters: {
    search?: string;
    difficulty?: string;
    sort?: string;
  };
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (
    key: 'search' | 'difficulty' | 'sort' | 'category',
    value: string,
  ) => void;
}

export function CourseFilters({
  filters,
  searchTerm,
  onSearchChange,
  onFilterChange,
}: CourseFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <Input
        type="search"
        placeholder="Search courses..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-xs"
      />
      <Select
        value={filters.difficulty || 'all'}
        onValueChange={(value) => onFilterChange('difficulty', value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Difficulty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Levels</SelectItem>
          <SelectItem value="beginner">Beginner</SelectItem>
          <SelectItem value="intermediate">Intermediate</SelectItem>
          <SelectItem value="advanced">Advanced</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.sort ?? 'latest'}
        onValueChange={(value) => onFilterChange('sort', value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue>
            {(() => {
              const current = filters.sort ?? 'latest';
              return sortLabels[current] ?? 'Latest';
            })()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="latest">Latest</SelectItem>
          <SelectItem value="popular">Popular</SelectItem>
          <SelectItem value="progress">Progress</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
