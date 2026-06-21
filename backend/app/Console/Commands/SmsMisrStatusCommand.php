<?php

namespace App\Console\Commands;

use App\Services\SmsMisrService;
use Illuminate\Console\Command;

class SmsMisrStatusCommand extends Command
{
    protected $signature = 'sms:status';

    protected $description = 'Show SMS Misr live/test mode, balance, and configuration readiness';

    public function handle(SmsMisrService $sms): int
    {
        $env = (int) config('smsmisr.environment');
        $this->line('Environment: ' . ($env === 2 ? '2 (Test — no handset delivery)' : '1 (Live — routes to real phones)'));
        $this->line('Active sender: ' . ($this->mask((string) config('smsmisr.sender')) ?: '(none)'));

        if ($error = $sms->configurationError()) {
            $this->error('Configuration: ' . $error);
        } else {
            $this->info('Configuration: ready');
        }

        $balance = $sms->fetchBalance();
        if ($balance['ok']) {
            $this->info('Live balance: ' . $balance['balance'] . ' credits');
        } else {
            $this->warn('Balance check: ' . $balance['message']);
        }

        if ($env === 1 && $sms->isConfigured()) {
            $this->newLine();
            $this->info('Live mode is active. Test with: php artisan sms:test 201XXXXXXXXX "your message"');
        }

        return $error ? self::FAILURE : self::SUCCESS;
    }

    private function mask(string $token): string
    {
        if ($token === '') {
            return '';
        }
        if (strlen($token) <= 12) {
            return $token;
        }

        return substr($token, 0, 8) . '…' . substr($token, -8);
    }
}
