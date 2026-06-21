<?php

namespace App\Http\Controllers;

use Illuminate\View\View;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ApiDocsController extends Controller
{
    public function swagger(): View
    {
        return view('swagger');
    }

    public function spec(): BinaryFileResponse
    {
        $path = base_path('docs/openapi.yaml');

        abort_unless(is_file($path), 404, 'OpenAPI specification not found.');

        return response()->file($path, [
            'Content-Type' => 'application/yaml',
        ]);
    }
}
