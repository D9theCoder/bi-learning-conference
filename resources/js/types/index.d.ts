import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
  user: User;
  roles?: string[];
  permissions?: string[];
}

export interface BreadcrumbItem {
  title: string;
  href: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface NavItem {
  title: string;
  href: NonNullable<InertiaLinkProps['href']>;
  icon?: LucideIcon | null;
  isActive?: boolean;
}

export interface SharedData {
  name: string;
  quote: { message: string; author: string };
  auth: Auth;
  sidebarOpen: boolean;
  [key: string]: unknown;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  email_verified_at: string | null;
  two_factor_enabled?: boolean;
  total_xp?: number;
  level?: number;
  points_balance?: number;
  created_at: string;
  updated_at: string;
  [key: string]: unknown; // This allows for additional properties...
}

export interface PaginatedData<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
}

export interface UserWithRole extends User {
  roles: Array<{ id: number; name: string }>;
  can_delete?: boolean;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  instructor_id: number;
  instructor?: User;
  duration_minutes?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  is_published?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  content?: string;
  contents?: CourseContent[];
  assessments?: Assessment[];
  duration_minutes: number | null;
  order: number | null;
  video_url?: string | null;
  has_attended?: boolean;
  is_completed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentMeetingSchedule {
  id: number;
  course_id: number;
  lesson_id?: number | null;
  student_id: number;
  title: string;
  meeting_url?: string | null;
  scheduled_at: string;
  duration_minutes?: number | null;
  notes?: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  course?: Course;
  progress_percentage: number;
  status: 'active' | 'completed' | 'paused';
  last_activity_at?: string;
  enrolled_at: string;
  completed_at?: string;
  next_lesson?: Lesson;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum';
  criteria?: string;
  xp_reward: number;
  earned_at?: string;
  created_at: string;
  category?: string;
  progress?: number;
  target?: number;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  created_at: string;
}

export interface Streak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
}

export interface DailyTask {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  type: 'lesson' | 'quiz' | 'practice' | 'reading';
  lesson_id?: number;
  lesson?: Lesson;
  estimated_minutes: number;
  xp_reward: number;
  is_completed: boolean;
  completed_at?: string;
  due_date: string;
  created_at: string;
}

export interface TutorMessage {
  id: number;
  tutor_id: number;
  user_id: number;
  tutor?: User;
  content: string;
  is_read: boolean;
  sent_at: string;
  created_at: string;
}

export interface LearningStats {
  streak: number;
  longest_streak?: number;
  xp_this_week: number;
  hours_learned: number;
  active_courses: number;
  total_xp: number;
  level: number;
  points_balance: number;
  xp_in_level?: number;
  xp_for_next_level?: number;
  level_progress_percentage?: number;
}

export interface Reward {
  id: number;
  name: string;
  description: string;
  cost: number;
  icon: string;
  image_url?: string;
  category?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  is_active: boolean;
  stock?: number;
  is_claimed?: boolean;
  created_at: string;
}

export interface LeaderboardEntry {
  id: number;
  name: string;
  avatar?: string;
  xp: number;
  level: number;
  rank: number;
  isCurrentUser?: boolean;
}

export interface CourseContent {
  id: number;
  lesson_id: number;
  title: string;
  type: 'file' | 'video' | 'link' | 'assessment' | 'attendance';
  file_path?: string | null;
  url?: string | null;
  description?: string | null;
  due_date?: string | null;
  duration_minutes?: number | null;
  is_required: boolean;
  order: number | null;
  created_at: string;
  updated_at: string;
  // Assessment-specific fields
  assessment_id?: number | null;
  assessment_type?: 'practice' | 'quiz' | 'final_exam' | null;
  max_score?: number | null;
  weight_percentage?: number | null;
  allow_powerups?: boolean | null;
  allowed_powerups?: Array<{ id: number; limit: number }> | null;
}

