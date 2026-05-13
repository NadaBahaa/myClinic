<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\MaterialOrTool\StoreMaterialOrToolRequest;
use App\Http\Requests\MaterialOrTool\UpdateMaterialOrToolRequest;
use App\Http\Resources\MaterialOrToolResource;
use App\Models\MaterialOrTool;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaterialOrToolController extends Controller
{
    public function __construct()
    {
        $this->middleware('role:admin,superadmin,assistant,doctor')->only(['store', 'update', 'destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        $query = MaterialOrTool::query();

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('supplier', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        return response()->json(MaterialOrToolResource::collection($query->get()));
    }

    public function store(StoreMaterialOrToolRequest $request): JsonResponse
    {
        $item = MaterialOrTool::create([
            'name'           => $request->name,
            'type'           => $request->type,
            'unit_price'     => $request->unitPrice,
            'unit'           => $request->unit,
            'stock_quantity' => $request->stockQuantity,
            'supplier'       => $request->supplier,
            'notes'          => $request->notes,
        ]);

        return response()->json(new MaterialOrToolResource($item), 201);
    }

    public function show(string $uuid): JsonResponse
    {
        $item = MaterialOrTool::where('uuid', $uuid)->firstOrFail();

        return response()->json(new MaterialOrToolResource($item));
    }

    public function update(UpdateMaterialOrToolRequest $request, string $uuid): JsonResponse
    {
        $item = MaterialOrTool::where('uuid', $uuid)->firstOrFail();

        $data = [];
        if ($request->has('name'))          $data['name']           = $request->name;
        if ($request->has('type'))          $data['type']           = $request->type;
        if ($request->has('unitPrice'))     $data['unit_price']     = $request->unitPrice;
        if ($request->has('unit'))          $data['unit']           = $request->unit;
        if ($request->has('stockQuantity')) $data['stock_quantity'] = $request->stockQuantity;
        if ($request->has('supplier'))      $data['supplier']       = $request->supplier;
        if ($request->has('notes'))         $data['notes']          = $request->notes;

        $item->update($data);

        return response()->json(new MaterialOrToolResource($item));
    }

    public function destroy(string $uuid): JsonResponse
    {
        $item = MaterialOrTool::where('uuid', $uuid)->firstOrFail();
        $item->delete();

        return response()->json(['message' => 'Item deleted']);
    }
}
