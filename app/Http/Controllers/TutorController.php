<?php

namespace App\Http\Controllers;

use App\Http\Requests\FilterTutorsRequest;
use App\Models\Course;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class TutorController extends Controller
{
    public function index(FilterTutorsRequest $request): Response
    {
        $filters = $request->validated();
        $user = $request->user();

        $enrolledCourseIds = $user?->enrollments()->pluck('course_id') ?? collect();

        $instructorIds = Course::query()
            ->whereIn('id', $enrolledCourseIds)
            ->whereNotNull('instructor_id')
            ->pluck('instructor_id')
            ->unique()
            ->values();

        // Query tutors using Spatie Laravel Permission or fallback to enrolled instructors
        $query = User::query();

        if ($instructorIds->isNotEmpty()) {
            // Only show instructors tied to the student's enrollments (role is optional)
            $query->whereIn('id', $instructorIds);
        } else {
            // No enrollments yet: show all users with the tutor role
            $query->role('tutor');
        }

        // Apply filters
        if (! empty($filters['search'])) {
            $query->where('name', 'like', "%{$filters['search']}%");
        }

        if (! empty($filters['expertise'])) {
            // Assuming expertise is stored as JSON or similar
            $query->whereJsonContains('expertise', $filters['expertise']);
        }

        $tutors = $query->paginate(12)->withQueryString();

        $tutors = $tutors->through(function ($tutor) {
            return [
                'id' => $tutor->id,
                'name' => $tutor->name,
                'avatar' => $tutor->avatar,
                'expertise' => $tutor->expertise ?? [],
                'rating' => $tutor->rating ?? null,
            ];
        });

        return Inertia::render('tutors/index', [
            'filters' => $filters,
            'tutors' => $tutors,
        ]);
    }
}
