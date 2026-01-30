<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStudentMeetingScheduleRequest;
use App\Http\Requests\UpdateStudentMeetingScheduleRequest;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\StudentMeetingSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class StudentMeetingScheduleController extends Controller
{
    public function index(Request $request, Course $course): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            abort(401);
        }

        $isTutor = $user->hasRole('admin') || ($user->hasRole('tutor') && $course->instructor_id === $user->id);

        if (! $isTutor) {
            $isEnrolled = Enrollment::query()
                ->where('course_id', $course->id)
                ->where('user_id', $user->id)
                ->exists();

            if (! $isEnrolled) {
                abort(403);
            }
        }

        $query = StudentMeetingSchedule::query()
            ->where('course_id', $course->id)
            ->orderBy('scheduled_at');

        if (! $isTutor) {
            $query->where('student_id', $user->id);
        }

        $schedules = $query->get()->map(fn (StudentMeetingSchedule $schedule) => $this->formatSchedule($schedule));

        return response()->json([
            'data' => $schedules,
        ]);
    }

    public function store(StoreStudentMeetingScheduleRequest $request, Course $course): RedirectResponse
    {
        $data = $request->validated();

        $lesson = null;
        if (array_key_exists('lesson_id', $data) && $data['lesson_id']) {
            $lesson = Lesson::query()
                ->where('course_id', $course->id)
                ->find($data['lesson_id']);
        }

        $course->studentMeetingSchedules()->create([
            'lesson_id' => $data['lesson_id'] ?? null,
            'student_id' => $data['student_id'],
            'title' => $data['title'] ?? $lesson?->title ?? 'Meeting',
            'meeting_url' => $data['meeting_url'] ?? null,
            'scheduled_at' => $data['scheduled_at'],
            'duration_minutes' => $data['duration_minutes'] ?? null,
            'notes' => $data['notes'] ?? null,
            'status' => $data['status'] ?? 'scheduled',
        ]);

        return back()->with('message', 'Meeting scheduled.');
    }

    public function update(
        UpdateStudentMeetingScheduleRequest $request,
        Course $course,
        StudentMeetingSchedule $schedule
    ): RedirectResponse {
        $data = $request->validated();

        $schedule->update($data);

        return back()->with('message', 'Meeting updated.');
    }

    public function destroy(Request $request, Course $course, StudentMeetingSchedule $schedule): RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            abort(401);
        }

        if ($schedule->course_id !== $course->id) {
            abort(404);
        }

        if (! $user->hasRole('admin') && (! $user->hasRole('tutor') || $course->instructor_id !== $user->id)) {
            abort(403);
        }

        $schedule->delete();

        return back()->with('message', 'Meeting removed.');
    }

    protected function formatSchedule(StudentMeetingSchedule $schedule): array
    {
        return [
            'id' => $schedule->id,
            'course_id' => $schedule->course_id,
            'lesson_id' => $schedule->lesson_id,
            'student_id' => $schedule->student_id,
            'title' => $schedule->title,
            'meeting_url' => $schedule->meeting_url,
            'scheduled_at' => $schedule->scheduled_at?->toIsoString(),
            'duration_minutes' => $schedule->duration_minutes,
            'notes' => $schedule->notes,
            'status' => $schedule->status,
            'created_at' => $schedule->created_at?->toIsoString(),
            'updated_at' => $schedule->updated_at?->toIsoString(),
        ];
    }
}
