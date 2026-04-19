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

    'allowed_origins' => array_values(array_filter(array_merge(
        [
            env('FRONTEND_URL', 'http://localhost:5173'),
            'http://localhost:3000',
            'http://localhost:4173',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:5174',
            'http://localhost:5174',
        ],
        array_filter(array_map('trim', explode(',', (string) env('FRONTEND_URLS', ''))))
    ))),

    /** Vite often uses 127.0.0.1 or varying ports — match any localhost / loopback port for dev. */
    'allowed_origins_patterns' => [
        '#^https?://localhost(:\d+)?$#i',
        '#^https?://127\.0\.0\.1(:\d+)?$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
