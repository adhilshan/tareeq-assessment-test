<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('private-driver-channel', function ($user) {
    return $user->role === 'driver';
});

Broadcast::channel('private-customer-{customerId}', function ($user, $customerId) {
    return (int) $user->id === (int) $customerId && $user->role === 'customer';
});
