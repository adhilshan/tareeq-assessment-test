<?php

namespace App\Http\Controllers\Api\V1;

use App\DTOs\CreateTowingRequestDTO;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\CreateTowingRequestRequest;
use App\Http\Resources\TowingRequestResource;
use App\Services\TowingRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * @OA\Tag(name="Requests", description="Towing request endpoints")
 */
class TowingRequestController extends BaseApiController
{
    public function __construct(
        private TowingRequestService $towingRequestService,
    ) {
    }

    /**
     * @OA\Get(
     *     path="/api/v1/requests",
     *     tags={"Requests"},
     *     summary="List requests",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Success")
     * )
     */
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        $user = $request->user();

        if ($user->isDriver()) {
            $requests = $this->towingRequestService->getForDriver(
                $user,
                $request->query('lat'),
                $request->query('lng')
            );
            return TowingRequestResource::collection($requests);
        }

        $paginated = $this->towingRequestService->getForCustomer($user);
        return TowingRequestResource::collection($paginated);
    }

    /**
     * @OA\Post(
     *     path="/api/v1/requests",
     *     tags={"Requests"},
     *     summary="Create towing request",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(required={"customer_name","pickup_lat","pickup_lng"}, @OA\Property(property="customer_name", type="string"), @OA\Property(property="pickup_lat", type="number"), @OA\Property(property="pickup_lng", type="number"), @OA\Property(property="note", type="string"))),
     *     @OA\Response(response=201, description="Created"),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function store(CreateTowingRequestRequest $request): JsonResponse
    {
        $dto = CreateTowingRequestDTO::fromArray($request->validated(), $request->user()->id);
        $towingRequest = $this->towingRequestService->create($dto);

        return $this->successResponse(
            new TowingRequestResource($towingRequest),
            'Towing request created successfully',
            201
        );
    }

    /**
     * @OA\Get(
     *     path="/api/v1/requests/{id}",
     *     tags={"Requests"},
     *     summary="Get request by ID",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Success"),
     *     @OA\Response(response=404, description="Not found")
     * )
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $towingRequest = $this->towingRequestService->find($id);

        if (!$towingRequest) {
            return $this->errorResponse('Request not found', null, 404);
        }

        $this->authorize('view', $towingRequest);

        return $this->successResponse(new TowingRequestResource($towingRequest));
    }

    /**
     * @OA\Post(
     *     path="/api/v1/requests/{id}/accept",
     *     tags={"Requests"},
     *     summary="Accept request (driver only)",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Success"),
     *     @OA\Response(response=404, description="Not found"),
     *     @OA\Response(response=422, description="Request already assigned")
     * )
     */
    public function accept(Request $request, int $id): JsonResponse
    {
        $towingRequest = $this->towingRequestService->find($id);

        if (!$towingRequest) {
            return $this->errorResponse('Request not found', null, 404);
        }

        $this->authorize('accept', $towingRequest);

        try {
            $towingRequest = $this->towingRequestService->accept($id, $request->user());
            return $this->successResponse(
                new TowingRequestResource($towingRequest),
                'Request accepted successfully'
            );
        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), null, 422);
        }
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $towingRequest = $this->towingRequestService->find($id);

        if (!$towingRequest) {
            return $this->errorResponse('Request not found', null, 404);
        }

        $this->towingRequestService->reject($id, $request->user());

        return $this->successResponse(null, 'Request rejected successfully');
    }

    public function complete(Request $request, int $id): JsonResponse
    {
        $towingRequest = $this->towingRequestService->find($id);

        if (!$towingRequest) {
            return $this->errorResponse('Request not found', null, 404);
        }

        try {
            $towingRequest = $this->towingRequestService->complete($id, $request->user());
            return $this->successResponse(
                new TowingRequestResource($towingRequest),
                'Request completed successfully'
            );
        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), null, 422);
        }
    }
}
