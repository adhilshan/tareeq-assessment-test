<?php

namespace App\Http\Controllers\Api;

/**
 * @OA\Info(
 *     title="Towing Management API",
 *     version="1.0.0",
 *     description="API for towing request management"
 * )
 *
 * @OA\Server(url="http://localhost:8000", description="Local")
 * @OA\Server(url="http://127.0.0.1:8000", description="Local 2")
 *
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT"
 * )
 *
 * @OA\Schema(
 *     schema="ApiResponse",
 *     type="object",
 *     @OA\Property(property="success", type="boolean", example=true),
 *     @OA\Property(property="message", type="string", example="Success"),
 *     @OA\Property(property="data", type="object"),
 *     @OA\Property(property="errors", type="object", nullable=true)
 * )
 */
class SwaggerController
{
}
