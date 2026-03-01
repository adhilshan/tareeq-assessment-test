<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TowingRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'customer_name' => $this->customer?->name,
            'assigned_driver_id' => $this->assigned_driver_id,
            'assigned_driver_name' => $this->assignedDriver?->name,
            'pickup_lat' => (float) $this->pickup_lat,
            'pickup_lng' => (float) $this->pickup_lng,
            'pickup_address' => $this->pickup_address,
            'note' => $this->note,
            'status' => $this->status,
            'distance' => $this->when(isset($this->distance), (float) $this->distance),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
