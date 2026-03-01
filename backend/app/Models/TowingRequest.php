<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TowingRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'assigned_driver_id',
        'pickup_lat',
        'pickup_lng',
        'pickup_address',
        'note',
        'status',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function assignedDriver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_driver_id');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isAssigned(): bool
    {
        return $this->status === 'assigned';
    }
}
