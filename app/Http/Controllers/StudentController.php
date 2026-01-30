<?php

namespace App\Http\Controllers;

use App\Http\Requests\FilterStudentsRequest;
use App\Models\Course;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function index(FilterStudentsRequest $request): Response
    {
        $filters = $request->validated();
        $user = Auth::user();
        $isAdmin = $user?->hasRole('admin');
        $isTutor = $user?->hasRole('tutor');
        $isAdminOrTutor = $isAdmin || $isTutor;

        $courseIds = Course::query()
            ->where('instructor_id', $user?->id)
            ->pluck('id');

        $studentIds = User::query()
            ->whereHas('enrollments', function ($query) use ($courseIds) {
                $query->whereIn('course_id', $courseIds);
            })
            ->pluck('id')
            ->unique()
            ->values();

        $query = User::query();

        if ($isAdmin) {
            $query->role('student')
                ->withCount(['enrollments', 'activeEnrollments'])
                ->with(['enrollments' => function ($query) {
                    $query->with('course:id,title,thumbnail')
                        ->select('id', 'user_id', 'course_id', 'progress_percentage', 'status')
                        ->latest();
                }]);
        } else {
            $query->whereIn('id', $studentIds);

            if ($isTutor) {
                $query->with(['enrollments' => function ($query) use ($courseIds) {
                    $query->with('course:id,title,thumbnail')
                        ->whereIn('course_id', $courseIds)
                        ->select('id', 'user_id', 'course_id', 'progress_percentage', 'status')
                        ->latest();
                }]);
            }
        }

        if (! empty($filters['search'])) {
            $query->where('name', 'like', "%{$filters['search']}%");
        }

        $students = $query->paginate(12)->withQueryString();

        $students = $students->through(function ($student) use ($isAdmin, $isAdminOrTutor) {
            $enrollmentData = null;

            if ($isAdminOrTutor && $student->enrollments) {
                $enrollmentData = $student->enrollments->map(function ($enrollment) {
                    return [
                        'id' => $enrollment->id,
                        'course' => [
                            'id' => $enrollment->course->id,
                            'title' => $enrollment->course->title,
                            'thumbnail' => $enrollment->course->thumbnail,
                        ],
                        'progress_percentage' => $enrollment->progress_percentage,
                        'status' => $enrollment->status,
                    ];
                });
            }

            return [
                'id' => $student->id,
                'name' => $student->name,
                'email' => $student->email,
                'avatar' => $student->avatar,
                'level' => $isAdmin ? ($student->level ?? 1) : null,
                'points_balance' => $isAdmin ? ($student->points_balance ?? 0) : null,
                'total_xp' => $isAdmin ? ($student->total_xp ?? 0) : null,
                'enrollments_count' => $isAdmin ? ($student->enrollments_count ?? 0) : null,
                'active_enrollments_count' => $isAdmin ? ($student->active_enrollments_count ?? 0) : null,
                'enrollments' => $enrollmentData,
            ];
        });

        return Inertia::render('students/index', [
            'filters' => $filters,
            'students' => $students,
        ]);
    }
}
