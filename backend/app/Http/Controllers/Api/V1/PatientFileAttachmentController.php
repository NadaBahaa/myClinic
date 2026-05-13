<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PatientFile;
use App\Models\PatientFileAttachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PatientFileAttachmentController extends Controller
{
    public function index(Request $request, string $fileUuid): JsonResponse
    {
        $file = PatientFile::where('uuid', $fileUuid)->firstOrFail();
        if ($request->user()?->role === 'doctor' && $request->user()->doctor?->id !== $file->doctor_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $attachments = $file->attachments()->with('sessionRecord')->latest()->get();
        return response()->json([
            'data' => $attachments->map(fn ($a) => [
                'id'   => $a->uuid,
                'name' => $a->name,
                'path' => '/storage/' . $a->path,
                'mimeType' => $a->mime_type,
                'sessionId' => $a->session_record_id ? $a->sessionRecord?->uuid : null,
                'createdAt' => $a->created_at?->toIso8601String(),
            ]),
        ]);
    }

    public function store(Request $request, string $fileUuid): JsonResponse
    {
        $file = PatientFile::where('uuid', $fileUuid)->firstOrFail();
        if ($request->user()?->role === 'doctor' && $request->user()->doctor?->id !== $file->doctor_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $request->validate([
            'file'       => 'required|file|max:20480',
            'name'       => 'nullable|string|max:255',
            'session_id' => 'nullable|exists:session_records,uuid',
        ]);
        $uploaded = $request->file('file');
        $path = $uploaded->store('patient-file-attachments', 'public');
        $sessionId = null;
        if ($request->session_id) {
            $sessionId = \App\Models\SessionRecord::where('uuid', $request->session_id)->value('id');
        }
        $attachment = PatientFileAttachment::create([
            'patient_file_id'      => $file->id,
            'session_record_id'   => $sessionId,
            'name'                => $request->input('name') ?: $uploaded->getClientOriginalName(),
            'path'                => $path,
            'mime_type'           => $uploaded->getMimeType(),
            'uploaded_by_user_id' => $request->user()?->id,
        ]);
        return response()->json([
            'id'        => $attachment->uuid,
            'name'      => $attachment->name,
            'path'      => '/storage/'.$attachment->path,
            'mimeType'  => $attachment->mime_type,
            'createdAt' => $attachment->created_at?->toIso8601String(),
        ], 201);
    }

    public function destroy(Request $request, string $fileUuid, string $attachmentUuid): JsonResponse
    {
        $file = PatientFile::where('uuid', $fileUuid)->firstOrFail();
        if ($request->user()?->role === 'doctor' && $request->user()->doctor?->id !== $file->doctor_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $attachment = PatientFileAttachment::where('uuid', $attachmentUuid)->where('patient_file_id', $file->id)->firstOrFail();
        if (Storage::disk('public')->exists($attachment->path)) {
            Storage::disk('public')->delete($attachment->path);
        }
        $attachment->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
