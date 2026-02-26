import React, { useState, useEffect } from 'react';
import { History, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { activityLogService, type ActivityLogEntry } from '../../lib/services/activityLogService';
import { toast } from 'sonner';

const SUBJECT_TYPES = ['patient', 'appointment', 'doctor', 'service', 'materials_tools', 'user', 'session_record', 'patient_file', 'practitioner_type'];
const ACTIONS = ['created', 'updated', 'deleted'];

export default function BacklogView() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 50, total: 0 });
  const [loading, setLoading] = useState(true);
  const [subjectType, setSubjectType] = useState('');
  const [action, setAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchLogs = () => {
    setLoading(true);
    activityLogService
      .getList({
        subject_type: subjectType || undefined,
        action: action || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
        per_page: 50,
      })
      .then((res) => {
        setLogs(res.data);
        setMeta(res.meta);
      })
      .catch(() => toast.error('Failed to load activity log'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [page, subjectType, action, dateFrom, dateTo]);

  const formatDate = (s: string) => {
    try {
      const d = new Date(s);
      return d.toLocaleString();
    } catch {
      return s;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl text-gray-900 flex items-center gap-2">
          <History className="w-7 h-7 text-pink-600" />
          Activity Log (Backlog)
        </h1>
        <p className="text-gray-600 mt-1">View all system actions for audit and compliance.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Subject</label>
          <select
            value={subjectType}
            onChange={(e) => { setSubjectType(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[140px]"
          >
            <option value="">All</option>
            {SUBJECT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Action</label>
          <select
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[120px]"
          >
            <option value="">All</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">From date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To date</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 text-sm"
        >
          Apply
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No activity log entries.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Time</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Subject</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <React.Fragment key={log.id}>
                      <tr
                        className="border-b border-gray-100 hover:bg-gray-50/50"
                      >
                        <td className="py-3 px-4 text-gray-600">{formatDate(log.createdAt)}</td>
                        <td className="py-3 px-4">
                          <span className="font-medium">{log.userName ?? '—'}</span>
                          {log.userEmail && <span className="text-gray-500 block text-xs">{log.userEmail}</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            log.action === 'created' ? 'bg-green-100 text-green-800' :
                            log.action === 'updated' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4">{log.subjectType} {log.subjectId ? `(${log.subjectId})` : ''}</td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                            className="text-pink-600 hover:underline text-xs"
                          >
                            {expandedId === log.id ? 'Hide' : 'Show'} details
                          </button>
                        </td>
                      </tr>
                      {expandedId === log.id && (
                        <tr className="bg-gray-50">
                          <td colSpan={5} className="py-3 px-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {log.oldValues && Object.keys(log.oldValues).length > 0 && (
                                <div>
                                  <div className="font-medium text-gray-700 mb-1">Old values</div>
                                  <pre className="bg-white p-2 rounded border overflow-auto max-h-40">{JSON.stringify(log.oldValues, null, 2)}</pre>
                                </div>
                              )}
                              {log.newValues && Object.keys(log.newValues).length > 0 && (
                                <div>
                                  <div className="font-medium text-gray-700 mb-1">New values</div>
                                  <pre className="bg-white p-2 rounded border overflow-auto max-h-40">{JSON.stringify(log.newValues, null, 2)}</pre>
                                </div>
                              )}
                              {(!log.oldValues || Object.keys(log.oldValues).length === 0) && (!log.newValues || Object.keys(log.newValues).length === 0) && (
                                <span className="text-gray-500">No diff data</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {meta.last_page > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <span className="text-sm text-gray-600">
                  Page {meta.current_page} of {meta.last_page} ({meta.total} total)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={meta.current_page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={meta.current_page >= meta.last_page}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
