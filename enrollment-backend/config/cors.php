<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://localhost',
        'http://127.0.0.1',
    ],

    'allowed_origins_patterns' => [
        '#^http://localhost(:[0-9]+)?$#',
        '#^http://127\.0\.0\.1(:[0-9]+)?$#',
        '#^https?://192\.168\.\d{1,3}\.\d{1,3}(:[0-9]+)?$#',
        '#^https?://10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:[0-9]+)?$#',
        '#^https?://172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(:[0-9]+)?$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
