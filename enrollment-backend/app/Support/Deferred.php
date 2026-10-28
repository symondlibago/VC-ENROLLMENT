<?php

namespace App\Support;

/**
 * Hands a job to the queue, or to the end of this request when there is no
 * worker to hand it to.
 *
 * This deployment runs on the sync connection, so an ordinary dispatch would
 * run the job inside the request — a student waiting on a spinner while an
 * SMTP handshake completes, or a cashier waiting on two hundred of them.
 * After the response the page comes back at once and the work goes on behind
 * it. If a worker is ever set up, the job goes to it instead and no caller
 * has to change.
 *
 * Jobs dispatched this way must re-read their own data, since a transaction
 * that has not committed yet may still roll back.
 */
final class Deferred
{
    public static function dispatch(object $job): void
    {
        if (config('queue.default') === 'sync') {
            dispatch($job)->afterResponse();

            return;
        }

        dispatch($job);
    }
}
