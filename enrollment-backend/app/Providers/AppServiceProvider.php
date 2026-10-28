<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\View;
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
        // The house palette, given to every email view.
        //
        // A composer rather than a @php block in the layout: Blade renders a
        // child's sections before the parent, so anything the layout defines
        // is not yet in scope where the sections need it.
        View::composer('emails.*', function ($view) {
            $view->with([
                'red' => '#9c262c',
                'green' => '#15803d',
            ]);
        });

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
