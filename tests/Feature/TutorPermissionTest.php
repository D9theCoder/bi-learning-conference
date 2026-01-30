<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Tests\TestCase;

class TutorPermissionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_tutor_can_view_student_data_in_their_course()
    {
        $tutor = User::factory()->create();
        $tutor->assignRole('tutor');

        $course = Course::factory()->create(['instructor_id' => $tutor->id]);
        $student = User::factory()->create();
        $student->enrollments()->create([
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now(),
            'progress_percentage' => 0,
        ]);

        // Tutor views course
        $response = $this->actingAs($tutor)->get(route('courses.show', $course));

        $response->assertOk();
        $response->assertInertia(
            fn ($page) => $page
                ->component('courses/show')
                ->where('isTutor', true)
                ->has('students', 1)
        );
    }

    public function test_student_can_see_assessments()
    {
        $tutor = User::factory()->create();
        $course = Course::factory()->create(['instructor_id' => $tutor->id]);
        $student = User::factory()->create();
        $student->assignRole('student');
        Enrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now(),
            'progress_percentage' => 0,
        ]);

        $assessment = Assessment::create([
            'course_id' => $course->id,
            'title' => 'Test Quiz',
            'type' => 'quiz',
            'max_score' => 100,
        ]);

        $response = $this->actingAs($student)->get(route('courses.show', $course));

        $response->assertOk();
        $response->assertInertia(
            fn ($page) => $page
                ->component('courses/show')
                ->where('isTutor', false)
                ->has('assessments', 1)
                ->where('assessments.0.title', 'Test Quiz')
        );
    }

    public function test_tutor_score_update_permission()
    {
        $tutor = User::factory()->create();
        $tutor->assignRole('tutor');
        $course = Course::factory()->create(['instructor_id' => $tutor->id]);
        $student = User::factory()->create();

        $assessment = Assessment::create([
            'course_id' => $course->id,
            'title' => 'Quiz 1',
            'type' => 'quiz',
            'max_score' => 100,
        ]);

        $response = $this->actingAs($tutor)->post(route('assessments.score', $assessment), [
            'user_id' => $student->id,
            'score' => 85,
            'feedback' => 'Good job',
        ]);

        $response->assertSessionHas('message', 'Score updated.');
        $this->assertDatabaseHas('assessment_submissions', [
            'assessment_id' => $assessment->id,
            'user_id' => $student->id,
            'score' => 85,
        ]);
    }
}
