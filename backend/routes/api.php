<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\TowingRequestController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Route::post('broadcasting/auth', fn() => Broadcast::auth(request()))->middleware('auth:api');

Route::prefix('v1')->middleware('throttle:api')->group(function () {
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:api')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);

        Route::prefix('requests')->group(function () {
            Route::get('/', [TowingRequestController::class, 'index']);
            Route::get('{id}', [TowingRequestController::class, 'show']);
            Route::post('/', [TowingRequestController::class, 'store'])->middleware('throttle:request-creation');
            Route::post('{id}/accept', [TowingRequestController::class, 'accept'])->middleware('role:driver');
            Route::post('{id}/reject', [TowingRequestController::class, 'reject'])->middleware('role:driver');
            Route::post('{id}/complete', [TowingRequestController::class, 'complete'])->middleware('role:driver');
        });
    });
});
