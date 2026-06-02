<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Symfony\Component\Mailer\Transport\Dsn;
use Symfony\Component\Mailer\Transport\Smtp\EsmtpTransportFactory;
use Symfony\Component\Mailer\Transport\Smtp\Stream\SocketStream;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Create a symbolic link from "public/storage" to "storage/app/public"
        if (!file_exists(public_path('storage'))) {
            app('files')->link(
                storage_path('app/public'), public_path('storage')
            );
        }

        // Local-dev only: register a custom SMTP transport that skips TLS peer
        // verification. Needed because the local PHP/OpenSSL build can't validate
        // Gmail's chain against cacert.pem. Production must NOT use this.
        if ($this->app->environment('local')) {
            Mail::extend('smtp', function (array $config) {
                $factory = new EsmtpTransportFactory();

                $scheme = $config['scheme'] ?? null;
                if (! $scheme) {
                    $scheme = ! empty($config['encryption']) && $config['encryption'] === 'tls'
                        ? (($config['port'] == 465) ? 'smtps' : 'smtp')
                        : '';
                }

                $transport = $factory->create(new Dsn(
                    $scheme,
                    $config['host'],
                    $config['username'] ?? null,
                    $config['password'] ?? null,
                    $config['port'] ?? null,
                    $config
                ));

                $stream = $transport->getStream();
                if ($stream instanceof SocketStream) {
                    $stream->setStreamOptions([
                        'ssl' => [
                            'verify_peer' => false,
                            'verify_peer_name' => false,
                            'allow_self_signed' => true,
                        ],
                    ]);
                }

                return $transport;
            });
        }
    }
}
