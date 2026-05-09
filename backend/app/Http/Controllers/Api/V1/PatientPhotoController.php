<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PatientPhotoResource;
use App\Models\PatientFile;
use App\Models\PatientPhoto;
use App\Models\SessionRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PatientPhotoController extends Controller
{
    public function index(string $fileUuid): JsonResponse
    {
        $file   = PatientFile::where('uuid', $fileUuid)->firstOrFail();
        $photos = $file->photos()->with('session')->latest()->get();

        return response()->json(PatientPhotoResource::collection($photos));
    }

    public function store(Request $request, string $fileUuid): JsonResponse
    {
        $file = PatientFile::where('uuid', $fileUuid)->firstOrFail();

        $request->validate([
            'photo'      => 'required|file|mimetypes:image/jpeg,image/png,image/jpg,image/gif,image/webp,image/heic,image/heif|max:10240',
            'type'       => 'required|in:before,after,during',
            'notes'      => 'nullable|string|max:500',
            'session_id' => 'nullable|exists:session_records,uuid',
        ]);

        $path = $request->file('photo')->store('patient-photos', 'public');

        $sessionId = null;
        if ($request->session_id) {
            $sr        = SessionRecord::where('uuid', $request->session_id)->first();
            $sessionId = $sr?->id;
        }

        $photo = PatientPhoto::create([
            'uuid'            => (string) Str::uuid(),
            'patient_file_id' => $file->id,
            'url'             => '/storage/' . $path,
            'type'            => $request->type,
            'uploaded_by'     => $request->user()->name,
            'notes'           => $request->notes,
            'session_id'      => $sessionId,
        ]);

        $photo->load('session');

        return response()->json(new PatientPhotoResource($photo), 201);
    }

    public function destroy(string $fileUuid, string $photoUuid): JsonResponse
    {
        $file  = PatientFile::where('uuid', $fileUuid)->firstOrFail();
        $photo = PatientPhoto::where('uuid', $photoUuid)
            ->where('patient_file_id', $file->id)
            ->firstOrFail();

        // Remove physical file
        $storagePath = str_replace('/storage/', '', $photo->url);
        Storage::disk('public')->delete($storagePath);

        $photo->delete();

        return response()->json(['message' => 'Photo deleted']);
    }
}