export interface Activity {
  id: number;
  user_id: number;
  type:
    | 'lesson_completed'
    | 'task_completed'
    | 'achievement_earned'
    | 'course_enrolled'
    | 'reward_claimed'
    | 'level_up';
  title?: string;
  description: string;
  xp_earned: number;
  icon?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Powerup {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  default_limit?: number | null;
  config?: Record<string, unknown> | null;
  limit?: number | null;
}

export interface PowerupUsage {
  id: number;
  slug: string;
  used_at?: string | null;
  details?: Record<string, unknown> | null;
}

export interface WeeklyActivityDataPoint {
  day: string;
  minutes: number;
  xp: number;
}

export interface TutorDashboardCourse {
  id: number;
  title: string;
  thumbnail?: string;
  student_count: number;
  active_students: number;
  next_meeting_date?: string | null;
  next_meeting_time?: string | null;
  is_published?: boolean;
}

export interface AdminCalendarCourse {
  id: number;
  title: string;
  thumbnail?: string;
  instructor?: { id: number; name: string } | null;
  student_count: number;
  next_meeting_date?: string | null;
  next_meeting_time?: string | null;
  is_published: boolean;
}

export interface TutorDashboardChartPoint {
  course: string;
  attendance: number;
  quiz: number;
  students: number;
}

export interface TutorCalendarItem {
  id: number;
  course_id: number;
  lesson_id?: number | null;
  title: string;
  course_title: string;
  due_date: string;
  meeting_url?: string | null;
  type: string;
  category: 'meeting' | 'assessment';
}

export interface StudentCalendarItem {
  id: number;
  course_id: number;
  lesson_id?: number | null;
  title: string;
  course_title: string;
  date: string;
  time?: string | null;
  meeting_url?: string | null;
  type: string;
  category: 'meeting' | 'assessment';
}

export interface TutorRosterEntry {
  id: number;
  name: string;
  avatar?: string;
  courses: number;
  average_progress: number;
}

export interface Assessment {
  id: number;
  course_id: number;
  lesson_id?: number | null;
  type: 'practice' | 'quiz' | 'final_exam';
  title: string;
  description?: string | null;
  due_date?: string | null;
  max_score: number;
  allow_retakes?: boolean;
  time_limit_minutes?: number | null;
  is_published?: boolean;
  is_remedial?: boolean;
  weight_percentage?: number | null;
  created_at: string;
  updated_at: string;
  submissions?: AssessmentSubmission[];
  questions?: AssessmentQuestion[];
  powerups?: Powerup[];
}

export interface AssessmentSubmission {
  id: number;
  assessment_id: number;
  user_id: number;
  score?: number | null;
  feedback?: string | null;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
  assessment?: Assessment;
  attempt?: AssessmentAttempt | null;
}

export interface FinalScore {
  id: number;
  user_id: number;
  course_id: number;
  quiz_score: number;
  final_exam_score: number;
  total_score: number;
  is_remedial: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentWithSubmissions extends User {
  submissions?: AssessmentSubmission[];
  final_score?: FinalScore | null;
  meeting_schedules?: StudentMeetingSchedule[];
}

export type AnswerConfig =
  | { type: 'multiple_choice'; options: string[]; correct_index: number }
  | { type: 'fill_blank'; accepted_answers: string[] }
  | { type: 'essay' };

export interface AssessmentQuestion {
  id: number;
  assessment_id: number;
  type: 'multiple_choice' | 'fill_blank' | 'essay';
  question: string;
  answer_config: AnswerConfig;
  points: number;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface AssessmentAttempt {
  id: number;
  assessment_id: number;
  user_id: number;
  answers?: Record<string, unknown> | null;
  score?: number | null;
  total_points: number;
  started_at?: string | null;
  time_extension?: number | null;
  completed_at?: string | null;
  is_graded: boolean;
  is_remedial?: boolean;
  points_awarded?: number;
  remaining_time?: number | null;
  created_at: string;
  updated_at: string;
  user?: User;
  powerups?: PowerupUsage[];
}

// Page Props Interfaces

export interface AchievementsPageProps {
  achievements: Array<Achievement & { earned: boolean; earned_at?: string }>;
  summary: {
    total: number;
    earned: number;
    nextMilestone?: {
      id: number;
      name: string;
      progress: number;
    };
  };
}

export interface CalendarTask {
  id: number;
  course_id?: number;
  lesson_id?: number | null;
  title: string;
  due_date: string;
  completed: boolean;
  xp_reward?: number;
  course_title?: string;
  type?: string;
  category: 'task' | 'meeting' | 'assessment' | 'course';
  time?: string | null;
  meeting_url?: string | null;
}

export interface CalendarPageProps extends SharedData {
  tasksByDate: Record<string, CalendarTask[]>;
  stats: {
    total: number;
    completed: number;
    overdue: number;
    meetings: number;
    assessments: number;
  };
  currentDate: string;
  courses?: {
    data: AdminCalendarCourse[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links?: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
  };
  courseMarkers?: string[];
  cursor?: {
    start: string;
    end: string;
  };
  [key: string]: unknown;
}

export interface CoursesPageProps {
  enrolled_courses?: Array<
    Course & {
      lessons_count: number;
      user_progress?: {
        progress_percentage: number;
        next_lesson?: Lesson;
      };
    }
  >;
  filters: {
    search?: string;
    category?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    sort?: string;
  };
  courses: {
    data: Array<
      Course & {
        lessons_count: number;
        user_progress?: {
          progress_percentage: number;
          next_lesson?: Lesson;
        };
      }
    >;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ManageCoursesPageProps {
  courses: {
    data: Array<
      Course & {
        is_published: boolean;
        updated_at?: string;
        instructor?: {
          id: number;
          name: string;
        } | null;
      }
    >;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
  };
  filters?: {
    search?: string;
  };
}

export interface EditCoursePageProps {
  course:
    | (Course & {
        is_published?: boolean;
        duration_minutes?: number | null;
        instructor_id?: number | null;
        lessons?: Lesson[];
      })
    | null;
  mode: 'create' | 'edit';
  categories: Array<{ value: string; label: string }>;
  availablePowerups?: Powerup[];
  availableTutors?: Array<Pick<User, 'id' | 'name' | 'avatar'>>;
  isAdmin?: boolean;
}

export interface MessagesPageProps {
  threads: Array<{
    partner: {
      id: number;
      name: string;
      avatar?: string;
    };
    latest_message_at: string;
    unread_count: number;
  }>;
  activeThread?: {
    partner: {
      id: number;
      name: string;
      avatar?: string;
    };
    messages: {
      data: Array<{
        id: number;
        body: string;
        sender_id: number;
        created_at: string;
        read_at?: string;
      }>;
      current_page: number;
      last_page: number;
    };
  };
}

export interface RewardsPageProps {
  user: {
    points_balance: number;
  };
  rewards: {
    data: Array<
      Reward & {
        can_redeem: boolean;
        remaining_stock?: number;
      }
    >;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  filters?: {
    rarity?: string;
  };
}

export interface TutorDashboardData {
  courses: TutorDashboardCourse[];
  chart: TutorDashboardChartPoint[];
  calendar: TutorCalendarItem[];
  roster: TutorRosterEntry[];
  summary: {
    course_count: number;
    student_count: number;
    average_progress: number;
  };
}

export interface AdminDashboardData {
  tutors: Array<{
    id: number;
    name: string;
    avatar?: string;
    course_count: number;
    student_count: number;
  }>;
  courses: Array<{
    id: number;
    title: string;
    instructor: { id: number; name: string } | null;
    student_count: number;
    is_published: boolean;
  }>;
  students: Array<{
    id: number;
    name: string;
    avatar?: string;
    enrollment_count: number;
    total_xp: number;
    level: number;
  }>;
  summary: {
    tutor_count: number;
    course_count: number;
    student_count: number;
    active_enrollment_count: number;
  };
}

export interface TutorsPageProps {
  filters: {
    search?: string;
    expertise?: string;
  };
  tutors: {
    data: Array<{
      id: number;
      name: string;
      avatar?: string;
      expertise?: string[];
      rating?: number;
    }>;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface StudentsPageProps {
  filters: {
    search?: string;
  };
  students: {
    data: Array<{
      id: number;
      name: string;
      email?: string;
      avatar?: string;
      level?: number | null;
      points_balance?: number | null;
      total_xp?: number | null;
      enrollments_count?: number | null;
      active_enrollments_count?: number | null;
      enrollments?: Array<{
        id: number;
        course: {
          id: number;
          title: string;
          thumbnail?: string;
        };
        progress_percentage: number;
        status: 'active' | 'completed' | 'paused';
      }> | null;
    }>;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface UserManagementPageProps {
  users: PaginatedData<UserWithRole>;
  filters: {
    search?: string;
    role?: 'admin' | 'tutor' | 'student';
    sort_by?: 'name' | 'email' | 'created_at';
    sort_dir?: 'asc' | 'desc';
  };
}

export interface EditUserPageProps {
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    role?: 'admin' | 'tutor' | 'student';
  };
}
