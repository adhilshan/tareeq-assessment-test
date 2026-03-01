<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('towing_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assigned_driver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('pickup_lat', 10, 8);
            $table->decimal('pickup_lng', 11, 8);
            $table->string('pickup_address')->nullable();
            $table->text('note')->nullable();
            $table->enum('status', ['pending', 'assigned', 'completed'])->default('pending');
            $table->timestamps();

            $table->index(['status', 'assigned_driver_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('towing_requests');
    }
};
