<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

use App\Http\Controllers\ApiDocsController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/docs', [ApiDocsController::class, 'swagger'])->name('api.docs');
Route::get('/docs/openapi.yaml', [ApiDocsController::class, 'spec'])->name('api.docs.spec');
