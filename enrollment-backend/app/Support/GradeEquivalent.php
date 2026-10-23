<?php

namespace App\Support;

/**
 * The percentage → 1.0–5.0 scale printed on every official document.
 *
 * One copy, so the transcript, the grading sheet and any export can never
 * drift apart. Mirrors resources' client-side table in gradeEquivalent.js.
 */
class GradeEquivalent
{
    private const TABLE = [
        99 => '1.1', 98 => '1.2', 97 => '1.25', 96 => '1.3', 95 => '1.4', 94 => '1.5',
        93 => '1.6', 92 => '1.7', 91 => '1.75', 90 => '1.8', 89 => '1.9', 88 => '2.0',
        87 => '2.1', 86 => '2.2', 85 => '2.25', 84 => '2.3', 83 => '2.4', 82 => '2.5',
        81 => '2.6', 80 => '2.7', 79 => '2.75', 78 => '2.8', 77 => '2.9', 76 => '3.0',
        75 => '3.0', 74 => '3.1', 73 => '3.2', 72 => '3.25', 71 => '3.3', 70 => '3.4',
    ];

    /** '' for no mark at all; '5.0' for anything below 70. */
    public static function for(float|int|null $percentage): string
    {
        if ($percentage === null) {
            return '';
        }

        $grade = (int) round($percentage);

        return $grade >= 100 ? '1.0' : (self::TABLE[$grade] ?? '5.0');
    }
}
