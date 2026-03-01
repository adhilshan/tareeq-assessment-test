<?php

namespace App\Events;

use App\Models\TowingRequest;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewTowingRequestCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public TowingRequest $towingRequest,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('private-driver-channel'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'NewTowingRequestCreated';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->towingRequest->id,
            'customer_name' => $this->towingRequest->customer->name,
            'pickup_lat' => $this->towingRequest->pickup_lat,
            'pickup_lng' => $this->towingRequest->pickup_lng,
            'note' => $this->towingRequest->note,
            'status' => $this->towingRequest->status,
            'created_at' => $this->towingRequest->created_at->toIso8601String(),
        ];
    }
}
