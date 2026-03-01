<?php

namespace App\Providers;

use App\Contracts\TowingRequestRepositoryInterface;
use App\Repositories\TowingRequestRepository;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            TowingRequestRepositoryInterface::class,
            TowingRequestRepository::class
        );
    }

    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(config('rate_limit.global', 60))->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('request-creation', function (Request $request) {
            return Limit::perMinute(config('rate_limit.request_creation', 10))->by($request->user()?->id ?: $request->ip());
        });
    }
}
