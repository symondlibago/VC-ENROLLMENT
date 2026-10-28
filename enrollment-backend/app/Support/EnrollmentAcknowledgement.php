<?php

namespace App\Support;

/**
 * The Student Enrollment Acknowledgment and Undertaking.
 *
 * One copy, on the server. The enrollment form shows it, the student's record
 * stores which version they accepted, and the confirmation email quotes it
 * back — all from here, because three hand-kept copies of a text a student
 * has formally agreed to is three chances to show them something they never
 * actually saw.
 *
 * The wording is the College's own and is reproduced verbatim. Change it only
 * on instruction, and bump VERSION when you do.
 */
final class EnrollmentAcknowledgement
{
    /**
     * Bumped whenever the wording below changes.
     *
     * Stored against the student, so their record says which version they
     * agreed to rather than whatever the text happens to say years later.
     */
    public const VERSION = '1.0';

    public const TITLE = 'STUDENT ENROLLMENT ACKNOWLEDGMENT AND UNDERTAKING';

    public const INTRO = 'By proceeding with my online enrollment at Vineyard College, I hereby '
        . 'acknowledge, affirm, and agree to the following terms and conditions:';

    public const CLOSING = 'By checking the acknowledgment box below, I confirm that I have read and '
        . 'understood the foregoing statements, that I voluntarily agree to comply with the applicable '
        . 'policies and requirements of Vineyard College, and that I understand my responsibilities as '
        . 'an enrolled student. I further acknowledge that I may seek clarification from the appropriate '
        . 'College office regarding any provision that I do not fully understand.';

    /** The label on the checkbox itself. */
    public const CONFIRMATION = 'I have read and understood the Student Enrollment Acknowledgment and '
        . 'Undertaking of Vineyard College. I voluntarily confirm my understanding of and commitment to '
        . 'the responsibilities, policies, rules, regulations, and procedures stated therein, subject to '
        . 'applicable laws and due process requirements.';

    /**
     * Clause 3 cites the handbook by link.
     *
     * Configured rather than hard-coded: until the College publishes the URL
     * the clause reads without a dead link rather than with one.
     */
    public static function handbookUrl(): ?string
    {
        $url = trim((string) config('vipc.student_handbook_url'));

        return $url !== '' ? $url : null;
    }

    /** @return list<array{number: int, heading: string, paragraphs: list<string>, link: ?array}> */
    public static function clauses(): array
    {
        return [
            [
                'number' => 1,
                'heading' => 'Voluntary Enrollment',
                'paragraphs' => [
                    'I acknowledge that my decision to enroll at Vineyard College is voluntary and made '
                        . 'of my own free will, without force, coercion, or undue influence from any '
                        . 'person or entity.',
                ],
                'link' => null,
            ],
            [
                'number' => 2,
                'heading' => 'Student Status and Enrollment Requirements',
                'paragraphs' => [
                    'I understand that my enrollment and recognition as a student of Vineyard College '
                        . 'are subject to the College\'s enrollment procedures and the submission, '
                        . 'verification, and completion of all applicable documentary requirements. I '
                        . 'acknowledge that my student status takes effect upon the completion of the '
                        . 'applicable enrollment requirements and confirmation of my enrollment by the '
                        . 'College, in accordance with its policies and procedures.',
                ],
                'link' => null,
            ],
            [
                'number' => 3,
                'heading' => 'Knowledge and Observance of Institutional Policies',
                'paragraphs' => [
                    'I understand that it is my responsibility to familiarize myself with, read, '
                        . 'understand, and comply with the academic practices, institutional policies, '
                        . 'rules, regulations, and procedures of Vineyard College as provided in the '
                        . 'Institutional Student Handbook, accessible through the following link:',
                    'I further acknowledge my responsibility to remain informed of, understand, and '
                        . 'comply with applicable subsequent or future policies, rules, regulations, and '
                        . 'procedures duly issued, communicated, or implemented by the College, including '
                        . 'those not expressly stated in the current Institutional Student Handbook.',
                ],
                // Sits between the two paragraphs above
                'link' => [
                    'label' => 'Institutional Student Handbook',
                    'url' => null,   // filled in by payload()
                ],
            ],
            [
                'number' => 4,
                'heading' => 'Attendance at General Student Orientation',
                'paragraphs' => [
                    'I acknowledge my responsibility to attend and participate in the General Student '
                        . 'Orientation organized by Vineyard College, which aims to familiarize students '
                        . 'with the College\'s institutional practices, academic policies, rules, '
                        . 'regulations, procedures, and standards. I understand that I must comply with '
                        . 'the applicable orientation requirements communicated by the College.',
                ],
                'link' => null,
            ],
            [
                'number' => 5,
                'heading' => 'Academic Policies and Procedures',
                'paragraphs' => [
                    'I acknowledge my responsibility to obtain, read, understand, and regularly refer to '
                        . 'a copy of the Academic Policies and Procedures of Vineyard College, which '
                        . 'shall serve as my guide throughout my academic journey at the College. I '
                        . 'understand that I must seek clarification from the appropriate College office '
                        . 'or authorized personnel whenever I have questions regarding these policies '
                        . 'and procedures.',
                ],
                'link' => null,
            ],
            [
                'number' => 6,
                'heading' => 'Accountability for Violations',
                'paragraphs' => [
                    'I understand that any violation of applicable institutional policies, rules, '
                        . 'regulations, procedures, and standards may subject me to appropriate '
                        . 'disciplinary or administrative action, in accordance with the established '
                        . 'policies of Vineyard College, applicable due process requirements, and '
                        . 'relevant laws and regulations. I acknowledge my responsibility to accept and '
                        . 'comply with any lawful and properly imposed consequences arising from a duly '
                        . 'established violation.',
                ],
                'link' => null,
            ],
            [
                'number' => 7,
                'heading' => 'Compliance with Institutional Directives',
                'paragraphs' => [
                    'I commit to complying with the lawful directives, official instructions, and duly '
                        . 'implemented policies and procedures of Vineyard College and its authorized '
                        . 'officials and personnel, provided that these are consistent with applicable '
                        . 'laws, regulations, and institutional policies.',
                ],
                'link' => null,
            ],
            [
                'number' => 8,
                'heading' => 'Upholding the College\'s Principles and Reputation',
                'paragraphs' => [
                    'I commit to upholding the principles, ideals, values, and aspirations of Vineyard '
                        . 'College and to conducting myself responsibly, respectfully, and ethically as '
                        . 'a member of its academic community. I shall refrain from acts or conduct that '
                        . 'unlawfully or unjustifiably harm the reputation, integrity, or good standing '
                        . 'of the College. I understand that any alleged misconduct may be addressed '
                        . 'through the appropriate institutional procedures, and that any corresponding '
                        . 'consequences shall be determined in accordance with applicable policies, due '
                        . 'process requirements, and relevant laws and regulations.',
                ],
                'link' => null,
            ],
        ];
    }

    /** The whole thing, as the form and the email both receive it. */
    public static function payload(): array
    {
        $handbookUrl = self::handbookUrl();

        $clauses = array_map(function (array $clause) use ($handbookUrl) {
            if ($clause['link']) {
                $clause['link']['url'] = $handbookUrl;
            }

            return $clause;
        }, self::clauses());

        return [
            'version' => self::VERSION,
            'title' => self::TITLE,
            'intro' => self::INTRO,
            'closing' => self::CLOSING,
            'confirmation' => self::CONFIRMATION,
            'clauses' => $clauses,
        ];
    }
}
