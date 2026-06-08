// owner_panel/frontend/src/pages/Backup.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  Database, Download, Trash2, RefreshCw, Calendar,
  CheckCircle, XCircle, Clock, AlertTriangle, Play,
  ChevronDown, ChevronUp, X,
} from 'lucide-react';
import {
  getBackupStats,
  getRegisteredSchools,
  getBackupRecords,
  deleteBackupRecord,
  getDownloadUrl,
  initiateBackup,
  getBackupSchedules,
  createBackupSchedule,
  updateBackupSchedule,
  deleteBackupSchedule,
} from '../services/backupService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const fmtMB = (mb) => mb != null ? `${mb} MB` : '—';
const fmtDur = (s) => !s ? '—' : s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-700',
  running:   'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  emailed:   'bg-emerald-100 text-emerald-700',
  failed:    'bg-red-100 text-red-700',
};

const Badge = ({ status }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
    {status}
  </span>
);

const Spinner = () => (
  <div className="flex justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D94801]" />
  </div>
);

const StatCard = ({ title, value, sub, color }) => (
  <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
    <p className={`text-2xl font-bold ${color || 'text-gray-800'}`}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </p>
    <p className="text-sm text-gray-500 mt-1">{title}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

// ─── Record detail modal ───────────────────────────────────────────────────────
const RecordModal = ({ record: r, onClose, onDelete }) => {
  const tables = Object.entries(r.tables_backed_up || {});
  const [showTables, setShowTables] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-800">{r.school_name}</h3>
            <p className="text-xs text-gray-400">Backup #{r.id} · {r.trigger}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge status={r.status} />
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
          </div>
        </div>

        <div className="p-5 space-y-2">
          {[
            ['School ID', r.school_id],
            ['Initiated by', r.initiated_by || '—'],
            ['Email sent to', r.recipient_email || '—'],
            ['Started', fmt(r.started_at)],
            ['Completed', fmt(r.completed_at)],
            ['Emailed at', fmt(r.emailed_at)],
            ['Duration', fmtDur(r.duration_seconds)],
            ['File size', fmtMB(r.file_size_mb)],
            ['ZIP file', r.zip_filename || '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
              <span className="text-gray-400">{k}</span>
              <span className="text-gray-700 text-right break-all ml-4 font-mono text-xs">{v}</span>
            </div>
          ))}

          {r.error_message && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mt-2">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{r.error_message}</span>
            </div>
          )}

          {tables.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setShowTables(!showTables)}
                className="flex items-center gap-1 text-xs text-gray-500 font-medium hover:text-gray-700"
              >
                {showTables ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {tables.length} tables backed up
              </button>
              {showTables && (
                <div className="mt-2 bg-gray-50 rounded-xl p-3 max-h-44 overflow-y-auto space-y-1">
                  {tables.map(([tbl, cnt]) => (
                    <div key={tbl} className="flex justify-between text-xs font-mono">
                      <span className="text-gray-500">{tbl}</span>
                      <span className={typeof cnt === 'number' ? 'text-green-600' : 'text-red-500'}>
                        {typeof cnt === 'number' ? `${cnt} rows` : cnt}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100">
          {(r.status === 'completed' || r.status === 'emailed') && r.zip_filename && (
            <button
              onClick={() => window.open(getDownloadUrl(r.id), '_blank')}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700 transition-colors"
            >
              <Download size={14} /> Download ZIP
            </button>
          )}
          <button
            onClick={() => { onDelete(r.id); onClose(); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 text-sm rounded-xl hover:bg-red-100 transition-colors"
          >
            <Trash2 size={14} /> Delete
          </button>
          <button onClick={onClose} className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── TABS ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'initiate', label: 'New Backup' },
  { key: 'records', label: 'Records' },
  { key: 'schedules', label: 'Schedules' },
];

const DATA_SECTIONS = [
  ['👤', 'Users & Auth', 'Users, login history, activity log'],
  ['🎓', 'Students & Parents', 'Profiles, docs, guardian links'],
  ['👩‍🏫', 'Staff', 'Profiles, permissions, teacher records'],
  ['📚', 'Academic', 'Sessions, terms, classes, subjects'],
  ['📊', 'Results', 'Scores, psychomotor, affective'],
  ['💳', 'Payments', 'Invoices, payments, fee structures'],
  ['📅', 'Attendance', 'Daily records & class summaries'],
  ['🕐', 'Timetable', 'Full timetable and periods'],
  ['📖', 'Library', 'Book metadata, categories, loans'],
  ['🔐', 'Portal Fee', 'Records, invoices, payments'],
  ['📣', 'Complaints', 'Complaints and replies'],
  ['☁️', 'Cloudinary', 'File / media URL references'],
];

// ─── TAB: Overview ─────────────────────────────────────────────────────────────
const OverviewTab = ({ stats, records, loading }) => {
  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Backups" value={stats?.total_backups ?? 0} />
        <StatCard title="Completed" value={stats?.completed_backups ?? 0} color="text-green-600" />
        <StatCard title="Failed" value={stats?.failed_backups ?? 0} color="text-red-500" />
        <StatCard title="Total Data" value={`${stats?.total_size_mb ?? 0} MB`} color="text-[#D94801]" />
      </div>

      {stats?.by_school?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">Backups by School</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.by_school.map(s => (
              <div key={s.school_id} className="flex justify-between items-center px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">{s.school_name}</p>
                  <p className="text-xs text-gray-400">{s.school_id}</p>
                </div>
                <span className="text-sm font-bold text-[#D94801]">{s.count} backup{s.count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">Recent Backups</h3>
        </div>
        {records.length === 0 ? (
          <p className="text-center py-10 text-sm text-gray-400">No backups yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {records.slice(0, 6).map(r => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">{r.school_name}</p>
                  <p className="text-xs text-gray-400">{fmt(r.started_at)} · {r.trigger}</p>
                </div>
                <div className="text-right">
                  <Badge status={r.status} />
                  <p className="text-xs text-gray-400 mt-1">{fmtMB(r.file_size_mb)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── TAB: Initiate ─────────────────────────────────────────────────────────────
const InitiateTab = ({ schools, onSuccess }) => {
  const [schoolId, setSchoolId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!schoolId) return;
    setLoading(true);
    try {
      const result = await initiateBackup({ school_id: schoolId, recipient_email: email });
      toast.success(result.message || 'Backup started! You\'ll get an email when done.');
      onSuccess && onSuccess(result.record);
      setSchoolId('');
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to initiate backup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 mb-1">Start a New Backup</h3>
        <p className="text-xs text-gray-400 mb-5">Exports all data as CSV + JSON, bundles into a ZIP, and emails it.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School *</label>
              <select
                value={schoolId}
                onChange={e => setSchoolId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D94801] focus:border-transparent text-sm"
              >
                <option value="">— Select school —</option>
                {schools.map(s => (
                  <option key={s.school_id} value={s.school_id}>
                    {s.name} ({s.school_id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@school.com (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D94801] focus:border-transparent text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!schoolId || loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#D94801] text-white text-sm font-medium rounded-xl hover:bg-[#C24000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Starting…</> : <><Play size={14} /> Start Backup</>}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm">What Gets Backed Up</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {DATA_SECTIONS.map(([icon, title, desc]) => (
            <div key={title} className="bg-gray-50 rounded-xl p-3 space-y-1">
              <span className="text-xl">{icon}</span>
              <p className="text-xs font-semibold text-gray-700">{title}</p>
              <p className="text-[10px] text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── TAB: Records ──────────────────────────────────────────────────────────────
const RecordsTab = ({ records, loading, onRefresh, onDelete }) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = records.filter(r => {
    const q = !search || r.school_name?.toLowerCase().includes(search.toLowerCase()) || r.school_id.includes(search);
    const s = !status || r.status === status;
    return q && s;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by school name or ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D94801]"
        />
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D94801]"
        >
          <option value="">All statuses</option>
          {['pending', 'running', 'completed', 'emailed', 'failed'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <div className="text-center py-14">
            <Database size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No backup records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['#', 'School', 'Status', 'Trigger', 'Started', 'Duration', 'Size', 'Tables', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-400">#{r.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 whitespace-nowrap">{r.school_name}</p>
                      <p className="text-xs text-gray-400">{r.school_id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Badge status={r.status} />
                        {r.status === 'running' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 capitalize">{r.trigger}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmt(r.started_at)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{fmtDur(r.duration_seconds)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{fmtMB(r.file_size_mb)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.table_count ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelected(r)}
                          className="px-2 py-1 text-[11px] border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Details
                        </button>
                        {(r.status === 'completed' || r.status === 'emailed') && r.zip_filename && (
                          <button
                            onClick={() => window.open(getDownloadUrl(r.id), '_blank')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Download ZIP"
                          >
                            <Download size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(r.id)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <RecordModal record={selected} onClose={() => setSelected(null)} onDelete={onDelete} />}
    </div>
  );
};

// ─── TAB: Schedules ────────────────────────────────────────────────────────────
const SchedulesTab = ({ schools, schedules: initial, loading }) => {
  const [list, setList] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ school_id: '', recipient_email: '', day_of_month: 1, is_active: true });

  useEffect(() => { setList(initial); }, [initial]);

  const handleToggle = async (sc) => {
    try {
      const updated = await updateBackupSchedule(sc.id, { is_active: !sc.is_active });
      setList(prev => prev.map(s => s.id === sc.id ? { ...s, is_active: updated.is_active } : s));
      toast.success(`Schedule ${updated.is_active ? 'enabled' : 'paused'}`);
    } catch { toast.error('Failed to update schedule'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await createBackupSchedule(form);
      setList(prev => [...prev, created]);
      setShowForm(false);
      setForm({ school_id: '', recipient_email: '', day_of_month: 1, is_active: true });
      toast.success('Schedule created!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create schedule');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBackupSchedule(id);
      setList(prev => prev.filter(s => s.id !== id));
      toast.success('Schedule deleted');
    } catch { toast.error('Failed to delete schedule'); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">Monthly Backup Schedules</h3>
          <button
            onClick={() => setShowForm(f => !f)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
              showForm ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-[#D94801] text-white hover:bg-[#C24000]'
            }`}
          >
            {showForm ? <><X size={14} /> Cancel</> : <>+ New Schedule</>}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="p-5 bg-gray-50 border-b border-gray-100 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School *</label>
                <select
                  value={form.school_id}
                  onChange={e => setForm(f => ({ ...f, school_id: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D94801]"
                >
                  <option value="">— Select school —</option>
                  {schools.map(s => <option key={s.school_id} value={s.school_id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Email</label>
                <input
                  type="email"
                  value={form.recipient_email}
                  onChange={e => setForm(f => ({ ...f, recipient_email: e.target.value }))}
                  placeholder="admin@school.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D94801]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Day of Month (1–28)</label>
                <input
                  type="number" min={1} max={28}
                  value={form.day_of_month}
                  onChange={e => setForm(f => ({ ...f, day_of_month: parseInt(e.target.value) || 1 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D94801]"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="w-4 h-4 accent-[#D94801]"
                  />
                  <span className="text-sm text-gray-700">Enable immediately</span>
                </label>
              </div>
            </div>
            <button
              type="submit"
              disabled={!form.school_id || saving}
              className="flex items-center gap-2 px-5 py-2 bg-[#D94801] text-white text-sm font-medium rounded-xl hover:bg-[#C24000] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Schedule'}
            </button>
          </form>
        )}

        {loading ? <Spinner /> : list.length === 0 ? (
          <div className="text-center py-14">
            <Calendar size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No schedules yet. Add one above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['School', 'Day', 'Recipient', 'Status', 'Active', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {list.map(sc => (
                  <tr key={sc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{sc.school_name}</p>
                      <p className="text-xs text-gray-400">{sc.school_id}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">Day {sc.day_of_month} of every month</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{sc.recipient_email || '—'}</td>
                    <td className="px-4 py-3">
                      {sc.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">
                          <CheckCircle size={10} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">
                          <Clock size={10} /> Paused
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(sc)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${sc.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${sc.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(sc.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="font-semibold text-blue-800 text-sm mb-1">ℹ️ How Scheduled Backups Work</p>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li>Backups auto-run on the configured day each month</li>
          <li>Add to your server crontab: <code className="bg-blue-100 px-1 rounded font-mono">0 2 * * * python manage.py run_scheduled_backups</code></li>
          <li>Use the "New Backup" tab to run one immediately</li>
        </ul>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function Backup() {
  const [tab, setTab] = useState('overview');
  const [records, setRecords] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [schools, setSchools] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingRecords, setLR] = useState(false);
  const [loadingStats, setLS] = useState(false);
  const [loadingScheds, setLSc] = useState(false);

  const load = useCallback(async () => {
    setLS(true); setLR(true); setLSc(true);
    try {
      const [s, r, sc, sch] = await Promise.allSettled([
        getBackupStats(),
        getBackupRecords(),
        getBackupSchedules(),
        getRegisteredSchools(),
      ]);
      if (s.status === 'fulfilled') setStats(s.value);
      if (r.status === 'fulfilled') setRecords(Array.isArray(r.value) ? r.value : r.value?.results || []);
      if (sc.status === 'fulfilled') setSchedules(Array.isArray(sc.value) ? sc.value : sc.value?.results || []);
      if (sch.status === 'fulfilled') setSchools(sch.value?.schools || []);
    } finally { setLS(false); setLR(false); setLSc(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this backup record and its ZIP file?')) return;
    try {
      await deleteBackupRecord(id);
      setRecords(prev => prev.filter(r => r.id !== id));
      toast.success('Backup record deleted');
    } catch { toast.error('Failed to delete record'); }
  };

  const handleNewBackup = (record) => {
    if (record) setRecords(prev => [record, ...prev]);
    setTab('records');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Data Backup</h1>
          <p className="text-gray-500 text-sm mt-1">Export and manage full data backups for all schools</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              tab === t.key ? 'bg-white text-[#D94801] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab stats={stats} records={records} loading={loadingStats} />}
      {tab === 'initiate' && <InitiateTab schools={schools} onSuccess={handleNewBackup} />}
      {tab === 'records' && <RecordsTab records={records} loading={loadingRecords} onRefresh={load} onDelete={handleDelete} />}
      {tab === 'schedules' && <SchedulesTab schools={schools} schedules={schedules} loading={loadingScheds} />}
    </div>
  );
}