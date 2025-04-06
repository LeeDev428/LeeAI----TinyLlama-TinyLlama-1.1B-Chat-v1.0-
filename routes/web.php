<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ChatbotController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::get('/chatbot', [ChatbotController::class, 'index'])->name('chatbot'); // This serves the Chatbot UI
Route::post('/chatbot/chat', [ChatbotController::class, 'chat']); // This handles the chat messages

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
