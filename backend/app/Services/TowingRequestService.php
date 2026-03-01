<?php

namespace App\Services;

use App\Contracts\TowingRequestRepositoryInterface;
use App\DTOs\CreateTowingRequestDTO;
use App\Events\NewTowingRequestCreated;
use App\Events\RequestAssigned;
use App\Models\TowingRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class TowingRequestService
{
    public function __construct(
        private TowingRequestRepositoryInterface $repository,
    ) {
    }

    public function create(CreateTowingRequestDTO $dto): TowingRequest
    {
        $request = $this->repository->create([
            'customer_id' => $dto->customerId,
            'pickup_lat' => $dto->pickupLat,
            'pickup_lng' => $dto->pickupLng,
            'pickup_address' => $dto->pickupAddress,
            'note' => $dto->note,
            'status' => 'pending',
        ]);

        broadcast(new NewTowingRequestCreated($request))->toOthers();

        return $request->load('customer');
    }

    public function accept(int $requestId, User $driver): TowingRequest
    {
        $request = $this->repository->find($requestId);

        if (!$request || !$request->isPending()) {
            throw new \InvalidArgumentException('Request not found or already assigned.');
        }

        $request = $this->repository->update($request, [
            'assigned_driver_id' => $driver->id,
            'status' => 'assigned',
        ]);

        broadcast(new RequestAssigned($request))->toOthers();

        return $request;
    }

    public function reject(int $requestId, User $driver): void
    {
        $this->repository->reject($requestId, $driver->id);
    }

    public function complete(int $requestId, User $driver): TowingRequest
    {
        $request = $this->repository->find($requestId);

        if (!$request || $request->assigned_driver_id !== $driver->id) {
            throw new \InvalidArgumentException('Request not found or not assigned to you.');
        }

        if ($request->status !== 'assigned') {
            throw new \InvalidArgumentException('Request is not in a state that can be completed.');
        }

        $request = $this->repository->update($request, [
            'status' => 'completed',
        ]);

        return $request;
    }

    public function getForDriver(User $driver, ?float $lat = null, ?float $lng = null): Collection
    {
        $unassigned = $this->repository->getUnassignedForDriverFiltered($driver->id);
        $assigned = $this->repository->getAssignedToDriver($driver->id);

        $requests = $unassigned->merge($assigned);

        if ($lat !== null && $lng !== null) {
            foreach ($requests as $request) {
                $request->distance = $this->calculateDistance(
                    $lat,
                    $lng,
                    (float) $request->pickup_lat,
                    (float) $request->pickup_lng
                );
            }
        }

        return $requests->sortByDesc('created_at')->values();
    }

    private function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371; // km

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    public function getForCustomer(User $customer): LengthAwarePaginator
    {
        return $this->repository->getByCustomer($customer->id);
    }

    public function find(int $id): ?TowingRequest
    {
        return $this->repository->find($id);
    }
}
