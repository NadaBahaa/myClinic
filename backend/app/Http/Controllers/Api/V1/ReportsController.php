<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\SessionRecordResource;
use App\Models\SessionRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportsController extends Controller
{
    private function baseQuery(Request $request)
    {
        $query = SessionRecord::query();
        if ($dateFrom = $request->query('date_from')) {
            $query->whereDate('date', '>=', $dateFrom);
        }
        if ($dateTo = $request->query('date_to')) {
            $query->whereDate('date', '<=', $dateTo);
        }
        return $query;
    }

    /**
     * GET /api/v1/reports/sessions
     * List sessions with optional date range and search (admin/accountant).
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

        $totalsBase = $this->baseQuery($request);
        $totals = [
            'total_sales'          => (float) (clone $totalsBase)->sum('service_price'),
            'total_discounts'      => (float) (clone $totalsBase)->sum('discount_amount'),
            'total_materials_cost' => (float) (clone $totalsBase)->sum('total_materials_cost'),
            'net_profit'           => (float) (clone $totalsBase)->sum('net_profit'),
            'session_count'        => (int)   (clone $totalsBase)->count(),
        ];

        return response()->json([
            'data'   => SessionRecordResource::collection($sessions),
            'meta'   => [
                'current_page' => $sessions->currentPage(),
                'last_page'    => $sessions->lastPage(),
                'per_page'     => $sessions->perPage(),
                'total'        => $sessions->total(),
            ],
            'totals' => $totals,
        ]);
    }

    /**
     * GET /api/v1/reports/financial
     * Full financial cycle: summary + by doctor + by service + monthly trend.
     */
    public function financial(Request $request): JsonResponse
    {
        $dateFrom = $request->query('date_from');
        $dateTo   = $request->query('date_to');

        $base = $this->baseQuery($request);

        // Overall summary
        $summary = [
            'total_revenue'        => (float) (clone $base)->sum('service_price'),
            'total_discounts'      => (float) (clone $base)->sum('discount_amount'),
            'net_revenue'          => (float) (clone $base)->selectRaw('SUM(service_price) as net')->value('net') ?? 0,
            'total_materials_cost' => (float) (clone $base)->sum('total_materials_cost'),
            'net_profit'           => (float) (clone $base)->sum('net_profit'),
            'session_count'        => (int)   (clone $base)->count(),
            'avg_session_value'    => 0,
        ];
        if ($summary['session_count'] > 0) {
            $summary['avg_session_value'] = round($summary['total_revenue'] / $summary['session_count'], 2);
        }

        // By doctor
        $byDoctor = SessionRecord::with('patientFile.doctor')
            ->when($dateFrom, fn($q) => $q->whereDate('date', '>=', $dateFrom))
            ->when($dateTo,   fn($q) => $q->whereDate('date', '<=', $dateTo))
            ->get()
            ->groupBy(fn($s) => $s->patientFile?->doctor?->name ?? 'Unknown')
            ->map(fn($group, $doctorName) => [
                'doctor'        => $doctorName,
                'sessions'      => $group->count(),
                'revenue'       => round($group->sum('service_price'), 2),
                'discounts'     => round($group->sum('discount_amount'), 2),
                'materials'     => round($group->sum('total_materials_cost'), 2),
                'net_profit'    => round($group->sum('net_profit'), 2),
            ])
            ->values();

        // By service
        $byService = SessionRecord::select('service_name')
            ->selectRaw('COUNT(*) as sessions')
            ->selectRaw('SUM(service_price) as revenue')
            ->selectRaw('SUM(discount_amount) as discounts')
            ->selectRaw('SUM(total_materials_cost) as materials_cost')
            ->selectRaw('SUM(net_profit) as net_profit')
            ->when($dateFrom, fn($q) => $q->whereDate('date', '>=', $dateFrom))
            ->when($dateTo,   fn($q) => $q->whereDate('date', '<=', $dateTo))
            ->groupBy('service_name')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn($row) => [
                'service'      => $row->service_name,
                'sessions'     => (int) $row->sessions,
                'revenue'      => (float) $row->revenue,
                'discounts'    => (float) $row->discounts,
                'materials'    => (float) $row->materials_cost,
                'net_profit'   => (float) $row->net_profit,
            ]);

        // Monthly trend (last 12 months or filtered range)
        $monthlyTrend = SessionRecord::select(
                DB::raw("DATE_FORMAT(date, '%Y-%m') as month"),
                DB::raw('COUNT(*) as sessions'),
                DB::raw('SUM(service_price) as revenue'),
                DB::raw('SUM(discount_amount) as discounts'),
                DB::raw('SUM(total_materials_cost) as materials_cost'),
                DB::raw('SUM(net_profit) as net_profit')
            )
            ->when($dateFrom, fn($q) => $q->whereDate('date', '>=', $dateFrom))
            ->when($dateTo,   fn($q) => $q->whereDate('date', '<=', $dateTo))
            ->when(!$dateFrom && !$dateTo, fn($q) => $q->where('date', '>=', now()->subMonths(11)->startOfMonth()))
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn($row) => [
                'month'        => $row->month,
                'sessions'     => (int) $row->sessions,
                'revenue'      => (float) $row->revenue,
                'discounts'    => (float) $row->discounts,
                'materials'    => (float) $row->materials_cost,
                'net_profit'   => (float) $row->net_profit,
            ]);

        // Top 5 services by revenue
        $topServices = $byService->take(5);

        // Top 5 doctors by revenue
        $topDoctors = $byDoctor->sortByDesc('revenue')->take(5)->values();

        return response()->json([
            'summary'      => $summary,
            'by_doctor'    => $byDoctor,
            'by_service'   => $byService,
            'monthly_trend'=> $monthlyTrend,
            'top_services' => $topServices,
            'top_doctors'  => $topDoctors,
        ]);
    }

    /**
     * GET /api/v1/reports/sessions/export
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
            fputcsv($out, ['Date', 'Patient', 'Doctor', 'Service', 'List Price', 'Discount', 'Service Price (After Discount)', 'Materials Cost', 'Net Profit', 'Performed By']);
            foreach ($sessions as $s) {
                fputcsv($out, [
                    $s->date->toDateString(),
                    $s->patientFile?->patient?->name ?? '',
                    $s->patientFile?->doctor?->name ?? '',
                    $s->service_name,
                    $s->original_service_price ?? $s->service_price,
                    $s->discount_amount ?? 0,
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

    /**
     * GET /api/v1/reports/financial/export
     * Export full financial summary as CSV.
     */
    public function exportFinancial(Request $request): StreamedResponse
    {
        $dateFrom = $request->query('date_from');
        $dateTo   = $request->query('date_to');

        $sessions = SessionRecord::with(['patientFile.patient', 'patientFile.doctor'])
            ->when($dateFrom, fn($q) => $q->whereDate('date', '>=', $dateFrom))
            ->when($dateTo,   fn($q) => $q->whereDate('date', '<=', $dateTo))
            ->orderBy('date')
            ->get();

        $filename = 'financial-report-' . now()->format('Y-m-d-His') . '.csv';

        return response()->streamDownload(function () use ($sessions) {
            $out = fopen('php://output', 'w');

            // Summary section
            fputcsv($out, ['=== FINANCIAL SUMMARY ===']);
            fputcsv($out, ['Metric', 'Value']);
            fputcsv($out, ['Total Revenue', $sessions->sum('service_price')]);
            fputcsv($out, ['Total Discounts', $sessions->sum('discount_amount')]);
            fputcsv($out, ['Total Materials Cost', $sessions->sum('total_materials_cost')]);
            fputcsv($out, ['Net Profit', $sessions->sum('net_profit')]);
            fputcsv($out, ['Total Sessions', $sessions->count()]);
            fputcsv($out, []);

            // By Doctor
            fputcsv($out, ['=== BY DOCTOR ===']);
            fputcsv($out, ['Doctor', 'Sessions', 'Revenue', 'Discounts', 'Materials', 'Net Profit']);
            $byDoctor = $sessions->groupBy(fn($s) => $s->patientFile?->doctor?->name ?? 'Unknown');
            foreach ($byDoctor as $doctor => $group) {
                fputcsv($out, [
                    $doctor,
                    $group->count(),
                    $group->sum('service_price'),
                    $group->sum('discount_amount'),
                    $group->sum('total_materials_cost'),
                    $group->sum('net_profit'),
                ]);
            }
            fputcsv($out, []);

            // By Service
            fputcsv($out, ['=== BY SERVICE ===']);
            fputcsv($out, ['Service', 'Sessions', 'Revenue', 'Discounts', 'Materials', 'Net Profit']);
            $byService = $sessions->groupBy('service_name');
            foreach ($byService as $service => $group) {
                fputcsv($out, [
                    $service,
                    $group->count(),
                    $group->sum('service_price'),
                    $group->sum('discount_amount'),
                    $group->sum('total_materials_cost'),
                    $group->sum('net_profit'),
                ]);
            }
            fputcsv($out, []);

            // Detail rows
            fputcsv($out, ['=== SESSION DETAILS ===']);
            fputcsv($out, ['Date', 'Patient', 'Doctor', 'Service', 'List Price', 'Discount', 'Final Price', 'Materials', 'Net Profit', 'Performed By']);
            foreach ($sessions as $s) {
                fputcsv($out, [
                    $s->date->toDateString(),
                    $s->patientFile?->patient?->name ?? '',
                    $s->patientFile?->doctor?->name ?? '',
                    $s->service_name,
                    $s->original_service_price ?? $s->service_price,
                    $s->discount_amount ?? 0,
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
