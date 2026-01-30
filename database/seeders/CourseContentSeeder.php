<?php

namespace Database\Seeders;

use App\Models\Assessment;
use App\Models\Course;
use App\Models\CourseContent;
use App\Models\Lesson;
use Illuminate\Database\Seeder;

class CourseContentSeeder extends Seeder
{
    /**
     * Seed fixed math course content with real-world resources.
     */
    public function run(): void
    {
        $basicCourse = Course::where('title', 'Basic Mathematics')->first();
        $advancedCourse = Course::where('title', 'Advanced Mathematics')->first();

        if ($basicCourse) {
            $this->seedCourseContent($basicCourse, $this->basicMathematicsLessons());
        }

        if ($advancedCourse) {
            $this->seedCourseContent($advancedCourse, $this->advancedMathematicsLessons());
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $lessonDefinitions
     */
    private function seedCourseContent(Course $course, array $lessonDefinitions): void
    {
        $course->lessons()->each(static function (Lesson $lesson): void {
            $lesson->contents()->delete();
        });

        $course->assessments()->delete();
        $course->lessons()->delete();

        foreach ($lessonDefinitions as $index => $lessonData) {
            $lesson = Lesson::create([
                'course_id' => $course->id,
                'title' => $lessonData['title'],
                'description' => $lessonData['description'],
                'duration_minutes' => $lessonData['duration_minutes'],
                'order' => $index + 1,
            ]);

            foreach ($lessonData['contents'] ?? [] as $contentIndex => $contentData) {
                CourseContent::create([
                    'lesson_id' => $lesson->id,
                    'title' => $contentData['title'],
                    'type' => $contentData['type'],
                    'file_path' => $contentData['file_path'] ?? null,
                    'url' => $contentData['url'] ?? null,
                    'description' => $contentData['description'] ?? null,
                    'duration_minutes' => $contentData['duration_minutes'] ?? null,
                    'is_required' => $contentData['is_required'] ?? true,
                    'order' => $contentData['order'] ?? $contentIndex + 1,
                ]);
            }

            if (! isset($lessonData['assessment'])) {
                continue;
            }

            $assessmentDefinition = $lessonData['assessment'];

            $assessment = Assessment::create([
                'course_id' => $course->id,
                'lesson_id' => $lesson->id,
                'type' => $assessmentDefinition['type'],
                'title' => $assessmentDefinition['title'],
                'description' => $assessmentDefinition['description'],
                'due_date' => $assessmentDefinition['due_date'],
                'max_score' => $assessmentDefinition['max_score'] ?? 100,
                'allow_retakes' => $assessmentDefinition['allow_retakes'],
                'time_limit_minutes' => $assessmentDefinition['time_limit_minutes'],
                'is_published' => true,
                'weight_percentage' => $assessmentDefinition['weight_percentage'] ?? null,
            ]);

            $assessment->questions()->createMany($lessonData['questions']);
            $assessment->update([
                'max_score' => $assessment->questions()->sum('points'),
            ]);
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function basicMathematicsLessons(): array
    {
        return [
            [
                'title' => 'Lesson 1: Introduction to Algebra',
                'description' => 'Learn about variables, expressions, and the building blocks of equations.',
                'duration_minutes' => 60,
                'contents' => [
                    [
                        'title' => 'Khan Academy Algebra Course',
                        'type' => 'link',
                        'url' => 'https://www.khanacademy.org/math/algebra',
                        'description' => 'Overview of algebra fundamentals with guided practice.',
                        'duration_minutes' => 25,
                        'is_required' => true,
                    ],
                ],
            ],
            [
                'title' => 'Lesson 2: Linear Equations',
                'description' => 'Solve and graph linear equations using multiple strategies.',
                'duration_minutes' => 60,
                'contents' => [
                    [
                        'title' => 'Solving Linear Equations (Video)',
                        'type' => 'video',
                        'url' => 'https://www.youtube.com/watch?v=Z9N2LD1mu4c',
                        'description' => 'Walkthrough of solving linear equations step-by-step.',
                        'duration_minutes' => 18,
                        'is_required' => true,
                    ],
                ],
            ],
            [
                'title' => 'Lesson 3: Geometry Fundamentals',
                'description' => 'Explore points, lines, angles, and foundational geometry vocabulary.',
                'duration_minutes' => 60,
                'contents' => [
                    [
                        'title' => 'Euclid\'s Elements (PDF)',
                        'type' => 'link',
                        'url' => 'https://www.gutenberg.org/files/21076/21076-pdf.pdf',
                        'description' => 'Classic geometry reference for foundational concepts.',
                        'duration_minutes' => 25,
                        'is_required' => true,
                    ],
                ],
            ],
            [
                'title' => 'Lesson 4: Quiz - Algebra & Geometry Basics',
                'description' => 'Test your understanding of core algebra and geometry ideas.',
                'duration_minutes' => 30,
                'assessment' => [
                    'type' => 'quiz',
                    'title' => 'Quiz - Algebra & Geometry Basics',
                    'description' => 'A quick knowledge check covering algebra and geometry essentials.',
                    'due_date' => now()->addDays(3),
                    'allow_retakes' => true,
                    'time_limit_minutes' => 30,
                ],
                'questions' => $this->basicQuizQuestions(),
            ],
            [
                'title' => 'Lesson 5: Practice - Problem Solving',
                'description' => 'Practice applying algebra and geometry skills to real problems.',
                'duration_minutes' => 45,
                'assessment' => [
                    'type' => 'practice',
                    'title' => 'Practice - Problem Solving',
                    'description' => 'Practice questions to build confidence and speed.',
                    'due_date' => now()->addDays(4),
                    'allow_retakes' => true,
                    'time_limit_minutes' => 25,
                ],
                'questions' => $this->basicPracticeQuestions(),
            ],
            [
                'title' => 'Lesson 6: Final Exam - Basic Mathematics',
                'description' => 'Comprehensive final assessment with mixed question types.',
                'duration_minutes' => 45,
                'assessment' => [
                    'type' => 'final_exam',
                    'title' => 'Final Exam - Basic Mathematics',
                    'description' => 'Comprehensive final exam for the course.',
                    'due_date' => now()->addDays(6),
                    'allow_retakes' => false,
                    'time_limit_minutes' => 45,
                    'weight_percentage' => 80,
                ],
                'questions' => $this->basicFinalExamQuestions(),
            ],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function advancedMathematicsLessons(): array
    {
        return [
            [
                'title' => 'Lesson 1: Introduction to Calculus',
                'description' => 'Explore limits, continuity, and the intuition behind calculus.',
                'duration_minutes' => 60,
                'contents' => [
                    [
                        'title' => 'Essence of Calculus: Chapter 1 (Video)',
                        'type' => 'video',
                        'url' => 'https://www.youtube.com/watch?v=WUvTyaaNkzM',
                        'description' => 'Visual introduction to the big ideas of calculus.',
                        'duration_minutes' => 20,
                        'is_required' => true,
                    ],
                ],
            ],
            [
                'title' => 'Lesson 2: Derivatives',
                'description' => 'Understand derivatives as rates of change and slopes.',
                'duration_minutes' => 60,
                'contents' => [
                    [
                        'title' => 'The Derivative (Video)',
                        'type' => 'video',
                        'url' => 'https://www.youtube.com/watch?v=9vKqVkMQHKk',
                        'description' => 'A visual explanation of derivatives and tangent lines.',
                        'duration_minutes' => 20,
                        'is_required' => true,
                    ],
                ],
            ],
            [
                'title' => 'Lesson 3: Integration Basics',
                'description' => 'Learn how integration connects areas and accumulation.',
                'duration_minutes' => 60,
                'contents' => [
                    [
                        'title' => 'Introduction to Integration (Video)',
                        'type' => 'video',
                        'url' => 'https://www.youtube.com/watch?v=rfG8ce4nNh0',
                        'description' => 'An intuitive guide to integrals and accumulation.',
                        'duration_minutes' => 20,
                        'is_required' => true,
                    ],
                ],
            ],
            [
                'title' => 'Lesson 4: Applications of Calculus',
                'description' => 'Apply calculus ideas to real-world scenarios.',
                'duration_minutes' => 60,
                'contents' => [
                    [
                        'title' => 'Paul\'s Online Math Notes - Calculus I (PDF)',
                        'type' => 'link',
                        'url' => 'https://tutorial.math.lamar.edu/pdf/Calculus/CalcI/CalculusI.pdf',
                        'description' => 'Reference notes for calculus applications and examples.',
                        'duration_minutes' => 30,
                        'is_required' => true,
                    ],
                ],
            ],
            [
                'title' => 'Lesson 5: Quiz - Calculus Fundamentals',
                'description' => 'Check your understanding of limits and derivatives.',
                'duration_minutes' => 45,
                'assessment' => [
                    'type' => 'quiz',
                    'title' => 'Quiz - Calculus Fundamentals',
                    'description' => 'Quiz covering limits, derivatives, and basic calculus concepts.',
                    'due_date' => now()->addDays(3),
                    'allow_retakes' => true,
                    'time_limit_minutes' => 35,
                ],
                'questions' => $this->advancedQuizQuestions(),
            ],
            [
                'title' => 'Lesson 6: Practice - Advanced Problems',
                'description' => 'Practice advanced calculus problems with step-by-step reasoning.',
                'duration_minutes' => 60,
                'assessment' => [
                    'type' => 'practice',
                    'title' => 'Practice - Advanced Problems',
                    'description' => 'Practice problems to strengthen calculus fluency.',
                    'due_date' => now()->addDays(5),
                    'allow_retakes' => true,
                    'time_limit_minutes' => 40,
                ],
                'questions' => $this->advancedPracticeQuestions(),
            ],
            [
                'title' => 'Lesson 7: Final Exam - Advanced Mathematics',
                'description' => 'Comprehensive final exam on advanced mathematics topics.',
                'duration_minutes' => 75,
                'assessment' => [
                    'type' => 'final_exam',
                    'title' => 'Final Exam - Advanced Mathematics',
                    'description' => 'Comprehensive final assessment covering advanced mathematics.',
                    'due_date' => now()->addDays(7),
                    'allow_retakes' => false,
                    'time_limit_minutes' => 75,
                    'weight_percentage' => 80,
                ],
                'questions' => $this->advancedFinalExamQuestions(),
            ],
        ];
    }

    /**
     * @return array<int, array{type: string, question: string, answer_config: array<string, mixed>, points: int, order: int}>
     */
    private function basicQuizQuestions(): array
    {
        return [
            [
                'type' => 'multiple_choice',
                'question' => 'Solve: 2x + 3 = 11. What is x?',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['2', '3', '4', '5'],
                    'correct_index' => 2,
                ],
                'points' => 10,
                'order' => 1,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'The variable in the expression 7y - 2 is ___.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['y'],
                ],
                'points' => 10,
                'order' => 2,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'What is the slope of the line y = 3x + 1?',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['1', '3', '-3', '0'],
                    'correct_index' => 1,
                ],
                'points' => 10,
                'order' => 3,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'A right angle measures ___ degrees.',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['45', '90', '180', '360'],
                    'correct_index' => 1,
                ],
                'points' => 10,
                'order' => 4,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'The equation of a line with slope 2 and y-intercept -1 is y = ___.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['2x-1', '2x - 1', '2x + -1'],
                ],
                'points' => 10,
                'order' => 5,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'Which is an example of a linear equation?',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['y = x^2 + 1', 'y = 2x - 5', 'y = 1/x', 'y = 3x^2'],
                    'correct_index' => 1,
                ],
                'points' => 10,
                'order' => 6,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'If a rectangle has length 4 and width 3, its perimeter is ___.',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['7', '14', '12', '24'],
                    'correct_index' => 1,
                ],
                'points' => 10,
                'order' => 7,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'An angle greater than 90 degrees but less than 180 degrees is called an ___ angle.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['obtuse', 'obtuse angle'],
                ],
                'points' => 10,
                'order' => 8,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'Solve: 5x = 35. What is x?',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['5', '6', '7', '8'],
                    'correct_index' => 2,
                ],
                'points' => 10,
                'order' => 9,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'A line passes through (0, 2) and (1, 4). Its slope is ___',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['2', '1', '4', '-2'],
                    'correct_index' => 0,
                ],
                'points' => 10,
                'order' => 10,
            ],
        ];
    }

    /**
     * @return array<int, array{type: string, question: string, answer_config: array<string, mixed>, points: int, order: int}>
     */
    private function basicPracticeQuestions(): array
    {
        return [
            [
                'type' => 'multiple_choice',
                'question' => 'Simplify: 3(2x + 4).',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['6x + 4', '6x + 12', '3x + 8', '6x + 8'],
                    'correct_index' => 1,
                ],
                'points' => 10,
                'order' => 1,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'Solve: x/4 = 5. x = ___.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['20'],
                ],
                'points' => 10,
                'order' => 2,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'A triangle with sides 3, 4, 5 is a ___ triangle.',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['acute', 'right', 'obtuse', 'equilateral'],
                    'correct_index' => 1,
                ],
                'points' => 10,
                'order' => 3,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'Which point is on the line y = x - 1?',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['(0, 1)', '(1, 0)', '(2, 2)', '(-1, 1)'],
                    'correct_index' => 1,
                ],
                'points' => 10,
                'order' => 4,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'The area of a rectangle with length 8 and width 3 is ___.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['24'],
                ],
                'points' => 10,
                'order' => 5,
            ],
        ];
    }

    /**
     * @return array<int, array{type: string, question: string, answer_config: array<string, mixed>, points: int, order: int}>
     */
    private function basicFinalExamQuestions(): array
    {
        return [
            [
                'type' => 'multiple_choice',
                'question' => 'Solve: 3x - 7 = 11. What is x?',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['4', '5', '6', '7'],
                    'correct_index' => 2,
                ],
                'points' => 10,
                'order' => 1,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'The coefficient of x in 9x + 2 is ___.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['9'],
                ],
                'points' => 10,
                'order' => 2,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'Which equation represents a line with y-intercept 3?',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['y = 3x', 'y = x + 3', 'y = x - 3', 'y = 3x - 1'],
                    'correct_index' => 1,
                ],
                'points' => 10,
                'order' => 3,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'The sum of the interior angles of a triangle is ___ degrees.',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['90', '180', '270', '360'],
                    'correct_index' => 1,
                ],
                'points' => 10,
                'order' => 4,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'If y = 2x + 5 and x = 3, then y = ___.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['11'],
                ],
                'points' => 10,
                'order' => 5,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'A square with side length 6 has area ___ square units.',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['12', '24', '36', '48'],
                    'correct_index' => 2,
                ],
                'points' => 10,
                'order' => 6,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'Which pair of numbers are solutions to x + y = 10?',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['(3, 8)', '(2, 9)', '(4, 6)', '(5, 7)'],
                    'correct_index' => 2,
                ],
                'points' => 10,
                'order' => 7,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'The slope of a horizontal line is ___.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['0', 'zero'],
                ],
                'points' => 10,
                'order' => 8,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'Solve: 4x + 8 = 0. What is x?',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['-4', '-2', '2', '4'],
                    'correct_index' => 1,
                ],
                'points' => 10,
                'order' => 9,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'The midpoint between (0, 0) and (4, 6) is ___',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['(2, 3)', '(4, 3)', '(2, 6)', '(1, 3)'],
                    'correct_index' => 0,
                ],
                'points' => 10,
                'order' => 10,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'Solve: 7x = 56. x = ___.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['8'],
                ],
                'points' => 10,
                'order' => 11,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'Which of the following is a linear expression?',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['x^2 + 3', '2x - 7', '1/x + 4', '3x^2 - 1'],
                    'correct_index' => 1,
                ],
                'points' => 10,
                'order' => 12,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'A 90 degree angle is called a ___ angle.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['right', 'right angle'],
                ],
                'points' => 10,
                'order' => 13,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'Solve: x - 9 = -2. What is x?',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['-11', '7', '9', '11'],
                    'correct_index' => 3,
                ],
                'points' => 10,
                'order' => 14,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'Which statement about parallel lines is true?',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => [
                        'They intersect at exactly one point.',
                        'They never intersect and are the same distance apart.',
                        'They are perpendicular to each other.',
                        'They have different slopes.',
                    ],
                    'correct_index' => 1,
                ],
                'points' => 10,
                'order' => 15,
            ],
        ];
    }

    /**
     * @return array<int, array{type: string, question: string, answer_config: array<string, mixed>, points: int, order: int}>
     */
    private function advancedQuizQuestions(): array
    {
        return [
            [
                'type' => 'multiple_choice',
                'question' => 'What is the limit of f(x) = x^2 as x approaches 3?',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['6', '9', '12', '15'],
                    'correct_index' => 1,
                ],
                'points' => 10,
                'order' => 1,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'The derivative of x^2 is ___.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['2x'],
                ],
                'points' => 10,
                'order' => 2,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'Which expression represents the slope of the tangent line to y = x^3?',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['3x^2', '2x', 'x^2', '3x'],
                    'correct_index' => 0,
                ],
                'points' => 10,
                'order' => 3,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'The derivative measures the ___ of a function.',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['area', 'rate of change', 'total sum', 'average'],
                    'correct_index' => 1,
                ],
                'points' => 10,
                'order' => 4,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'If f(x) = 5x, then f\'(x) = ___.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['5'],
                ],
                'points' => 10,
                'order' => 5,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'What is the limit of (2x + 1) as x approaches 4?',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['7', '8', '9', '10'],
                    'correct_index' => 2,
                ],
                'points' => 10,
                'order' => 6,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'An antiderivative of 2x is ___',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['x^2 + C', '2x + C', 'x + C', '2x^2 + C'],
                    'correct_index' => 0,
                ],
                'points' => 10,
                'order' => 7,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'The integral symbol represents ___',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['accumulation', 'area'],
                ],
                'points' => 10,
                'order' => 8,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'Which function has a constant derivative?',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['x^2', 'x^3', '5x', '1/x'],
                    'correct_index' => 2,
                ],
                'points' => 10,
                'order' => 9,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'The derivative of sin(x) is ___',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['cos(x)', '-cos(x)', '-sin(x)', 'tan(x)'],
                    'correct_index' => 0,
                ],
                'points' => 10,
                'order' => 10,
            ],
        ];
    }

    /**
     * @return array<int, array{type: string, question: string, answer_config: array<string, mixed>, points: int, order: int}>
     */
    private function advancedPracticeQuestions(): array
    {
        return [
            [
                'type' => 'multiple_choice',
                'question' => 'Compute the derivative of 3x^2 + 2x.',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['6x + 2', '3x + 2', '6x + 1', '2x + 3'],
                    'correct_index' => 0,
                ],
                'points' => 10,
                'order' => 1,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'If f(x) = x^3, then f\'(2) = ___.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['12'],
                ],
                'points' => 10,
                'order' => 2,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'Evaluate the limit: lim x->0 (sin x)/x.',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['0', '1', '2', 'does not exist'],
                    'correct_index' => 1,
                ],
                'points' => 10,
                'order' => 3,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'An antiderivative of 4 is ___',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['4x + C', 'x^4 + C', '2x + C', '4x^2 + C'],
                    'correct_index' => 0,
                ],
                'points' => 10,
                'order' => 4,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'The derivative of e^x is ___.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['e^x'],
                ],
                'points' => 10,
                'order' => 5,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'Which rule is used to differentiate a product of two functions?',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['Chain rule', 'Product rule', 'Quotient rule', 'Power rule'],
                    'correct_index' => 1,
                ],
                'points' => 10,
                'order' => 6,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'The integral of 2x is ___.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['x^2 + C', 'x^2 + c'],
                ],
                'points' => 10,
                'order' => 7,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'The second derivative tells us about a function\'s ___',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['concavity', 'intercept', 'domain', 'range'],
                    'correct_index' => 0,
                ],
                'points' => 10,
                'order' => 8,
            ],
        ];
    }

    /**
     * @return array<int, array{type: string, question: string, answer_config: array<string, mixed>, points: int, order: int}>
     */
    private function advancedFinalExamQuestions(): array
    {
        return [
            [
                'type' => 'multiple_choice',
                'question' => 'Compute the derivative of x^4.',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['4x^3', 'x^3', '4x', 'x^4'],
                    'correct_index' => 0,
                ],
                'points' => 10,
                'order' => 1,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'Evaluate: lim x->2 (x^2 - 4)/(x - 2).',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['2', '3', '4', '5'],
                    'correct_index' => 2,
                ],
                'points' => 10,
                'order' => 2,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'If f(x) = ln(x), then f\'(x) = ___.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['1/x', 'x^-1'],
                ],
                'points' => 10,
                'order' => 3,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'The integral of 1 is ___',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['x + C', '1 + C', 'x^2 + C', 'ln(x) + C'],
                    'correct_index' => 0,
                ],
                'points' => 10,
                'order' => 4,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'Which method is used to differentiate sin(3x)?',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['Product rule', 'Chain rule', 'Quotient rule', 'Power rule'],
                    'correct_index' => 1,
                ],
                'points' => 10,
                'order' => 5,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'The derivative of cos(x) is ___.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['-sin(x)', '-sin x'],
                ],
                'points' => 10,
                'order' => 6,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'The definite integral represents ___',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['slope', 'area under a curve', 'rate of change', 'maximum value'],
                    'correct_index' => 1,
                ],
                'points' => 10,
                'order' => 7,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'Which is the derivative of e^{2x}?',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['2e^{2x}', 'e^{2x}', '2e^x', 'e^x'],
                    'correct_index' => 0,
                ],
                'points' => 10,
                'order' => 8,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'The integral of x is ___.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['x^2/2 + C', 'x^2 / 2 + C'],
                ],
                'points' => 10,
                'order' => 9,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'If f\'(x) > 0 on an interval, then f(x) is ___ on that interval.',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['decreasing', 'increasing', 'constant', 'undefined'],
                    'correct_index' => 1,
                ],
                'points' => 10,
                'order' => 10,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'The derivative of x^{-1} is ___',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['-x^{-2}', 'x^{-2}', '-x', '1/x'],
                    'correct_index' => 0,
                ],
                'points' => 10,
                'order' => 11,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'If f(x) = 2x^3, then f\'(x) = ___.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['6x^2'],
                ],
                'points' => 10,
                'order' => 12,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'Which is a critical point of f(x) if f\'(x) = 0?',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['x = -1', 'x = 0', 'x = 1', 'Any x where f\'(x) = 0'],
                    'correct_index' => 3,
                ],
                'points' => 10,
                'order' => 13,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'The derivative of tan(x) is ___.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['sec^2(x)', 'sec^2 x'],
                ],
                'points' => 10,
                'order' => 14,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'The integral of cos(x) is ___',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['sin(x) + C', '-sin(x) + C', 'cos(x) + C', '-cos(x) + C'],
                    'correct_index' => 0,
                ],
                'points' => 10,
                'order' => 15,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'Which statement about limits is true?',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => [
                        'Limits only apply to discontinuous functions.',
                        'Limits describe the behavior of a function near a point.',
                        'Limits always equal the function value.',
                        'Limits cannot be estimated numerically.',
                    ],
                    'correct_index' => 1,
                ],
                'points' => 10,
                'order' => 16,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'If f(x) = x^2 + 1, then f\'(x) = ___.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['2x'],
                ],
                'points' => 10,
                'order' => 17,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'The slope of the tangent line to y = x^2 at x = 1 is ___',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['1', '2', '3', '4'],
                    'correct_index' => 1,
                ],
                'points' => 10,
                'order' => 18,
            ],
            [
                'type' => 'fill_blank',
                'question' => 'The integral of 1/x is ___.',
                'answer_config' => [
                    'type' => 'fill_blank',
                    'accepted_answers' => ['ln|x| + C', 'ln x + C'],
                ],
                'points' => 10,
                'order' => 19,
            ],
            [
                'type' => 'multiple_choice',
                'question' => 'If f\'\'(x) > 0 on an interval, the function is ___ on that interval.',
                'answer_config' => [
                    'type' => 'multiple_choice',
                    'options' => ['concave up', 'concave down', 'constant', 'decreasing'],
                    'correct_index' => 0,
                ],
                'points' => 10,
                'order' => 20,
            ],
        ];
    }
}
