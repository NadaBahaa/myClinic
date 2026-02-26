<?php

namespace App\Http\Middleware;

use App\Models\ApiRequestLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiRequestLogMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);

        $response = $next($request);

        $responseTimeMs = (int) round((microtime(true) - $start) * 1000);

        $path = $request->path();
        if (str_starts_with($path, 'api/')) {
            $path = substr($path, 4);
        }

        $requestPayload = null;
        if (in_array($request->method(), ['POST', 'PUT', 'PATCH']) && $request->getContent()) {
            $requestPayload = $request->getContent();
            if (strlen($requestPayload) > 10000) {
                $requestPayload = substr($requestPayload, 0, 10000) . '...[truncated]';
            }
        }

        $responseBody = null;
        if ($response->getContent()) {
            $responseBody = $response->getContent();
            if (strlen($responseBody) > 15000) {
                $responseBody = substr($responseBody, 0, 15000) . '...[truncated]';
            }
        }

        $headers = $request->headers->all();
        unset($headers['authorization'], $headers['cookie']);
        $requestHeaders = json_encode($headers);

        try {
            ApiRequestLog::create([
                'method'           => $request->method(),
                'path'             => $path,
                'user_id'          => $request->user()?->id,
                'ip'               => $request->ip(),
                'response_status' => $response->getStatusCode(),
                'request_headers' => $requestHeaders,
                'request_payload'  => $requestPayload,
                'response_body'    => $responseBody,
                'response_time_ms' => $responseTimeMs,
            ]);
        } catch (\Throwable $e) {
            // avoid breaking the request if log fails
        }

        return $response;
    }
}
