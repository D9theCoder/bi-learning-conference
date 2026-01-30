<?php

use App\Models\AssessmentQuestion;

it('validates multiple choice answer config structure', function () {
    $question = AssessmentQuestion::factory()->create([
        'type' => 'multiple_choice',
        'answer_config' => [
            'type' => 'multiple_choice',
            'options' => ['A', 'B', 'C', 'D'],
            'correct_index' => 2,
        ],
    ]);

    $question->refresh();

    expect($question->answer_config)->toMatchArray([
        'type' => 'multiple_choice',
        'options' => ['A', 'B', 'C', 'D'],
        'correct_index' => 2,
    ]);
});

it('validates fill blank answer config structure', function () {
    $question = AssessmentQuestion::factory()->create([
        'type' => 'fill_blank',
        'answer_config' => [
            'type' => 'fill_blank',
            'accepted_answers' => ['Paris', 'paris', 'City of Paris'],
        ],
    ]);

    $question->refresh();

    expect($question->answer_config)->toMatchArray([
        'type' => 'fill_blank',
        'accepted_answers' => [
            'Paris',
            'City of Paris',
        ],
    ]);
});

it('validates essay answer config structure', function () {
    $question = AssessmentQuestion::factory()->create([
        'type' => 'essay',
        'answer_config' => [
            'type' => 'essay',
        ],
    ]);

    $question->refresh();

    expect($question->answer_config)->toBe(['type' => 'essay']);
});

it('rejects invalid correct_index for multiple choice', function () {
    expect(fn () => AssessmentQuestion::factory()->create([
        'type' => 'multiple_choice',
        'answer_config' => [
            'type' => 'multiple_choice',
            'options' => ['A', 'B'],
            'correct_index' => 4,
        ],
    ]))->toThrow(\InvalidArgumentException::class);
});

it('rejects empty accepted_answers for fill blank', function () {
    expect(fn () => AssessmentQuestion::factory()->create([
        'type' => 'fill_blank',
        'answer_config' => [
            'type' => 'fill_blank',
            'accepted_answers' => [],
        ],
    ]))->toThrow(\InvalidArgumentException::class);
});
