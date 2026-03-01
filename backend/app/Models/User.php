<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return ['role' => $this->role];
    }

    public function isCustomer(): bool
    {
        return $this->role === 'customer';
    }

    public function isDriver(): bool
    {
        return $this->role === 'driver';
    }

    public function towingRequestsAsCustomer(): HasMany
    {
        return $this->hasMany(TowingRequest::class, 'customer_id');
    }

    public function towingRequestsAsDriver(): HasMany
    {
        return $this->hasMany(TowingRequest::class, 'assigned_driver_id');
    }
}
