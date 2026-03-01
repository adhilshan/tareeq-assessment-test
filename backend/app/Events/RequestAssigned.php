<?php

namespace App\Events;

use App\Models\TowingRequest;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RequestAssigned implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public TowingRequest $towingRequest,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('private-customer-' . $this->towingRequest->customer_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'RequestAssigned';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->towingRequest->id,
            'assigned_driver_id' => $this->towingRequest->assigned_driver_id,
            'assigned_driver_name' => $this->towingRequest->assignedDriver?->name,
            'status' => $this->towingRequest->status,
            'updated_at' => $this->towingRequest->updated_at->toIso8601String(),
        ];
    }
}
