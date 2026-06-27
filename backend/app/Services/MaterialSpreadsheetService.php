<?php

namespace App\Services;

use App\Models\MaterialOrTool;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MaterialSpreadsheetService
{
    private const HEADERS = ['name', 'type', 'unit_price', 'unit', 'stock_quantity', 'supplier', 'notes'];

    public function export(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet       = $spreadsheet->getActiveSheet();
        $sheet->fromArray(self::HEADERS, null, 'A1');

        $row = 2;
        foreach (MaterialOrTool::orderBy('name')->get() as $item) {
            $sheet->fromArray([
                $item->name,
                $item->type,
                $item->unit_price,
                $item->unit,
                $item->type === 'material' ? $item->stock_quantity : '',
                $item->supplier ?? '',
                $item->notes ?? '',
            ], null, "A{$row}");
            $row++;
        }

        return response()->streamDownload(function () use ($spreadsheet) {
            (new Xlsx($spreadsheet))->save('php://output');
        }, 'materials-tools-'.now()->format('Y-m-d').'.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * @return array{created: int, updated: int, skipped: int, errors: string[]}
     */
    public function import(UploadedFile $file): array
    {
        $spreadsheet = IOFactory::load($file->getRealPath());
        $rows        = $spreadsheet->getActiveSheet()->toArray(null, true, true, true);

        if (empty($rows)) {
            return ['created' => 0, 'updated' => 0, 'skipped' => 0, 'errors' => ['Spreadsheet is empty.']];
        }

        $headerRow = array_shift($rows);
        $columns   = $this->mapColumns($headerRow);

        $created = 0;
        $updated = 0;
        $skipped = 0;
        $errors  = [];

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            $name = trim((string) ($row[$columns['name']] ?? ''));
            if ($name === '') {
                $skipped++;

                continue;
            }

            $type = strtolower(trim((string) ($row[$columns['type']] ?? 'material')));
            if (! in_array($type, ['material', 'tool'], true)) {
                $errors[] = "Row {$line}: invalid type \"{$type}\".";
                $skipped++;

                continue;
            }

            $data = [
                'name'           => $name,
                'type'           => $type,
                'unit_price'     => (float) ($row[$columns['unit_price']] ?? 0),
                'unit'           => trim((string) ($row[$columns['unit']] ?? 'ml')) ?: 'ml',
                'stock_quantity' => $type === 'material' ? (int) ($row[$columns['stock_quantity']] ?? 0) : 0,
                'supplier'       => trim((string) ($row[$columns['supplier']] ?? '')) ?: null,
                'notes'          => trim((string) ($row[$columns['notes']] ?? '')) ?: null,
            ];

            $existing = MaterialOrTool::where('name', $name)->where('type', $type)->first();
            if ($existing) {
                $existing->update($data);
                $updated++;
            } else {
                MaterialOrTool::create($data);
                $created++;
            }
        }

        return compact('created', 'updated', 'skipped', 'errors');
    }

    /**
     * @param  array<string, mixed>  $headerRow
     * @return array<string, string>
     */
    private function mapColumns(array $headerRow): array
    {
        $map = [];
        foreach ($headerRow as $col => $label) {
            $key = strtolower(trim(str_replace(' ', '_', (string) $label)));
            if (in_array($key, self::HEADERS, true)) {
                $map[$key] = $col;
            }
        }

        foreach (self::HEADERS as $header) {
            $map[$header] ??= chr(ord('A') + array_search($header, self::HEADERS, true));
        }

        return $map;
    }
}
