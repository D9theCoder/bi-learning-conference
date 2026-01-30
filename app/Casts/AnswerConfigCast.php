<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

class AnswerConfigCast implements CastsAttributes
{
    /**
     * Cast the given value.
     *
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>|null
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?array
    {
        if ($value === null || $value === '') {
            $fallback = $this->buildFallbackConfig($attributes);

            return $fallback === null ? null : $this->normalizeConfig($fallback, $attributes);
        }

        $decoded = is_array($value) ? $value : json_decode((string) $value, true);

        if (! is_array($decoded)) {
            throw new InvalidArgumentException('Answer config must be a valid JSON object.');
        }

        return $this->normalizeConfig($decoded, $attributes);
    }

    /**
     * Prepare the given value for storage.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        $decoded = is_array($value) ? $value : json_decode((string) $value, true);

        if (! is_array($decoded)) {
            throw new InvalidArgumentException('Answer config must be an array.');
        }

        $normalized = $this->normalizeConfig($decoded, $attributes);

        return json_encode($normalized);
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>|null
     */
    protected function buildFallbackConfig(array $attributes): ?array
    {
        $type = $attributes['type'] ?? null;

        if (! is_string($type)) {
            return null;
        }

        $options = $this->decodeOptions($attributes['options'] ?? null);
        $correctAnswer = is_string($attributes['correct_answer'] ?? null)
            ? $attributes['correct_answer']
            : null;

        return match ($type) {
            'multiple_choice' => [
                'type' => 'multiple_choice',
                'options' => $options,
                'correct_index' => $this->resolveCorrectIndex($correctAnswer, $options),
            ],
            'fill_blank' => [
                'type' => 'fill_blank',
                'accepted_answers' => $this->buildAcceptedAnswers($correctAnswer, $options),
            ],
            'essay' => [
                'type' => 'essay',
            ],
            default => null,
        };
    }

    /**
     * @param  array<string, mixed>  $config
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    protected function normalizeConfig(array $config, array $attributes): array
    {
        $type = $config['type'] ?? null;

        if (! is_string($type)) {
            throw new InvalidArgumentException('Answer config type is required.');
        }

        $modelType = $attributes['type'] ?? null;

        if (is_string($modelType) && $modelType !== $type) {
            throw new InvalidArgumentException('Answer config type does not match question type.');
        }

        return match ($type) {
            'multiple_choice' => $this->normalizeMultipleChoice($config),
            'fill_blank' => $this->normalizeFillBlank($config),
            'essay' => ['type' => 'essay'],
            default => throw new InvalidArgumentException('Unsupported answer config type.'),
        };
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    protected function normalizeMultipleChoice(array $config): array
    {
        $options = $config['options'] ?? null;
        $correctIndex = $config['correct_index'] ?? null;

        if (! is_array($options)) {
            throw new InvalidArgumentException('Multiple choice options must be an array.');
        }

        $options = array_values(array_map(fn ($option) => (string) $option, $options));

        if (! is_int($correctIndex)) {
            $correctIndex = is_numeric($correctIndex) ? (int) $correctIndex : null;
        }

        if ($correctIndex === null || $correctIndex < 0 || $correctIndex >= count($options)) {
            throw new InvalidArgumentException('Multiple choice correct_index is out of bounds.');
        }

        return [
            'type' => 'multiple_choice',
            'options' => $options,
            'correct_index' => $correctIndex,
        ];
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    protected function normalizeFillBlank(array $config): array
    {
        $accepted = $config['accepted_answers'] ?? null;

        if (! is_array($accepted)) {
            throw new InvalidArgumentException('Fill in the blank answers must be an array.');
        }

        $normalized = $this->dedupeAnswers($accepted);

        if ($normalized === []) {
            throw new InvalidArgumentException('Fill in the blank answers cannot be empty.');
        }

        return [
            'type' => 'fill_blank',
            'accepted_answers' => $normalized,
        ];
    }

    /**
     * @return array<int, string>
     */
    protected function decodeOptions(mixed $value): array
    {
        if (is_array($value)) {
            return array_values(array_map(fn ($option) => (string) $option, $value));
        }

        if ($value === null || $value === '') {
            return [];
        }

        $decoded = json_decode((string) $value, true);

        if (! is_array($decoded)) {
            return [];
        }

        return array_values(array_map(fn ($option) => (string) $option, $decoded));
    }

    /**
     * @param  array<int, string>  $options
     */
    protected function resolveCorrectIndex(?string $correctAnswer, array $options): int
    {
        if ($correctAnswer === null || $correctAnswer === '') {
            return -1;
        }

        if (is_numeric($correctAnswer)) {
            return (int) $correctAnswer;
        }

        $index = array_search($correctAnswer, $options, true);

        return $index === false ? -1 : (int) $index;
    }

    /**
     * @param  array<int, string>  $options
     * @return array<int, string>
     */
    protected function buildAcceptedAnswers(?string $correctAnswer, array $options): array
    {
        $candidates = [];

        if ($correctAnswer !== null && $correctAnswer !== '') {
            $candidates[] = $correctAnswer;
        }

        foreach ($options as $option) {
            if ($option === '') {
                continue;
            }

            $candidates[] = $option;
        }

        return $this->dedupeAnswers($candidates);
    }

    /**
     * @param  array<int, mixed>  $answers
     * @return array<int, string>
     */
    protected function dedupeAnswers(array $answers): array
    {
        $seen = [];
        $unique = [];

        foreach ($answers as $answer) {
            $normalized = $this->normalizeAnswer($answer);

            if ($normalized === '' || isset($seen[$normalized])) {
                continue;
            }

            $seen[$normalized] = true;
            $unique[] = (string) $answer;
        }

        return $unique;
    }

    protected function normalizeAnswer(mixed $answer): string
    {
        return strtolower(trim((string) $answer));
    }
}
