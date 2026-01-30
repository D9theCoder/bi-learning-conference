<?php

namespace App;

enum CourseCategory: string
{
    // !Locked STEM course categories; update via code changes only.
    case BasicMathematics = 'Basic Mathematics';
    case AdvancedMathematics = 'Advanced Mathematics';
    case Physics = 'Physics';
    case Chemistry = 'Chemistry';
    case Biology = 'Biology';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $case) => ['value' => $case->value, 'label' => $case->value],
            self::cases()
        );
    }
}
