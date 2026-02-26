import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Package, FileText, LogOut, Search, Edit2, Download } from 'lucide-react';
import { useAuth } from '../App';
import { reportsService, type ReportSession } from '../../lib/services/reportsService';
import { patientFileService } from '../../lib/services/patientFileService';
import { authService } from '../../lib/services/authService';
import { toast } from 'sonner';

interface AccountantDashboardProps {
  /** When true, render only the report content (no sidebar) for embedding in admin. */
  embedded?: boolean;
}

export default function AccountantDashboard({ embedded = false }: AccountantDashboardProps) {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<ReportSession[]>([]);
  const [totals, setTotals] = useState({ total_sales: 0, total_materials_cost: 0, net_profit: 0, session_count: 0 });
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 50, total: 0 });
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingSession, setEditingSession] = useState<ReportSession | null>(null);
  const [editForm, setEditForm] = useState({ servicePrice: '', totalMaterialsCost: '', netProfit: '' });

  const fetchSessions = () => {
    setLoading(true);
    reportsService
      .getSessions({ date_from: dateFrom || undefined, date_to: dateTo || undefined, search: search || undefined, page, per_page: 50 })
      .then((res) => {
        setSessions(res.data);
        setTotals(res.totals);
        setMeta(res.meta);
      })
      .catch(() => toast.error('Failed to load sessions'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
  }, [page, dateFrom, dateTo]);

  const handleSearch = () => {
    setPage(1);
    fetchSessions();
  };

  const openEdit = (s: ReportSession) => {
    setEditingSession(s);
    setEditForm({
      servicePrice: String(s.servicePrice),
      totalMaterialsCost: String(s.totalMaterialsCost),
      netProfit: String(s.netProfit),
    });
  };

  const recalcNetProfit = () => {
    const sp = parseFloat(editForm.servicePrice);
    const mc = parseFloat(editForm.totalMaterialsCost);
    if (!Number.isNaN(sp) && !Number.isNaN(mc)) setEditForm((f) => ({ ...f, netProfit: String(sp - mc) }));
  };

  const saveEdit = async () => {
    if (!editingSession?.patientFileId) {
      toast.error('Cannot update: missing patient file');
      return;
    }
    const servicePrice = parseFloat(editForm.servicePrice);
    const totalMaterialsCost = parseFloat(editForm.totalMaterialsCost);
    const netProfit = !Number.isNaN(servicePrice) && !Number.isNaN(totalMaterialsCost)
      ? servicePrice - totalMaterialsCost
      : parseFloat(editForm.netProfit);
    try {
      await patientFileService.updateSession(editingSession.patientFileId, editingSession.id, {
        servicePrice: Number.isNaN(servicePrice) ? undefined : servicePrice,
        totalMaterialsCost: Number.isNaN(totalMaterialsCost) ? undefined : totalMaterialsCost,
        netProfit: Number.isNaN(netProfit) ? undefined : netProfit,
      });
      toast.success('Session updated');
      setEditingSession(null);
      fetchSessions();
    } catch {
      toast.error('Failed to update session');
    }
  };

  if (!user && !embedded) return null;

  return (
    <div className={embedded ? '' : 'min-h-screen flex flex-col md:flex-row bg-gray-50'}>
      {!embedded && (
        <aside className="bg-white border-b md:border-r border-gray-200 w-full md:w-64 flex-shrink-0 p-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <span className="text-lg text-gray-900">BeautyClinic</span>
          </div>
          <p className="text-sm text-gray-600">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
          <span className="inline-block mt-2 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">Accountant</span>
          <button
            onClick={() => authService.logout().then(() => logout())}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 mt-8"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </aside>
      )}

      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-2xl text-gray-900 mb-6">{embedded ? 'Sales & Export' : 'Sales & Financial Report'}</h1>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm font-medium">Total Sales</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{totals.total_sales.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Package className="w-5 h-5" />
              <span className="text-sm font-medium">Materials Cost</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{totals.total_materials_cost.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-700 mb-1">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Net Profit</span>
            </div>
            <p className="text-2xl font-semibold text-emerald-700">{totals.net_profit.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <FileText className="w-5 h-5" />
              <span className="text-sm font-medium">Sessions</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{totals.session_count}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Search (patient, service, performer)</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Apply
          </button>
          <button
            onClick={() => reportsService.exportSessionsCsv({ date_from: dateFrom || undefined, date_to: dateTo || undefined }).catch(() => toast.error('Export failed'))}
            className="px-4 py-2 border border-emerald-600 text-emerald-700 rounded-lg hover:bg-emerald-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Sessions table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No sessions in this period.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Patient</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Doctor</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Service</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Service Price</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Materials</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Net Profit</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="py-3 px-4">{s.date}</td>
                        <td className="py-3 px-4">{s.patientName ?? '—'}</td>
                        <td className="py-3 px-4">{s.doctorName ?? '—'}</td>
                        <td className="py-3 px-4">{s.serviceName}</td>
                        <td className="py-3 px-4 text-right">{Number(s.servicePrice).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">{Number(s.totalMaterialsCost).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-700">{Number(s.netProfit).toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => openEdit(s)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title="Edit amounts"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {meta.last_page > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t">
                  <span className="text-sm text-gray-600">Page {meta.current_page} of {meta.last_page}</span>
                  <div className="flex gap-2">
                    <button
                      disabled={meta.current_page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      disabled={meta.current_page >= meta.last_page}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Edit session modal */}
      {editingSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">Edit session amounts</h2>
            <p className="text-sm text-gray-600 mb-4">{editingSession.serviceName} — {editingSession.date}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service price</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.servicePrice}
                  onChange={(e) => { setEditForm((f) => ({ ...f, servicePrice: e.target.value })); setTimeout(recalcNetProfit, 0); }}
                  onBlur={recalcNetProfit}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total materials cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.totalMaterialsCost}
                  onChange={(e) => { setEditForm((f) => ({ ...f, totalMaterialsCost: e.target.value })); setTimeout(recalcNetProfit, 0); }}
                  onBlur={recalcNetProfit}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Net profit (auto: price − materials)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.netProfit}
                  onChange={(e) => setEditForm((f) => ({ ...f, netProfit: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={saveEdit}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditingSession(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
