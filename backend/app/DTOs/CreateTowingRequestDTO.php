<?php

namespace App\DTOs;

class CreateTowingRequestDTO
{
    public function __construct(
        public readonly int $customerId,
        public readonly string $customerName,
        public readonly float $pickupLat,
        public readonly float $pickupLng,
        public readonly ?string $pickupAddress = null,
        public readonly ?string $note = null,
    ) {
    }

    public static function fromArray(array $data, int $customerId): self
    {
        $location = $data['location'];

        return new self(
            customerId: $customerId,
            customerName: $data['customer_name'],
            pickupLat: (float) $location['lat'],
            pickupLng: (float) $location['lng'],
            pickupAddress: $location['address'] ?? null,
            note: $data['note'] ?? null,
        );
    }
}
