<?php

namespace App\Observers;

use App\Models\PreEnrolledStudent;
use App\Models\User;
use App\Services\ClearanceService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class PreEnrolledStudentObserver
{
    /**
     * Handle the PreEnrolledStudent "updated" event.
     */
    public function updated(PreEnrolledStudent $student): void
    {
        $this->ensureClearance($student);

        // Check if the 'enrollment_status' was changed to 'enrolled' AND if a user account doesn't already exist.
        if ($student->wasChanged('enrollment_status') && $student->enrollment_status === 'enrolled' && is_null($student->user_id)) {

            try {
                // 1. Prepare user data from the student model
                $fullName = $student->first_name . ' ' . ($student->middle_name ? $student->middle_name[0] . '. ' : '') . $student->last_name;

                // Sanitize last name for the password (lowercase, no spaces)
                $passwordPart = strtolower(str_replace(' ', '', $student->last_name));
                $rawPassword = $passwordPart . '@' . $student->student_id_number;

                // 2. Create the new user
                $newUser = User::create([
                    'name' => $fullName,
                    'email' => $student->email_address,
                    'password' => Hash::make($rawPassword),
                    'role' => 'Student', // Assign the 'Student' role
                ]);

                // 3. Link the new user back to the student record
                // We use 'saveQuietly' to prevent triggering the 'updated' event again and causing an infinite loop.
                $student->user_id = $newUser->id;
                $student->saveQuietly();

            } catch (\Exception $e) {
                // Log any errors to help with debugging
                Log::error('Failed to create user for student ID: ' . $student->id . '. Error: ' . $e->getMessage());
            }
        }
    }

    /**
     * Gives a newly enrolled student their clearance for the term.
     *
     * Hooked here rather than in the controllers because this is the one
     * place every path converges on, whether the student is new, continuing
     * or shifting. It also fires when an already-enrolled student moves into
     * a new term, which is what makes a continuing enrolment get its own
     * clearance rather than reusing last semester's.
     *
     * A failure is logged and swallowed: not having a clearance row yet is a
     * nuisance the registrar can fix with the generate button, while an
     * exception here would roll back the enrolment itself.
     */
    private function ensureClearance(PreEnrolledStudent $student): void
    {
        if ($student->enrollment_status !== 'enrolled') {
            return;
        }

        $enteredTerm = $student->wasChanged('enrollment_status')
            || $student->wasChanged('school_year')
            || $student->wasChanged('semester');

        if (!$enteredTerm) {
            return;
        }

        try {
            $clearance = app(ClearanceService::class);
            $student->loadMissing('course.program');

            $clearance->ensureFor($student);

            // A corrected school year leaves the clearance the wrong one
            // created still standing. Only one with no signatures and no
            // enrolment history behind it is dropped, so a real past term is
            // never swept up with it.
            $clearance->forgetUnusedTerms($student);
        } catch (\Throwable $e) {
            Log::error('Failed to create clearance for student ID: ' . $student->id . '. Error: ' . $e->getMessage());
        }
    }
}