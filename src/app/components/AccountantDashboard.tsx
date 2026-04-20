import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, Package, FileText, LogOut, Search, Edit2,
  Download, BarChart2, PieChart, Users, Scissors, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer, PieChart as RPieChart, Pie, Cell,
} from 'recharts';
import { useAuth } from '../App';
import { reportsService, type ReportSession, type FinancialReportResponse } from '../../lib/services/reportsService';
import { patientFileService } from '../../lib/services/patientFileService';
import { authService } from '../../lib/services/authService';
import { toast } from 'sonner';

const CHART_COLORS = ['#e91e8c', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

interface AccountantDashboardProps {
  embedded?: boolean;
}

type ReportView = 'overview' | 'sessions' | 'doctors' | 'services';

export default function AccountantDashboard({ embedded = false }: AccountantDashboardProps) {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState<ReportView>('overview');

  // Sessions list state
  const [sessions, setSessions] = useState<ReportSession[]>([]);
  const [totals, setTotals] = useState({ total_sales: 0, total_discounts: 0, total_materials_cost: 0, net_profit: 0, session_count: 0 });
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 50, total: 0 });
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Financial report state
  const [financial, setFinancial] = useState<FinancialReportResponse | null>(null);
  const [loadingFinancial, setLoadingFinancial] = useState(true);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Edit session
  const [editingSession, setEditingSession] = useState<ReportSession | null>(null);
  const [editForm, setEditForm] = useState({ servicePrice: '', totalMaterialsCost: '', netProfit: '' });

  const fetchSessions = () => {
    setLoadingSessions(true);
    reportsService
      .getSessions({ date_from: dateFrom || undefined, date_to: dateTo || undefined, search: search || undefined, page, per_page: 50 })
      .then((res) => {
        setSessions(res.data);
        setTotals(res.totals);
        setMeta(res.meta);
      })
      .catch(() => toast.error('Failed to load sessions'))
      .finally(() => setLoadingSessions(false));
  };

  const fetchFinancial = () => {
    setLoadingFinancial(true);
    reportsService
      .getFinancial({ date_from: dateFrom || undefined, date_to: dateTo || undefined })
      .then(setFinancial)
      .catch(() => toast.error('Failed to load financial data'))
      .finally(() => setLoadingFinancial(false));
  };

  useEffect(() => {
    fetchSessions();
    fetchFinancial();
  }, [page, dateFrom, dateTo]);

  const handleSearch = () => {
    setPage(1);
    fetchSessions();
    fetchFinancial();
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
    if (!Number.isNaN(sp) && !Number.isNaN(mc))
      setEditForm(f => ({ ...f, netProfit: String(sp - mc) }));
  };

  const saveEdit = async () => {
    if (!editingSession?.patientFileId) {
      toast.error('Cannot update: missing patient file');
      return;
    }
    const servicePrice = parseFloat(editForm.servicePrice);
    const totalMaterialsCost = parseFloat(editForm.totalMaterialsCost);
    const netProfit =
      !Number.isNaN(servicePrice) && !Number.isNaN(totalMaterialsCost)
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
      fetchFinancial();
    } catch {
      toast.error('Failed to update session');
    }
  };

  if (!user && !embedded) return null;

  const nav: { label: string; view: ReportView; icon: React.ReactNode }[] = [
    { label: 'Overview', view: 'overview', icon: <BarChart2 className="w-4 h-4" /> },
    { label: 'Sessions', view: 'sessions', icon: <FileText className="w-4 h-4" /> },
    { label: 'By Doctor', view: 'doctors', icon: <Users className="w-4 h-4" /> },
    { label: 'By Service', view: 'services', icon: <Scissors className="w-4 h-4" /> },
  ];

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

      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <h1 className="text-2xl text-gray-900 mb-2">{embedded ? 'Financial Reports' : 'Financial Reports & Analytics'}</h1>

        {/* Date filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From date</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To date</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Search (patient, service, performer)</label>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search..." className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full" />
          </div>
          <button onClick={handleSearch}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2">
            <Search className="w-4 h-4" /> Apply
          </button>
          <button
            onClick={() => reportsService.exportSessionsCsv({ date_from: dateFrom || undefined, date_to: dateTo || undefined }).catch(() => toast.error('Export failed'))}
            className="px-4 py-2 border border-emerald-600 text-emerald-700 rounded-lg hover:bg-emerald-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Sessions CSV
          </button>
          <button
            onClick={() => reportsService.exportFinancialCsv({ date_from: dateFrom || undefined, date_to: dateTo || undefined }).catch(() => toast.error('Export failed'))}
            className="px-4 py-2 border border-purple-600 text-purple-700 rounded-lg hover:bg-purple-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Full Report CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-medium">Total Revenue</span>
            </div>
            <p className="text-xl font-semibold text-gray-900">
              {(financial?.summary.total_revenue ?? totals.total_sales).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-amber-100">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Discounts</span>
            </div>
            <p className="text-xl font-semibold text-amber-700">
              -{(financial?.summary.total_discounts ?? totals.total_discounts ?? 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Package className="w-4 h-4" />
              <span className="text-xs font-medium">Materials Cost</span>
            </div>
            <p className="text-xl font-semibold text-red-600">
              -{(financial?.summary.total_materials_cost ?? totals.total_materials_cost).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-700 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Net Profit</span>
            </div>
            <p className="text-xl font-semibold text-emerald-700">
              {(financial?.summary.net_profit ?? totals.net_profit).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-medium">Sessions</span>
            </div>
            <p className="text-xl font-semibold text-gray-900">
              {financial?.summary.session_count ?? totals.session_count}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-medium">Avg Session</span>
            </div>
            <p className="text-xl font-semibold text-blue-700">
              {(financial?.summary.avg_session_value ?? 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* View Navigation */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {nav.map(n => (
            <button key={n.view} onClick={() => setActiveView(n.view)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                activeView === n.view
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-400'
              }`}>
              {n.icon} {n.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW: Monthly Trend Charts */}
        {activeView === 'overview' && (
          <div className="space-y-6">
            {loadingFinancial ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500">Loading charts...</div>
            ) : financial && financial.monthly_trend.length > 0 ? (
              <>
                {/* Revenue & Profit Line Chart */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Monthly Revenue vs Profit Trend</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={financial.monthly_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => v.toFixed(2)} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#e91e8c" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="net_profit" name="Net Profit" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="materials" name="Materials" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Sessions Bar Chart */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Monthly Sessions Count</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={financial.monthly_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="sessions" name="Sessions" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary Table */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Monthly Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-2 px-4 text-gray-600">Month</th>
                          <th className="text-right py-2 px-4 text-gray-600">Sessions</th>
                          <th className="text-right py-2 px-4 text-gray-600">Revenue</th>
                          <th className="text-right py-2 px-4 text-gray-600">Discounts</th>
                          <th className="text-right py-2 px-4 text-gray-600">Materials</th>
                          <th className="text-right py-2 px-4 text-gray-600">Net Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financial.monthly_trend.map(m => (
                          <tr key={m.month} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-4 font-medium">{m.month}</td>
                            <td className="py-2 px-4 text-right">{m.sessions}</td>
                            <td className="py-2 px-4 text-right">{m.revenue.toFixed(2)}</td>
                            <td className="py-2 px-4 text-right text-amber-600">-{m.discounts.toFixed(2)}</td>
                            <td className="py-2 px-4 text-right text-red-600">-{m.materials.toFixed(2)}</td>
                            <td className={`py-2 px-4 text-right font-semibold ${m.net_profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                              {m.net_profit.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                No data available for the selected period.
              </div>
            )}
          </div>
        )}

        {/* SESSIONS VIEW */}
        {activeView === 'sessions' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {loadingSessions ? (
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
                        <th className="text-right py-3 px-4 font-medium text-gray-700">List Price</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Discount</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Charged</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Materials</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Net Profit</th>
                        <th className="py-3 px-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map(s => (
                        <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="py-3 px-4">{s.date}</td>
                          <td className="py-3 px-4">{s.patientName ?? '—'}</td>
                          <td className="py-3 px-4">{s.doctorName ?? '—'}</td>
                          <td className="py-3 px-4">{s.serviceName}</td>
                          <td className="py-3 px-4 text-right">{(s.originalServicePrice ?? s.servicePrice).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right text-amber-600">
                            {(s.discountAmount ?? 0) > 0 ? `-${(s.discountAmount ?? 0).toFixed(2)}` : '—'}
                          </td>
                          <td className="py-3 px-4 text-right">{Number(s.servicePrice).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right text-red-600">{Number(s.totalMaterialsCost).toFixed(2)}</td>
                          <td className={`py-3 px-4 text-right font-medium ${s.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {Number(s.netProfit).toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <button type="button" onClick={() => openEdit(s)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Edit amounts">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td colSpan={4} className="py-3 px-4 font-semibold text-gray-700">Totals</td>
                        <td className="py-3 px-4 text-right font-semibold">{totals.total_sales.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-semibold text-amber-600">
                          -{(totals.total_discounts ?? 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {(totals.total_sales - (totals.total_discounts ?? 0)).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-red-600">
                          {totals.total_materials_cost.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                          {totals.net_profit.toFixed(2)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {meta.last_page > 1 && (
                  <div className="flex justify-between items-center px-4 py-3 border-t">
                    <span className="text-sm text-gray-600">Page {meta.current_page} of {meta.last_page} ({meta.total} sessions)</span>
                    <div className="flex gap-2">
                      <button disabled={meta.current_page <= 1} onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50">Previous</button>
                      <button disabled={meta.current_page >= meta.last_page} onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50">Next</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* BY DOCTOR VIEW */}
        {activeView === 'doctors' && (
          <div className="space-y-6">
            {loadingFinancial ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500">Loading...</div>
            ) : financial && financial.by_doctor.length > 0 ? (
              <>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Revenue by Doctor</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={financial.by_doctor} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="doctor" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip formatter={(v: number) => v.toFixed(2)} />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill="#e91e8c" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="net_profit" name="Net Profit" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Doctor</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Sessions</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Revenue</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Discounts</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Materials</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Net Profit</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Profit %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financial.by_doctor.map((d, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{d.doctor}</td>
                          <td className="py-3 px-4 text-right">{d.sessions}</td>
                          <td className="py-3 px-4 text-right">{d.revenue.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right text-amber-600">-{d.discounts.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right text-red-600">-{d.materials.toFixed(2)}</td>
                          <td className={`py-3 px-4 text-right font-semibold ${d.net_profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {d.net_profit.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {d.revenue > 0 ? ((d.net_profit / d.revenue) * 100).toFixed(1) + '%' : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500">No doctor data available.</div>
            )}
          </div>
        )}

        {/* BY SERVICE VIEW */}
        {activeView === 'services' && (
          <div className="space-y-6">
            {loadingFinancial ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500">Loading...</div>
            ) : financial && financial.by_service.length > 0 ? (
              <>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Revenue by Service (Top 10)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={financial.by_service.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="service" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => v.toFixed(2)} />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="net_profit" name="Net Profit" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Service</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Sessions</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Revenue</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Discounts</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Materials</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Net Profit</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Profit %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financial.by_service.map((s, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{s.service}</td>
                          <td className="py-3 px-4 text-right">{s.sessions}</td>
                          <td className="py-3 px-4 text-right">{s.revenue.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right text-amber-600">-{s.discounts.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right text-red-600">-{s.materials.toFixed(2)}</td>
                          <td className={`py-3 px-4 text-right font-semibold ${s.net_profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {s.net_profit.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {s.revenue > 0 ? ((s.net_profit / s.revenue) * 100).toFixed(1) + '%' : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500">No service data available.</div>
            )}
          </div>
        )}
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
                <input type="number" step="0.01" value={editForm.servicePrice}
                  onChange={e => { setEditForm(f => ({ ...f, servicePrice: e.target.value })); setTimeout(recalcNetProfit, 0); }}
                  onBlur={recalcNetProfit} className="border border-gray-300 rounded-lg px-3 py-2 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total materials cost</label>
                <input type="number" step="0.01" value={editForm.totalMaterialsCost}
                  onChange={e => { setEditForm(f => ({ ...f, totalMaterialsCost: e.target.value })); setTimeout(recalcNetProfit, 0); }}
                  onBlur={recalcNetProfit} className="border border-gray-300 rounded-lg px-3 py-2 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Net profit (auto: price − materials)</label>
                <input type="number" step="0.01" value={editForm.netProfit}
                  onChange={e => setEditForm(f => ({ ...f, netProfit: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={saveEdit} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Save</button>
              <button onClick={() => setEditingSession(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
