<?php

namespace App\Http\Controllers;

use App\Http\Requests\EnrollCourseRequest;
use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Http\RedirectResponse;

class EnrollmentController extends Controller
{
    public function store(EnrollCourseRequest $request, Course $course): RedirectResponse
    {
        $user = $request->user();

        // Check if already enrolled
        $existing = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        if ($existing) {
            return back()->with('message', 'Already enrolled in this course');
        }

        // Create enrollment
        Enrollment::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'status' => 'active',
            'progress_percentage' => 0,
            'enrolled_at' => now(),
        ]);

        return redirect()->route('courses')->with('message', 'Successfully enrolled!');
    }
}
