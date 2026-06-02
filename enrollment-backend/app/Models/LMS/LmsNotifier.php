<?php

namespace App\Models\LMS;

use Illuminate\Support\Facades\DB;

/**
 * Lightweight dispatcher for in-app LMS notifications.
 * Kept as a static helper so existing controllers can call it without
 * any DI wiring or service-container changes.
 */
class LmsNotifier
{
    /**
     * Persist a single notification for one user.
     */
    public static function send(
        int $userId,
        string $type,
        string $title,
        ?string $body = null,
        ?int $subjectId = null,
        ?string $link = null,
        array $payload = []
    ): void {
        LmsNotification::create([
            'user_id' => $userId,
            'subject_id' => $subjectId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'link' => $link,
            'payload' => $payload,
            'read_at' => null,
        ]);
    }

    /**
     * Fan out the same notification to every student enrolled in a subject.
     * If $sectionId is provided, the audience is further narrowed to students
     * who belong to that specific section.
     */
    public static function sendToSubjectStudents(
        int $subjectId,
        string $type,
        string $title,
        ?string $body = null,
        ?int $sectionId = null,
        ?string $link = null,
        array $payload = []
    ): int {
        $userIds = self::enrolledStudentUserIds($subjectId, $sectionId);
        $rows = [];
        $now = now();
        $jsonPayload = json_encode($payload);

        foreach ($userIds as $uid) {
            $rows[] = [
                'user_id' => $uid,
                'subject_id' => $subjectId,
                'type' => $type,
                'title' => $title,
                'body' => $body,
                'link' => $link,
                'payload' => $jsonPayload,
                'read_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (!empty($rows)) {
            // Chunk to keep packet size sane on large rosters.
            foreach (array_chunk($rows, 500) as $chunk) {
                DB::table('lms_notifications')->insert($chunk);
            }
        }

        return count($rows);
    }

    /**
     * Resolve user_ids of all students enrolled in a subject, optionally
     * filtered to a given section.
     */
    public static function enrolledStudentUserIds(int $subjectId, ?int $sectionId = null): array
    {
        $q = DB::table('student_subject')
            ->join('pre_enrolled_students', 'student_subject.pre_enrolled_student_id', '=', 'pre_enrolled_students.id')
            ->where('student_subject.subject_id', $subjectId)
            ->whereNotNull('pre_enrolled_students.user_id');

        if (!is_null($sectionId)) {
            $q->join('section_student', 'section_student.pre_enrolled_student_id', '=', 'pre_enrolled_students.id')
              ->where('section_student.section_id', $sectionId);
        }

        return $q->pluck('pre_enrolled_students.user_id')->unique()->values()->all();
    }
}
