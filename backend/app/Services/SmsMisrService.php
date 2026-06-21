<?php

namespace App\Services;

use Ghanem\LaravelSmsmisr\Facades\Smsmisr;
use Ghanem\LaravelSmsmisr\SmsmisrResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Beauty Clinic wrapper for SMS Misr HTTP API.
 *
 * @see https://smsmisr.com/api/SMS/  POST: environment, username, password, sender, mobile, language, message
 * @see https://smsmisr.com/api/Balance/ GET: username, password
 */
class SmsMisrService
{
    /** API language: 1 = English, 2 = Arabic, 3 = Unicode */
    public const LANGUAGE_ENGLISH = 1;
    public const LANGUAGE_ARABIC = 2;
    public const LANGUAGE_UNICODE = 3;

    /** Success response code from SMS Misr */
    public const CODE_SUCCESS = 1901;

    /** Official SMS Misr error codes (Guide SMS API) */
    public const ERROR_MESSAGES = [
        1902 => 'Invalid request',
        1903 => 'Invalid username or password',
        1904 => 'Invalid sender',
        1905 => 'Invalid mobile number',
        1906 => 'Insufficient credit',
        1907 => 'Server updating',
        1908 => 'Invalid DelayUntil format',
        1909 => 'Invalid message',
        1910 => 'Invalid language',
        1911 => 'Text too long',
        1912 => 'Invalid environment',
    ];

    public function isConfigured(): bool
    {
        return $this->configurationError() === null;
    }

    /** Why SMS cannot be sent (null = ready). */
    public function configurationError(): ?string
    {
        if (! empty(config('smsmisr.token'))) {
            return empty(config('smsmisr.sender')) ? 'Set SMSMISR_SENDER or SMSMISR_LIVE_SENDER.' : null;
        }

        if (empty(config('smsmisr.username')) || empty(config('smsmisr.password'))) {
            return 'Set SMSMISR_USERNAME and SMSMISR_PASSWORD in .env.';
        }

        if ($this->isTestEnvironment()) {
            return empty(config('smsmisr.test_sender'))
                ? 'Set SMSMISR_TEST_SENDER (test sender token from SMS Misr).'
                : null;
        }

        $liveSender = (string) config('smsmisr.live_sender');
        if ($liveSender === '') {
            return 'Live delivery requires SMSMISR_LIVE_SENDER — paste your approved sender token from smsmisr.com → Sender IDs (not the test token).';
        }

        $testSender = (string) config('smsmisr.test_sender');
        if ($testSender !== '' && $liveSender === $testSender) {
            return 'SMSMISR_LIVE_SENDER cannot be the test sender token. Use your approved live Sender ID token from the SMS Misr dashboard.';
        }

        return null;
    }

    /**
     * Live account balance (POST https://smsmisr.com/api/Balance/).
     *
     * @return array{ok: bool, balance: ?float, raw: ?array, message: string}
     */
    public function fetchBalance(): array
    {
        if (empty(config('smsmisr.username')) || empty(config('smsmisr.password'))) {
            return ['ok' => false, 'balance' => null, 'raw' => null, 'message' => 'Missing credentials'];
        }

        try {
            $response = Http::asForm()
                ->timeout((int) config('smsmisr.timeout', 30))
                ->post(rtrim((string) config('smsmisr.endpoint'), '/') . '/Balance/', [
                    'username' => config('smsmisr.username'),
                    'password' => config('smsmisr.password'),
                ]);

            $data = $response->json();
            if (! is_array($data)) {
                return ['ok' => false, 'balance' => null, 'raw' => null, 'message' => 'Invalid balance response'];
            }

            $balance = isset($data['Balance']) ? (float) $data['Balance'] : null;

            return [
                'ok'      => $balance !== null,
                'balance' => $balance,
                'raw'     => $data,
                'message' => $balance !== null ? "Balance: {$balance}" : 'Could not read balance',
            ];
        } catch (\Throwable $e) {
            return ['ok' => false, 'balance' => null, 'raw' => null, 'message' => $e->getMessage()];
        }
    }

    /** Test API (environment=2) validates requests but does NOT deliver SMS to handsets. */
    public function isTestEnvironment(): bool
    {
        return (int) config('smsmisr.environment', 2) === 2;
    }

