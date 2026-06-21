<?php

use App\Http\Controllers\ApiDocsController;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/docs', [ApiDocsController::class, 'swagger'])->name('api.docs');
Route::get('/docs/openapi.yaml', [ApiDocsController::class, 'spec'])->name('api.docs.spec');

Route::get('/', function () {
    $spa = public_path('index.html');
    if (File::exists($spa)) {
        return response()->file($spa, ['Content-Type' => 'text/html; charset=UTF-8']);
    }

    return view('welcome');
});

Route::fallback(function () {
    if (request()->is('api/*', 'storage/*', 'assets/*', 'docs', 'docs/*')) {
        abort(404);
    }

    $spa = public_path('index.html');
    if (File::exists($spa)) {
        return response()->file($spa, ['Content-Type' => 'text/html; charset=UTF-8']);
    }

    abort(404);
});
