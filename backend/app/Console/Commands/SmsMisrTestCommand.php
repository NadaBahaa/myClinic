<?php

namespace App\Console\Commands;

use App\Services\SmsMisrService;
use Illuminate\Console\Command;

class SmsMisrTestCommand extends Command
{
    protected $signature = 'sms:test
                            {mobile : Egyptian mobile e.g. 201064636452 or +201064636452}
                            {message=Test from Beauty Clinic : SMS body}
                            {--language= : Force language 1=Eng, 2=Arabic, 3=Unicode}';

    protected $description = 'Send SMS via SMS Misr (environment=1 + live sender required for real delivery)';

    public function handle(SmsMisrService $sms): int
    {
        if (! $sms->isConfigured()) {
            $this->error($sms->configurationError() ?? 'SMS Misr is not configured.');

            return self::FAILURE;
        }

        $env = (int) config('smsmisr.environment');
        if ($env === 2) {
            $this->warn('⚠  SMSMISR_ENVIRONMENT=2 (Test): API may return 1901 success but NO SMS is delivered to your phone.');
            $this->warn('   Use this only to verify credentials. For real delivery set environment=1 and an approved live Sender ID.');
            $this->newLine();
        } else {
            $this->info('Environment: 1 (Live) — messages should reach the handset if sender and balance are valid.');
            $this->newLine();
        }

        $this->line('Endpoint: ' . rtrim((string) config('smsmisr.endpoint'), '/') . '/SMS/');

        $message = (string) $this->argument('message');
        $mobile = (string) $this->argument('mobile');
        $language = $this->option('language') !== null
            ? (int) $this->option('language')
            : $sms->resolveLanguage($message);

        $this->line("Language: {$language} (1=Eng, 2=Arabic, 3=Unicode)");
        $this->line("Mobile: {$mobile}");
        $this->line('Message: ' . $message);
        $this->newLine();

        $result = $sms->send($message, $mobile, $language);

        if ($result['ok']) {
            $this->info("API accepted (code {$result['code']})");
            if ($result['sms_id']) {
                $this->line('SMSID: ' . $result['sms_id']);
            }
            if ($result['cost']) {
                $this->line('Cost: ' . $result['cost']);
            }
            $this->newLine();
            if ($result['test_mode']) {
                $this->warn($result['delivery_note']);
            } else {
                $this->info($result['delivery_note']);
            }

            return self::SUCCESS;
        }

        $this->error("Failed (code {$result['code']}): {$result['message']}");
        if ($result['code'] === 1904) {
            $this->warn('1904 = Invalid sender. The test sender token only works with environment=2. Live sends need your approved Sender ID from smsmisr.com.');
        }

        return self::FAILURE;
    }
}
