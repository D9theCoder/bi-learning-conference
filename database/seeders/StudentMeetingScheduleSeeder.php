<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\StudentMeetingSchedule;
use App\Models\User;
use Illuminate\Database\Seeder;

class StudentMeetingScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $student = User::where('email', 'student@gmail.com')->first();
        $studentOne = User::where('email', 'student1@gmail.com')->first();
        $basicCourse = Course::where('title', 'Basic Mathematics')->first();
        $advancedCourse = Course::where('title', 'Advanced Mathematics')->first();

        if ($student && $basicCourse) {
            $this->createStudentSchedules($basicCourse, $student, 1);
        }

        if ($studentOne && $basicCourse) {
            $this->createStudentSchedules($basicCourse, $studentOne, 1);
        }

        if ($studentOne && $advancedCourse) {
            $this->createStudentSchedules($advancedCourse, $studentOne, 8);
        }
    }

    private function createStudentSchedules(Course $course, User $student, int $startOffsetDays): void
    {
        $startDate = now()->startOfDay()->addDays($startOffsetDays);

        $course->lessons()
            ->orderBy('order')
            ->get()
            ->each(function (Lesson $lesson) use ($course, $student, $startDate) {
                $scheduledAt = $startDate
                    ->copy()
                    ->addDays(max($lesson->order - 1, 0))
                    ->setTime(10, 0);

                StudentMeetingSchedule::updateOrCreate(
                    [
                        'course_id' => $course->id,
                        'lesson_id' => $lesson->id,
                        'student_id' => $student->id,
                    ],
                    [
                        'title' => "1:1 - {$lesson->title}",
                        'meeting_url' => $this->buildMeetingUrl($course, $lesson, $student),
                        'scheduled_at' => $scheduledAt,
                        'duration_minutes' => $lesson->duration_minutes,
                        'status' => 'scheduled',
                    ]
                );
            });
    }

    private function buildMeetingUrl(Course $course, Lesson $lesson, User $student): string
    {
        $seed = ($course->id * 1000) + (($lesson->order ?? 1) * 10) + ($student->id % 10);
        $meetingId = 9100000000 + $seed;

        return sprintf('https://zoom.us/j/%d', $meetingId);
    }
}
