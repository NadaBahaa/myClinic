<?php

/**
 * SMS Misr integration (ghanem/laravel-smsmisr).
 *
 * SMS API (POST only): https://smsmisr.com/api/SMS/
 * Required: environment, username, password, sender, mobile, language, message
 * Optional: DelayUntil (yyyyMMddHHmm)
 *
 * Balance inquiry (GET): https://smsmisr.com/api/Balance/?username=xx&password=xx
 * Artisan: php artisan smsmisr:balance
 *
 * Response codes: 1901 success | 1902 invalid request | 1903 bad credentials
 * | 1904 invalid sender | 1905 invalid mobile | 1906 insufficient credit
 * | 1907 server updating | 1908 invalid DelayUntil | 1909 invalid message
 * | 1910 invalid language | 1911 text too long | 1912 invalid environment
 *
 * Test: environment=2, test sender token from smsmisr.com (5000 test balance).
 * Live: environment=1, approved Sender ID token.
 */
return [
    /*
     * Environment: 1 = Live, 2 = Test (recommended until go-live)
     */
    'environment' => (int) env('SMSMISR_ENVIRONMENT', 2),

    /*
     * Base URL — requests go to {endpoint}SMS/ via POST
     */
    'endpoint' => env('SMSMISR_ENDPOINT', 'https://smsmisr.com/api/'),

    'username' => env('SMSMISR_USERNAME'),
    'password' => env('SMSMISR_PASSWORD'),

    /*
     * Sender tokens from SMS Misr → Sender IDs (each is a long hex token, not a display name).
     * Test token works only with environment=2. Live token required for real handset delivery.
     */
    'test_sender' => env('SMSMISR_TEST_SENDER', env('SMSMISR_SENDER')),
    'live_sender' => env('SMSMISR_LIVE_SENDER', ''),

    /*
     * Resolved sender for the active environment (used by Smsmisr::send).
     */
    'sender' => ((int) env('SMSMISR_ENVIRONMENT', 2)) === 2
        ? env('SMSMISR_TEST_SENDER', env('SMSMISR_SENDER'))
        : (env('SMSMISR_LIVE_SENDER') ?: env('SMSMISR_SENDER')),

    'm_signature' => env('SMSMISR_M_SIGNATURE'),
    'token' => env('SMSMISR_TOKEN'),

    /*
     * Default SMS language: 1 = English, 2 = Arabic, 3 = Unicode
     * When set to 1, App\Services\SmsMisrService auto-picks Arabic if message contains Arabic text.
     */
    'language' => (int) env('SMSMISR_LANGUAGE', 1),

    'sms_id' => env('SMSMISR_SMS_ID', 4945703),
    'sms_verify_id' => env('SMSMISR_SMS_VERIFY_ID', 72973),

    /*
     * Normalize mobiles to API format e.g. 201064636452 (no + prefix)
     */
    'auto_normalize' => env('SMSMISR_AUTO_NORMALIZE', true),

    'timeout' => (int) env('SMSMISR_TIMEOUT', 30),
    'retries' => (int) env('SMSMISR_RETRIES', 0),
    'retry_delay' => (int) env('SMSMISR_RETRY_DELAY', 100),
    'rate_limit' => env('SMSMISR_RATE_LIMIT'),
    'queue' => env('SMSMISR_QUEUE'),
    'log_channel' => env('SMSMISR_LOG_CHANNEL'),
    'low_balance_threshold' => (int) env('SMSMISR_LOW_BALANCE_THRESHOLD', 100),
];
