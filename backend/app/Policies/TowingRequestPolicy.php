<?php

namespace App\Policies;

use App\Models\TowingRequest;
use App\Models\User;

class TowingRequestPolicy
{
    public function view(User $user, TowingRequest $request): bool
    {
        if ($user->id === $request->customer_id || $user->id === $request->assigned_driver_id) {
            return true;
        }

        return $user->isDriver() && $request->isPending();
    }

    public function create(User $user): bool
    {
        return $user->isCustomer();
    }

    public function accept(User $user, TowingRequest $request): bool
    {
        return $user->isDriver() && $request->isPending();
    }
}
