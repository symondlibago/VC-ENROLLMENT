<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * A clearance rule the caller broke — signing a line they do not hold, or
 * reaching the cashier before the rest of the form is signed.
 *
 * Carries the status the API should answer with, so controllers map it
 * straight through instead of each one inventing its own codes.
 */
class ClearanceException extends RuntimeException
{
    public function __construct(string $message, private readonly int $status = 422)
    {
        parent::__construct($message);
    }

    public function status(): int
    {
        return $this->status;
    }

    public static function forbidden(string $message): self
    {
        return new self($message, 403);
    }
}
