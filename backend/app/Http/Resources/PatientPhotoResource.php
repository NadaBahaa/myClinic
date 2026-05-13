<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class PatientPhotoResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'         => $this->uuid,
            'url'        => $this->absolutePublicUrl($request),
            'type'       => $this->type,
            'sessionId'  => $this->session?->uuid,
            'uploadedAt' => $this->created_at,
            'uploadedBy' => $this->uploaded_by,
            'notes'      => $this->notes,
        ];
    }

    /**
     * Browser-ready URL for the stored file. Uses the incoming API request host/port so it matches
     * `php artisan serve` / XAMPP even when APP_URL is wrong or missing a port.
     */
    private function absolutePublicUrl($request): ?string
    {
        $url = $this->url;
        if ($url === null || $url === '') {
            return null;
        }
        if (Str::startsWith($url, ['http://', 'https://'])) {
            return $url;
        }

        $base = rtrim($request->getSchemeAndHttpHost(), '/');

        return $base.'/'.ltrim((string) $url, '/');
    }
}
