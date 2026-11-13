<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any?}', function () {
    $indexPath = public_path('index.html');
    if (file_exists($indexPath)) {
        return response()->file($indexPath);
    }
    return response()->json([
        'app' => 'SmartOMR — Automated OMR Examination & Evaluation System',
        'status' => 'operational',
        'api_version' => '1.0.0',
    ]);
})->where('any', '^(?!api|storage).*$');

