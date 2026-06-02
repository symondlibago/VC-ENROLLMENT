<?php

namespace App\Models\LMS;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class LmsInstructorScope
{
    public static function subjectIdsFor(int $userId): Collection
    {
        $fromLmsPivot = LmsSubjectInstructor::where('user_id', $userId)->pluck('subject_id');

        $instructorRow = DB::table('instructors')->where('user_id', $userId)->first();
        $fromSchedules = collect();
        if ($instructorRow) {
            $fromSchedules = DB::table('schedules')
                ->where('instructor_id', $instructorRow->id)
                ->whereNotNull('subject_id')
                ->pluck('subject_id');
        }

        return $fromLmsPivot->merge($fromSchedules)->map(fn($id) => (int) $id)->unique()->values();
    }

    public static function teaches(int $userId, int $subjectId): bool
    {
        return self::subjectIdsFor($userId)->contains((int) $subjectId);
    }
}
