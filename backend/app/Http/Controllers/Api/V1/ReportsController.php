<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\SessionRecordResource;
use App\Models\SessionRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportsController extends Controller
{
    /**
     * List all sessions for reporting (admin/accountant). Optional date range and search.
     */
    public function sessions(Request $request): JsonResponse
    {
        $query = SessionRecord::with(['patientFile.patient', 'patientFile.doctor', 'materialUsages.material', 'appointment', 'service']);

        if ($dateFrom = $request->query('date_from')) {
            $query->whereDate('date', '>=', $dateFrom);
        }
        if ($dateTo = $request->query('date_to')) {
            $query->whereDate('date', '<=', $dateTo);
        }
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('service_name', 'like', "%{$search}%")
                  ->orWhere('performed_by', 'like', "%{$search}%")
                  ->orWhereHas('patientFile.patient', fn($p) => $p->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
            });
        }

        $sessions = $query->latest('date')->paginate((int) $request->query('per_page', 50));

        $totals = [
            'total_sales'    => (float) SessionRecord::when($dateFrom ?? null, fn($q) => $q->whereDate('date', '>=', $dateFrom))
                ->when($dateTo ?? null, fn($q) => $q->whereDate('date', '<=', $dateTo))
                ->sum('service_price'),
            'total_materials_cost' => (float) SessionRecord::when($dateFrom ?? null, fn($q) => $q->whereDate('date', '>=', $dateFrom))
                ->when($dateTo ?? null, fn($q) => $q->whereDate('date', '<=', $dateTo))
                ->sum('total_materials_cost'),
            'net_profit'     => (float) SessionRecord::when($dateFrom ?? null, fn($q) => $q->whereDate('date', '>=', $dateFrom))
                ->when($dateTo ?? null, fn($q) => $q->whereDate('date', '<=', $dateTo))
                ->sum('net_profit'),
            'session_count'  => (int) SessionRecord::when($dateFrom ?? null, fn($q) => $q->whereDate('date', '>=', $dateFrom))
                ->when($dateTo ?? null, fn($q) => $q->whereDate('date', '<=', $dateTo))
                ->count(),
        ];

        return response()->json([
            'data'  => SessionRecordResource::collection($sessions),
            'meta'  => [
                'current_page' => $sessions->currentPage(),
                'last_page'    => $sessions->lastPage(),
                'per_page'     => $sessions->perPage(),
                'total'        => $sessions->total(),
            ],
            'totals' => $totals,
        ]);
    }

    /**
     * Export sessions report as CSV (admin/accountant).
     */
    public function exportSessions(Request $request): StreamedResponse
    {
        $query = SessionRecord::with(['patientFile.patient', 'patientFile.doctor']);

        if ($dateFrom = $request->query('date_from')) {
            $query->whereDate('date', '>=', $dateFrom);
        }
        if ($dateTo = $request->query('date_to')) {
            $query->whereDate('date', '<=', $dateTo);
        }

        $sessions = $query->orderBy('date')->get();

        $filename = 'sessions-report-' . now()->format('Y-m-d-His') . '.csv';

        return response()->streamDownload(function () use ($sessions) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Date', 'Patient', 'Doctor', 'Service', 'Service Price', 'Materials Cost', 'Net Profit', 'Performed By']);
            foreach ($sessions as $s) {
                fputcsv($out, [
                    $s->date->toDateString(),
                    $s->patientFile?->patient?->name ?? '',
                    $s->patientFile?->doctor?->name ?? '',
                    $s->service_name,
                    $s->service_price,
                    $s->total_materials_cost,
                    $s->net_profit,
                    $s->performed_by,
                ]);
            }
            fclose($out);
        }, $filename, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}