    /**
     * Human-readable note after a successful API call (test vs live).
     */
    public function deliveryNote(): string
    {
        if ($this->isTestEnvironment()) {
            return 'Test environment (2): SMS Misr accepted the request (1901) but does not route messages to real phones. Set SMSMISR_ENVIRONMENT=1 and use an approved live Sender ID to deliver.';
        }

        return 'Live environment (1): message submitted to SMS Misr for carrier delivery.';
    }

    /**
     * Send one SMS (POST https://smsmisr.com/api/SMS/).
     *
     * @return array{ok: bool, code: int, message: string, sms_id: ?string, cost: ?string, test_mode: bool, delivered_to_phone: bool, delivery_note: string, response: ?SmsmisrResponse}
     */
    public function send(string $message, string $mobile, ?int $language = null): array
    {
        if (! $this->isConfigured()) {
            $configError = $this->configurationError() ?? 'SMS Misr is not configured';

            return [
                'ok'                 => false,
                'code'               => 0,
                'message'            => $configError,
                'sms_id'             => null,
                'cost'               => null,
                'test_mode'          => $this->isTestEnvironment(),
                'delivered_to_phone' => false,
                'delivery_note'      => $this->deliveryNote(),
                'response'           => null,
            ];
        }

        $language ??= $this->resolveLanguage($message);
        $testMode = $this->isTestEnvironment();

        try {
            $response = Smsmisr::send(
                $message,
                $mobile,
                config('smsmisr.sender'),
                $language,
            );

            $raw = $response->raw;
            $ok = $response->isSuccessful();

            if ($ok) {
                $logLevel = $testMode ? 'warning' : 'info';
                Log::log($logLevel, $testMode ? 'SMS Misr test accept (no handset delivery)' : 'SMS Misr sent', [
                    'mobile'  => $this->maskMobile($mobile),
                    'code'    => $response->code,
                    'sms_id'  => $raw['SMSID'] ?? null,
                    'cost'    => $raw['Cost'] ?? null,
                    'env'     => config('smsmisr.environment'),
                    'note'    => $testMode ? 'environment=2 does not deliver to real numbers' : null,
                ]);
            } else {
                Log::warning('SMS Misr rejected', [
                    'mobile' => $this->maskMobile($mobile),
                    'code'   => $response->code,
                    'detail' => $this->codeMessage($response->code),
                ]);
            }

            return [
                'ok'                 => $ok,
                'code'               => (int) $response->code,
                'message'            => $ok
                    ? ($testMode ? 'Accepted by test API (not delivered to phone)' : 'Sent')
                    : $this->codeMessage($response->code),
                'sms_id'             => isset($raw['SMSID']) ? (string) $raw['SMSID'] : null,
                'cost'               => isset($raw['Cost']) ? (string) $raw['Cost'] : null,
                'test_mode'          => $testMode,
                'delivered_to_phone' => $ok && ! $testMode,
                'delivery_note'      => $this->deliveryNote(),
                'response'           => $response,
            ];
        } catch (\Throwable $e) {
            Log::warning('SMS Misr send failed', [
                'mobile' => $this->maskMobile($mobile),
                'error'  => $e->getMessage(),
            ]);

            $code = method_exists($e, 'getCode') ? (int) $e->getCode() : 0;

            return [
                'ok'                 => false,
                'code'               => $code,
                'message'            => $e->getMessage(),
                'sms_id'             => null,
                'cost'               => null,
                'test_mode'          => $testMode,
                'delivered_to_phone' => false,
                'delivery_note'      => $this->deliveryNote(),
                'response'           => null,
            ];
        }
    }

    /**
     * Pick language per API guide: 1 Eng, 2 Arabic, 3 Unicode (hex body — rarely used here).
     */
    public function resolveLanguage(string $message): int
    {
        $configured = (int) config('smsmisr.language', self::LANGUAGE_ENGLISH);
        if ($configured !== self::LANGUAGE_ENGLISH) {
            return $configured;
        }

        if (preg_match('/[\x{0600}-\x{06FF}]/u', $message)) {
            return self::LANGUAGE_ARABIC;
        }

        return self::LANGUAGE_ENGLISH;
    }

    public function codeMessage(int $code): string
    {
        return self::ERROR_MESSAGES[$code] ?? "SMS Misr error (code {$code})";
    }

    private function maskMobile(string $mobile): string
    {
        $digits = preg_replace('/\D/', '', $mobile) ?? $mobile;
        if (strlen($digits) <= 4) {
            return '****';
        }

        return str_repeat('*', strlen($digits) - 4) . substr($digits, -4);
    }
}
