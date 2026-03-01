<?php

namespace App\Contracts;

use App\Models\TowingRequest;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface TowingRequestRepositoryInterface
{
    public function create(array $data): TowingRequest;

    public function find(int $id): ?TowingRequest;

    public function update(TowingRequest $request, array $data): TowingRequest;

    public function getUnassignedForDriverFiltered(int $driverId): Collection;

    public function reject(int $requestId, int $driverId): void;

    public function getAssignedToDriver(int $driverId): Collection;

    public function getByCustomer(int $customerId): LengthAwarePaginator;
}
