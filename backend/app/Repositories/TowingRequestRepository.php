<?php

namespace App\Repositories;

use App\Contracts\TowingRequestRepositoryInterface;
use App\Models\TowingRequest;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class TowingRequestRepository implements TowingRequestRepositoryInterface
{
    public function create(array $data): TowingRequest
    {
        return TowingRequest::create($data);
    }

    public function find(int $id): ?TowingRequest
    {
        return TowingRequest::with(['customer', 'assignedDriver'])->find($id);
    }

    public function update(TowingRequest $request, array $data): TowingRequest
    {
        $request->update($data);
        return $request->fresh(['customer', 'assignedDriver']);
    }

    public function getUnassignedForDriverFiltered(int $driverId): Collection
    {
        return TowingRequest::with('customer')
            ->whereNull('assigned_driver_id')
            ->where('status', 'pending')
            ->whereNotExists(function ($query) use ($driverId) {
                $query->select(\DB::raw(1))
                    ->from('driver_rejections')
                    ->whereColumn('driver_rejections.towing_request_id', 'towing_requests.id')
                    ->where('driver_rejections.driver_id', $driverId);
            })
            ->orderByDesc('created_at')
            ->get();
    }

    public function reject(int $requestId, int $driverId): void
    {
        \DB::table('driver_rejections')->updateOrInsert(
            ['driver_id' => $driverId, 'towing_request_id' => $requestId],
            ['created_at' => now(), 'updated_at' => now()]
        );
    }

    public function getAssignedToDriver(int $driverId): Collection
    {
        return TowingRequest::with('customer')
            ->where('assigned_driver_id', $driverId)
            ->whereIn('status', ['assigned', 'completed'])
            ->orderByDesc('created_at')
            ->get();
    }

    public function getByCustomer(int $customerId): LengthAwarePaginator
    {
        return TowingRequest::with('assignedDriver')
            ->where('customer_id', $customerId)
            ->orderByDesc('created_at')
            ->paginate(15);
    }
}
