<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Service\StoreServiceRequest;
use App\Http\Requests\Service\UpdateServiceRequest;
use App\Http\Resources\ServiceResource;
use App\Models\MaterialOrTool;
use App\Models\PractitionerType;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Service::with(['practitionerTypes', 'materials']);

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        if ($request->boolean('popular')) {
            $query->where('popular', true);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return response()->json(ServiceResource::collection($query->get()));
    }

    public function store(StoreServiceRequest $request): JsonResponse
    {
        $service = Service::create([
            'name'        => $request->name,
            'category'    => $request->category,
            'duration'    => $request->duration,
            'price'       => $request->price,
            'description' => $request->description,
            'popular'     => $request->popular ?? false,
        ]);

        if ($request->allowedPractitionerTypeIds) {
            $ptIds = PractitionerType::whereIn('uuid', $request->allowedPractitionerTypeIds)->pluck('id');
            $service->practitionerTypes()->sync($ptIds);
        }

        if ($request->has('defaultMaterials')) {
            $this->syncServiceMaterials($service, $request->input('defaultMaterials'));
        }

        $service->load(['practitionerTypes', 'materials']);

        return response()->json(new ServiceResource($service), 201);
    }

    public function show(string $uuid): JsonResponse
    {
        $service = Service::where('uuid', $uuid)->with(['practitionerTypes', 'materials'])->firstOrFail();

        return response()->json(new ServiceResource($service));
    }

    public function update(UpdateServiceRequest $request, string $uuid): JsonResponse
    {
        $service = Service::where('uuid', $uuid)->firstOrFail();

        $data = [];
        foreach (['name', 'category', 'duration', 'price', 'description', 'popular'] as $field) {
            if ($request->has($field)) $data[$field] = $request->$field;
        }

        $service->update($data);

        if ($request->has('allowedPractitionerTypeIds')) {
            $ptIds = PractitionerType::whereIn('uuid', $request->allowedPractitionerTypeIds ?? [])->pluck('id');
            $service->practitionerTypes()->sync($ptIds);
        }

        if ($request->has('defaultMaterials')) {
            $this->syncServiceMaterials($service, $request->input('defaultMaterials'));
        }

        $service->load(['practitionerTypes', 'materials']);

        return response()->json(new ServiceResource($service));
    }

    public function destroy(string $uuid): JsonResponse
    {
        $service = Service::where('uuid', $uuid)->firstOrFail();
        $service->delete();

        return response()->json(['message' => 'Service deleted']);
    }

    /**
     * @param  array<int, array{materialId?: string, defaultQuantity?: float|int}>|null  $links
     */
    private function syncServiceMaterials(Service $service, ?array $links): void
    {
        if ($links === null) {
            return;
        }

        $sync = [];
        foreach ($links as $row) {
            $materialUuid = $row['materialId'] ?? null;
            if (! $materialUuid) {
                continue;
            }
            $material = MaterialOrTool::where('uuid', $materialUuid)->first();
            if (! $material) {
                continue;
            }
            $qty = isset($row['defaultQuantity']) ? (float) $row['defaultQuantity'] : 1.0;
            $sync[$material->id] = ['default_quantity' => $qty];
        }

        $service->materials()->sync($sync);
    }
}
