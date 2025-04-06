<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatbotController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('chatbot'); // This should match your React component
    }

    public function chat(Request $request)
    {
        $message = $request->input('message');

        // ...existing code...
        try {
            // Forward the message to the Python backend with a timeout
            $response = Http::timeout(5)->post('http://127.0.0.1:5000/chat', [
                'message' => $message,
            ]);

            // Log only in case of errors or debugging
            if ($response->failed()) {
                Log::error("Python backend returned an error: " . $response->status());
                return response()->json(['reply' => 'Sorry, something went wrong.'], 500);
            }

            $reply = $response->json('reply');
            return response()->json(['reply' => $reply]);
        } catch (\Exception $e) {
            Log::error("Error communicating with Python backend: " . $e->getMessage());
            return response()->json(['reply' => 'Sorry, something went wrong.'], 500);
        }
        // ...existing code...
    }
}
