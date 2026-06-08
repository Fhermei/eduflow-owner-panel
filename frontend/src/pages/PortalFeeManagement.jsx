/**
 * owner-panel/src/pages/PortalFeeManagement.jsx
 * Complete portal fee management - redesigned with UI Bible
 * Fully responsive: mobile-first, tablet, desktop
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, RefreshCw, ChevronLeft, ChevronRight, Search,
  CheckCircle, XCircle, Clock, DollarSign, Users, TrendingUp,
  BarChart2, FileText, CreditCard, Settings, Play,
  ArrowLeft, Building2, X, Eye, Banknote, Globe,
  AlertCircle, Info, Calendar, UserCheck, UserX, PieChart,
  WifiOff, Grid3x3, Table2, Filter
} from 'lucide-react';

// ============================================
// API CONFIGURATION
// ============================================
const TOKEN_KEY = "owner_access_token";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...options.headers,
  };
  try {
    const resp = await fetch(`/api${path}`, { headers, ...options });
    if (!resp.ok) {
      let errText = '';
      try { errText = await resp.text(); } catch (_) {}
      throw new Error(`HTTP ${resp.status}: ${errText.slice(0, 200)}`);
    }
    return resp.json();
  } catch (err) {
    console.error(`API error [${path}]:`, err.message);
    throw err;
  }
}

// ============================================
// UI BIBLE DESIGN SYSTEM COMPONENTS
// ============================================

// Typography
const Text = ({ variant = 'body', children, className = '' }) => {
  const variants = {
    h1: 'text-2xl md:text-3xl font-bold',
    h2: 'text-xl md:text-2xl font-semibold',
    h3: 'text-lg md:text-xl font-semibold',
    h4: 'text-base md:text-lg font-medium',
    body: 'text-sm md:text-base',
    small: 'text-xs md:text-sm',
    caption: 'text-[10px] md:text-xs',
    tiny: 'text-[9px] md:text-[10px]',
  };
  return <div className={`${variants[variant]} text-gray-800 ${className}`}>{children}</div>;
};

// Primary Button (#D94801)
const Button = ({ children, variant = 'primary', size = 'medium', icon: Icon, onClick, loading, disabled, className = '' }) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease rounded-xl cursor-pointer';
  const variants = {
    primary: 'bg-[#D94801] text-white hover:bg-[#C24000] active:bg-[#A93600] shadow-sm',
    secondary: 'bg-[#1D2B49] text-white hover:bg-[#24385C] active:bg-[#324A74]',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-600 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
  };
  const sizes = {
    large: 'h-12 px-5 text-sm',
    medium: 'h-10 px-4 text-sm',
    small: 'h-8 px-3 text-xs',
    tiny: 'h-7 px-2 text-[10px]',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {loading && <RefreshCw size={14} className="animate-spin" />}
      {Icon && !loading && <Icon size={size === 'tiny' ? 12 : size === 'small' ? 14 : 16} />}
      {children}
    </button>
  );
};

// Card Component
const Card = ({ children, className = '', hover = false }) => (
  <div className={`bg-white rounded-2xl shadow-sm ${hover ? 'transition-shadow duration-200 hover:shadow-md' : ''} ${className}`}>
    {children}
  </div>
);

// Stat Card
const StatCard = ({ title, value, icon: Icon, color }) => (
  <Card className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <Text variant="h3" className="font-bold text-gray-800">{value ?? '—'}</Text>
        <Text variant="tiny" className="text-gray-400 mt-0.5">{title}</Text>
      </div>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
    </div>
  </Card>
);

// Status Badge
const StatusBadge = ({ status }) => {
  const config = {
    paid: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={10} />, label: 'Paid' },
    success: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={10} />, label: 'Success' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock size={10} />, label: 'Pending' },
    failed: { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle size={10} />, label: 'Failed' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-600', icon: <XCircle size={10} />, label: 'Cancelled' },
    active: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={10} />, label: 'Active' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-600', icon: <XCircle size={10} />, label: 'Inactive' },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-medium ${c.bg} ${c.text}`}>
      {c.icon} {c.label}
    </span>
  );
};

// Tabs Component
const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
    {tabs.map(t => (
      <button
        key={t.id}
        onClick={() => onChange(t.id)}
        className={`px-3 py-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border-b-2 ${
          active === t.id ? 'text-[#D94801] border-[#D94801]' : 'text-gray-500 hover:text-gray-700 border-transparent'
        }`}
      >
        {t.icon && <t.icon size={14} />}{t.label}
        {t.badge > 0 && <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-gray-100 text-gray-600 rounded-full">{t.badge}</span>}
      </button>
    ))}
  </div>
);

// Search Bar
const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="relative flex-1 min-w-[180px]">
    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D94801]"
    />
  </div>
);

// Loading Spinner
const Spinner = () => (
  <div className="flex justify-center py-12">
    <RefreshCw className="animate-spin h-8 w-8 text-[#D94801]" />
  </div>
);

// Empty State
const Empty = ({ title, desc, icon: Icon = AlertCircle }) => (
  <div className="text-center py-12">
    <Icon size={48} className="mx-auto text-gray-200 mb-3" />
    <Text variant="body" className="text-gray-400">{title}</Text>
    {desc && <Text variant="tiny" className="text-gray-400 mt-1">{desc}</Text>}
  </div>
);

// Error State
const ErrorState = ({ message, onRetry }) => (
  <div className="text-center py-12">
    <WifiOff size={48} className="mx-auto text-red-300 mb-3" />
    <Text variant="body" className="text-gray-600 font-medium">Failed to load data</Text>
    <Text variant="tiny" className="text-gray-400 mt-1 mb-4">{message}</Text>
    {onRetry && <Button variant="outline" size="small" icon={RefreshCw} onClick={onRetry}>Retry</Button>}
  </div>
);

// Pagination
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-100">
      <Button variant="ghost" size="tiny" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        <ChevronLeft size={14} /> Prev
      </Button>
      <div className="flex gap-1">
        {getPageNumbers().map((page, idx) => (
          page === '...' ? (
            <span key={idx} className="px-2 py-1 text-xs text-gray-400">...</span>
          ) : (
            <button
              key={idx}
              onClick={() => onPageChange(page)}
              className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors ${
                currentPage === page ? 'bg-[#D94801] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          )
        ))}
      </div>
      <Button variant="ghost" size="tiny" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        Next <ChevronRight size={14} />
      </Button>
    </div>
  );
};

// ============================================
// FORMATTERS
// ============================================
const fmt$ = n => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = s => s ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtDT = s => s ? new Date(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

// Mobile Filter Sheet Component
const MobileFilterSheet = ({ isOpen, onClose, filters, onApply, onClear }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 transition-opacity" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 p-5 animate-in slide-in-from-bottom duration-200 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <Text variant="h4" className="font-semibold">Filter Records</Text>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          {localFilters.map((filter, idx) => (
            <div key={idx}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{filter.label}</label>
              <select
                value={filter.value}
                onChange={(e) => {
                  const newFilters = [...localFilters];
                  newFilters[idx].value = e.target.value;
                  setLocalFilters(newFilters);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D94801]"
              >
                {filter.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <Button variant="primary" size="medium" onClick={() => { onApply(localFilters); onClose(); }} className="flex-1">
              Apply Filters
            </Button>
            <button onClick={() => { onClear(); onClose(); }} className="px-4 py-2 text-red-500 font-medium text-sm">
              Clear
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================
// OVERVIEW TAB
// ============================================
function OverviewTab({ onSelectSchool }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await apiFetch('/portal-fee/overview/');
      setData(r);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <Empty title="No data" icon={AlertCircle} />;

  const { aggregate = {}, schools = [] } = data;
  const filtered = schools.filter(s => !search || s.school_name?.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedSchools = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <StatCard title="Schools" value={aggregate.total_schools || 0} icon={Building2} color="bg-blue-600" />
        <StatCard title="Revenue" value={fmt$(aggregate.total_revenue)} icon={DollarSign} color="bg-green-600" />
        <StatCard title="Has Access" value={(aggregate.total_paid || 0).toLocaleString()} icon={UserCheck} color="bg-emerald-600" />
        <StatCard title="Awaiting" value={(aggregate.total_pending || 0).toLocaleString()} icon={UserX} color="bg-yellow-600" />
        <StatCard title="Invoices" value={(aggregate.total_invoices || 0).toLocaleString()} icon={FileText} color="bg-purple-600" />
        <StatCard title="Collection" value={`${aggregate.collection_rate || 0}%`} icon={PieChart} color="bg-indigo-600" />
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Filter schools..." />
      </div>

      {/* Schools Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">School</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fee</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Paid</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pending</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Invoices</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedSchools.map(s => (
                <tr key={s.school_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><Text variant="small" className="font-medium">{s.school_name}</Text></td>
                  <td className="px-4 py-3"><Text variant="tiny" className="font-semibold text-green-600">{fmt$(s.school_fee_amount)}</Text></td>
                  <td className="px-4 py-3"><Text variant="tiny" className="font-semibold">{fmt$(s.total_revenue)}</Text></td>
                  <td className="px-4 py-3"><Text variant="tiny" className="text-green-600">{s.portal_paid_count?.toLocaleString() || 0}</Text></td>
                  <td className="px-4 py-3"><Text variant="tiny" className="text-yellow-600">{s.portal_pending_count?.toLocaleString() || 0}</Text></td>
                  <td className="px-4 py-3"><Text variant="tiny">{s.total_invoices?.toLocaleString() || 0}</Text></td>
                  <td className="px-4 py-3"><StatusBadge status={s.is_active ? 'active' : 'inactive'} /></td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="tiny" icon={Eye} onClick={() => onSelectSchool(s)}>View</Button>
                  </td>
                </tr>
              ))}
              {paginatedSchools.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No schools found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
      </Card>
    </div>
  );
}

// ============================================
// BULK GENERATE TAB
// ============================================
function BulkGenerateTab({ schools }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [sessionsMap, setSessionsMap] = useState({});
  const [selectedSession, setSelectedSession] = useState({});
  const [selectedTerm, setSelectedTerm] = useState({});
  const [fetchingMeta, setFetchingMeta] = useState(false);

  useEffect(() => {
    if (!schools || schools.length === 0) return;
    const fetchMeta = async () => {
      setFetchingMeta(true);
      const map = {};
      const initSession = {};
      const initTerm = {};
      for (const school of schools) {
        const id = school.id || school.school_pk;
        try {
          const r = await apiFetch(`/portal-fee/school/${id}/summary/`);
          const sessions = r.sessions || [];
          const terms = r.terms || [];
          map[id] = { sessions, terms };
          const currentSession = sessions.find(s => s.is_current) || sessions[0];
          if (currentSession) {
            initSession[id] = currentSession.id;
            const sessionTerms = terms.filter(t => t.session_id === currentSession.id);
            const currentTerm = sessionTerms.find(t => t.is_current) || sessionTerms[0];
            if (currentTerm) initTerm[id] = currentTerm.id;
          }
        } catch (e) {
          map[id] = { sessions: [], terms: [] };
        }
      }
      setSessionsMap(map);
      setSelectedSession(initSession);
      setSelectedTerm(initTerm);
      setFetchingMeta(false);
    };
    fetchMeta();
  }, [schools]);

  const toggleSchool = id => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => {
    const allIds = schools.map(s => s.id || s.school_pk).filter(Boolean);
    setSelectedIds(p => p.length === allIds.length ? [] : allIds);
  };

  const run = async () => {
    const targetIds = selectedIds.length > 0 ? selectedIds : schools.map(s => s.id || s.school_pk).filter(Boolean);
    setLoading(true); setResults(null);
    const allResults = [];

    for (const schoolId of targetIds) {
      const school = schools.find(s => (s.id || s.school_pk) === schoolId);
      const meta = sessionsMap[schoolId] || { sessions: [], terms: [] };
      const sessId = selectedSession[schoolId];
      const termId = selectedTerm[schoolId];
      const session = meta.sessions.find(s => s.id === sessId) || meta.sessions[0];
      const term = meta.terms.find(t => t.id === termId) || meta.terms.find(t => t.session_id === session?.id) || meta.terms[0];

      if (!session || !term) {
        allResults.push({
          school_name: school?.school_name || school?.name || `School ${schoolId}`,
          success: false,
          error: 'No session/term found',
          created: 0, skipped: 0,
        });
        continue;
      }

      try {
        const r = await apiFetch('/portal-fee/bulk-generate/', {
          method: 'POST',
          body: JSON.stringify({
            school_ids: [schoolId],
            session_name: session.name,
            term_name: term.name,
          }),
        });
        const res = r.results?.[0] || {};
        allResults.push({
          school_name: school?.school_name || school?.name,
          success: res.success !== false,
          created: res.created_count || res.created || 0,
          skipped: res.skipped_count || res.skipped || 0,
        });
      } catch (e) {
        allResults.push({
          school_name: school?.school_name || school?.name,
          success: false,
          error: e.message,
          created: 0, skipped: 0,
        });
      }
    }

    setResults({ success: true, message: `Done — ${allResults.filter(r => r.success).length}/${allResults.length} succeeded`, results: allResults });
    setLoading(false);
  };

  const allIds = schools.map(s => s.id || s.school_pk).filter(Boolean);
  const allSelected = selectedIds.length === allIds.length && allIds.length > 0;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <Text variant="small" className="font-semibold mb-1">Generate Portal Fee Invoices</Text>
        <Text variant="tiny" className="text-gray-400 mb-4">Sessions and terms are fetched automatically from each school.</Text>
        {fetchingMeta && <div className="flex items-center gap-2 text-blue-500 mb-3"><RefreshCw size={12} className="animate-spin" /> Loading school sessions...</div>}
        <Button onClick={run} loading={loading} disabled={fetchingMeta} icon={Play}>
          Generate for {selectedIds.length > 0 ? `${selectedIds.length} school${selectedIds.length !== 1 ? 's' : ''}` : 'all schools'}
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
              <Text variant="small">Select All ({allIds.length})</Text>
            </label>
            <Text variant="tiny" className="text-gray-400">{selectedIds.length} selected</Text>
          </div>
        </div>
        <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
          {schools.map(s => {
            const id = s.id || s.school_pk;
            const meta = sessionsMap[id] || { sessions: [], terms: [] };
            const currentSessId = selectedSession[id];
            const filteredTerms = currentSessId ? meta.terms.filter(t => t.session_id === currentSessId) : meta.terms;

            return (
              <div key={id} className="flex flex-wrap items-center gap-3 p-3 hover:bg-gray-50">
                <label className="flex items-center gap-2 cursor-pointer min-w-[160px]">
                  <input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleSchool(id)} className="rounded" />
                  <Text variant="small" className="font-medium truncate">{s.school_name || s.name}</Text>
                </label>
                {fetchingMeta ? (
                  <div className="flex items-center gap-1 text-xs text-gray-400"><RefreshCw size={10} className="animate-spin" /> Loading...</div>
                ) : meta.sessions.length === 0 ? (
                  <Text variant="tiny" className="text-red-400">No sessions found</Text>
                ) : (
                  <>
                    <select value={selectedSession[id] || ''} onChange={e => {
                      const newSessId = Number(e.target.value);
                      setSelectedSession(prev => ({ ...prev, [id]: newSessId }));
                      const newTerms = meta.terms.filter(t => t.session_id === newSessId);
                      const currentTerm = newTerms.find(t => t.is_current) || newTerms[0];
                      setSelectedTerm(prev => ({ ...prev, [id]: currentTerm?.id || '' }));
                    }} className="px-2 py-1.5 text-xs border rounded-lg">
                      <option value="">Select session</option>
                      {meta.sessions.map(sess => <option key={sess.id} value={sess.id}>{sess.name}{sess.is_current ? ' ✓' : ''}</option>)}
                    </select>
                    <select value={selectedTerm[id] || ''} onChange={e => setSelectedTerm(prev => ({ ...prev, [id]: Number(e.target.value) }))} className="px-2 py-1.5 text-xs border rounded-lg">
                      <option value="">Select term</option>
                      {filteredTerms.map(t => <option key={t.id} value={t.id}>{t.name}{t.is_current ? ' ✓' : ''}</option>)}
                    </select>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {results && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3"><CheckCircle size={16} className="text-green-600" /><Text variant="small" className="font-medium">{results.message}</Text></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500">School</th><th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500">Status</th><th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500">Created</th><th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500">Skipped</th></tr></thead>
              <tbody className="divide-y">
                {results.results.map((r, i) => <tr key={i}><td className="px-3 py-2 text-xs font-medium">{r.school_name}</td><td className="px-3 py-2"><StatusBadge status={r.success ? 'success' : 'failed'} /></td><td className="px-3 py-2 text-xs text-green-600">{r.created}</td><td className="px-3 py-2 text-xs text-gray-400">{r.skipped}</td></tr>)}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================
// INVOICES TAB
// ============================================
function SchoolInvoicesTab({ schoolId, sessions = [], terms = [] }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [sessionId, setSid] = useState('');
  const [termId, setTid] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const itemsPerPage = 30;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page, page_size: itemsPerPage });
      if (sessionId) params.append('session_id', sessionId);
      if (termId) params.append('term_id', termId);
      if (status) params.append('status', status);
      if (search) params.append('search', search);
      const r = await apiFetch(`/portal-fee/school/${schoolId}/invoices/?${params}`);
      setData(r);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [schoolId, page, sessionId, termId, status, search]);

  useEffect(() => { load(); }, [load]);

  const filteredTerms = sessionId ? terms.filter(t => String(t.session_id) === String(sessionId)) : terms;
  const totalPages = Math.ceil((data?.count || 0) / itemsPerPage);
  const hasActiveFilters = sessionId || termId || status || search;

  const filterOptions = [
    { label: 'Session', value: sessionId, options: [{ value: '', label: 'All sessions' }, ...sessions.map(s => ({ value: s.id, label: s.name }))] },
    { label: 'Term', value: termId, options: [{ value: '', label: 'All terms' }, ...filteredTerms.map(t => ({ value: t.id, label: t.name }))] },
    { label: 'Status', value: status, options: [{ value: '', label: 'All statuses' }, { value: 'paid', label: 'Paid' }, { value: 'pending', label: 'Pending' }, { value: 'cancelled', label: 'Cancelled' }] },
  ];

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-3">
      {/* Desktop Filters */}
      <div className="hidden sm:flex flex-wrap gap-2">
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search student..." />
        <select value={sessionId} onChange={e => { setSid(e.target.value); setTid(''); setPage(1); }} className="px-3 py-2 text-sm border rounded-xl bg-white">
          <option value="">All sessions</option>
          {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={termId} onChange={e => { setTid(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border rounded-xl bg-white">
          <option value="">All terms</option>
          {filteredTerms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border rounded-xl bg-white">
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {hasActiveFilters && <Button variant="ghost" size="tiny" onClick={() => { setSid(''); setTid(''); setStatus(''); setSearch(''); setPage(1); }}>Clear</Button>}
      </div>

      {/* Mobile Filter Button */}
      <div className="sm:hidden">
        <button onClick={() => setShowMobileFilters(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-medium">
          <Filter size={15} /> Filter {hasActiveFilters && <span className="w-2 h-2 bg-[#D94801] rounded-full" />}
        </button>
      </div>

      <MobileFilterSheet isOpen={showMobileFilters} onClose={() => setShowMobileFilters(false)} filters={filterOptions} onApply={(newFilters) => { setSid(newFilters[0].value); setTid(newFilters[1].value); setStatus(newFilters[2].value); setPage(1); }} onClear={() => { setSid(''); setTid(''); setStatus(''); setSearch(''); setPage(1); }} />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500">Student</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 hidden sm:table-cell">Admission</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500">Session/Term</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500">Amount</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 hidden md:table-cell">Paid Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.results || []).map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><Text variant="small" className="font-medium">{inv.student_name}</Text><Text variant="tiny" className="text-gray-400 sm:hidden">{inv.student_admission}</Text></td>
                  <td className="px-4 py-3 hidden sm:table-cell"><Text variant="tiny" className="font-mono text-gray-500">{inv.student_admission}</Text></td>
                  <td className="px-4 py-3"><Text variant="tiny" className="text-gray-600">{inv.session_name}</Text><Text variant="tiny" className="text-gray-400">{inv.term_name}</Text></td>
                  <td className="px-4 py-3 text-right"><Text variant="small" className="font-semibold text-green-600">{fmt$(inv.amount)}</Text></td>
                  <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><Text variant="tiny" className="text-gray-500">{fmtDate(inv.paid_date)}</Text></td>
                </tr>
              ))}
              {!data?.results?.length && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No invoices found</td></tr>}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
      </Card>
    </div>
  );
}

// ============================================
// PAYMENTS TAB
// ============================================
function SchoolPaymentsTab({ schoolId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const itemsPerPage = 30;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page, page_size: itemsPerPage });
      if (status) params.append('status', status);
      if (search) params.append('search', search);
      const r = await apiFetch(`/portal-fee/school/${schoolId}/payments/?${params}`);
      setData(r);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [schoolId, page, status, search]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil((data?.count || 0) / itemsPerPage);
  const hasActiveFilters = status || search;

  const filterOptions = [
    { label: 'Status', value: status, options: [{ value: '', label: 'All statuses' }, { value: 'success', label: 'Success' }, { value: 'pending', label: 'Pending' }, { value: 'failed', label: 'Failed' }] },
  ];

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-3">
      <div className="hidden sm:flex flex-wrap gap-2">
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search student or reference..." />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border rounded-xl bg-white">
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        {hasActiveFilters && <Button variant="ghost" size="tiny" onClick={() => { setStatus(''); setSearch(''); setPage(1); }}>Clear</Button>}
      </div>

      <div className="sm:hidden">
        <button onClick={() => setShowMobileFilters(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-medium">
          <Filter size={15} /> Filter {hasActiveFilters && <span className="w-2 h-2 bg-[#D94801] rounded-full" />}
        </button>
      </div>

      <MobileFilterSheet isOpen={showMobileFilters} onClose={() => setShowMobileFilters(false)} filters={filterOptions} onApply={(newFilters) => { setStatus(newFilters[0].value); setPage(1); }} onClear={() => { setStatus(''); setSearch(''); setPage(1); }} />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500">Student</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 hidden sm:table-cell">Admission</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500">Amount</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500">Method</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 hidden md:table-cell">Reference</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.results || []).map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><Text variant="small" className="font-medium">{p.student_name || '—'}</Text><Text variant="tiny" className="text-gray-400 sm:hidden">{p.student_admission || '—'}</Text></td>
                  <td className="px-4 py-3 hidden sm:table-cell"><Text variant="tiny" className="font-mono text-gray-500">{p.student_admission || '—'}</Text></td>
                  <td className="px-4 py-3 text-right"><Text variant="small" className="font-semibold text-green-600">{fmt$(p.amount)}</Text></td>
                  <td className="px-4 py-3"><Text variant="tiny" className="capitalize">{(p.payment_method || '').replace('_', ' ') || '—'}</Text></td>
                  <td className="px-4 py-3 hidden md:table-cell"><Text variant="tiny" className="font-mono text-gray-500">{p.reference?.slice(-12) || '—'}</Text></td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><Text variant="tiny" className="text-gray-500">{fmtDT(p.created_at)}</Text></td>
                </tr>
              ))}
              {!data?.results?.length && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No payments found</td></tr>}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
      </Card>
    </div>
  );
}

// ============================================
// ACCESS TAB
// ============================================
function SchoolAccessTab({ schoolId, sessions = [], terms = [] }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [sessionId, setSid] = useState('');
  const [termId, setTid] = useState('');
  const [hasPaid, setHasPaid] = useState('');
  const [search, setSearch] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const itemsPerPage = 50;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page, page_size: itemsPerPage });
      if (sessionId) params.append('session_id', sessionId);
      if (termId) params.append('term_id', termId);
      if (hasPaid) params.append('has_paid', hasPaid);
      if (search) params.append('search', search);
      const r = await apiFetch(`/portal-fee/school/${schoolId}/access/?${params}`);
      setData(r);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [schoolId, page, sessionId, termId, hasPaid, search]);

  useEffect(() => { load(); }, [load]);

  const filteredTerms = sessionId ? terms.filter(t => String(t.session_id) === String(sessionId)) : terms;
  const totalPages = Math.ceil((data?.count || 0) / itemsPerPage);
  const hasActiveFilters = sessionId || termId || hasPaid || search;

  const filterOptions = [
    { label: 'Session', value: sessionId, options: [{ value: '', label: 'All sessions' }, ...sessions.map(s => ({ value: s.id, label: s.name }))] },
    { label: 'Term', value: termId, options: [{ value: '', label: 'All terms' }, ...filteredTerms.map(t => ({ value: t.id, label: t.name }))] },
    { label: 'Access', value: hasPaid, options: [{ value: '', label: 'All students' }, { value: 'true', label: 'Has access' }, { value: 'false', label: 'No access' }] },
  ];

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-3">
      <div className="hidden sm:flex flex-wrap gap-2">
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search student..." />
        <select value={sessionId} onChange={e => { setSid(e.target.value); setTid(''); setPage(1); }} className="px-3 py-2 text-sm border rounded-xl bg-white">
          <option value="">All sessions</option>
          {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={termId} onChange={e => { setTid(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border rounded-xl bg-white">
          <option value="">All terms</option>
          {filteredTerms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={hasPaid} onChange={e => { setHasPaid(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border rounded-xl bg-white">
          <option value="">All students</option>
          <option value="true">Has access</option>
          <option value="false">No access</option>
        </select>
        {hasActiveFilters && <Button variant="ghost" size="tiny" onClick={() => { setSid(''); setTid(''); setHasPaid(''); setSearch(''); setPage(1); }}>Clear</Button>}
      </div>

      <div className="sm:hidden">
        <button onClick={() => setShowMobileFilters(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-medium">
          <Filter size={15} /> Filter {hasActiveFilters && <span className="w-2 h-2 bg-[#D94801] rounded-full" />}
        </button>
      </div>

      <MobileFilterSheet isOpen={showMobileFilters} onClose={() => setShowMobileFilters(false)} filters={filterOptions} onApply={(newFilters) => { setSid(newFilters[0].value); setTid(newFilters[1].value); setHasPaid(newFilters[2].value); setPage(1); }} onClear={() => { setSid(''); setTid(''); setHasPaid(''); setSearch(''); setPage(1); }} />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500">Student</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 hidden sm:table-cell">Admission</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 hidden md:table-cell">Class</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500">Session/Term</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500">Access</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 hidden lg:table-cell">Granted On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.results || []).map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><Text variant="small" className="font-medium">{a.student_name}</Text><Text variant="tiny" className="text-gray-400 sm:hidden">{a.student_admission}</Text></td>
                  <td className="px-4 py-3 hidden sm:table-cell"><Text variant="tiny" className="font-mono text-gray-500">{a.student_admission}</Text></td>
                  <td className="px-4 py-3 hidden md:table-cell"><Text variant="tiny" className="text-gray-600">{a.class_name || '—'}</Text></td>
                  <td className="px-4 py-3"><Text variant="tiny" className="text-gray-600">{a.session_name}</Text><Text variant="tiny" className="text-gray-400">{a.term_name}</Text></td>
                  <td className="px-4 py-3">{a.has_paid ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-green-100 text-green-700"><CheckCircle size={10} /> Granted</span> : <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-yellow-100 text-yellow-700"><Clock size={10} /> Pending</span>}</td>
                  <td className="px-4 py-3 hidden lg:table-cell"><Text variant="tiny" className="text-gray-500">{fmtDate(a.access_granted_at || a.created_at)}</Text></td>
                </tr>
              ))}
              {!data?.results?.length && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No records found</td></tr>}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
      </Card>
    </div>
  );
}

// ============================================
// ANALYTICS TAB
// ============================================
function SchoolAnalyticsTab({ schoolId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const r = await apiFetch(`/portal-fee/school/${schoolId}/analytics/`); setData(r); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  
  const breakdown = data?.breakdown || [];
  if (!breakdown.length) return <Empty title="No analytics data" desc="No invoice data available yet" icon={BarChart2} />;

  const totalRev = breakdown.reduce((s, b) => s + (b.revenue || 0), 0);
  const maxRev = Math.max(...breakdown.map(b => b.revenue || 0), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Terms tracked" value={breakdown.length} icon={Calendar} color="bg-blue-600" />
        <StatCard title="Total revenue" value={fmt$(totalRev)} icon={DollarSign} color="bg-green-600" />
        <StatCard title="Total invoices" value={breakdown.reduce((s, b) => s + (b.total_invoices || 0), 0).toLocaleString()} icon={FileText} color="bg-purple-600" />
        <StatCard title="Avg collection" value={`${Math.round(breakdown.reduce((s, b) => s + (b.collection_rate || 0), 0) / breakdown.length)}%`} icon={TrendingUp} color="bg-indigo-600" />
      </div>

      <Card className="p-4">
        <Text variant="small" className="font-semibold mb-4">Collection rate per term</Text>
        <div className="space-y-3">
          {breakdown.map((b, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <Text variant="tiny" className="font-medium">{b.session_name} — {b.term_name}</Text>
                <Text variant="tiny" className="text-gray-500">{b.paid}/{b.total_invoices} paid · {fmt$(b.revenue)}</Text>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${(b.collection_rate || 0) >= 75 ? 'bg-green-500' : (b.collection_rate || 0) >= 40 ? 'bg-yellow-500' : 'bg-red-400'}`} style={{ width: `${b.collection_rate || 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <Text variant="small" className="font-semibold mb-4">Revenue per term</Text>
        <div className="space-y-2">
          {breakdown.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-28 text-xs truncate text-gray-600">{b.term_name}</span>
              <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden">
                <div className="h-full bg-[#1D2B49] rounded-lg flex items-center px-2 transition-all" style={{ width: `${Math.max(5, ((b.revenue || 0) / maxRev) * 100)}%`, minWidth: (b.revenue || 0) > 0 ? 60 : 0 }}>
                  {(b.revenue || 0) > 0 && <span className="text-xs font-medium text-white">{fmt$(b.revenue)}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================
// SETTINGS TAB
// ============================================
function SchoolSettingsTab({ schoolId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const r = await apiFetch(`/portal-fee/school/${schoolId}/settings/`); setData(r); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  
  const s = data?.settings || {};

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 pb-3 border-b mb-4">
        <Settings size={15} className="text-gray-500" />
        <Text variant="small" className="font-semibold">Portal Fee Settings (read-only from owner panel)</Text>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <Text variant="tiny" className="text-gray-600">Fee amount</Text>
          <Text variant="h4" className="font-bold text-green-600">{fmt$(s.fee_amount)}</Text>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <Text variant="tiny" className="text-gray-600">Status</Text>
          <StatusBadge status={s.is_active ? 'active' : 'inactive'} />
        </div>
        {s.updated_at && (
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg sm:col-span-2">
            <Text variant="tiny" className="text-gray-600">Last updated</Text>
            <Text variant="tiny">{fmtDT(s.updated_at)}</Text>
          </div>
        )}
      </div>
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-blue-700 text-xs">
        <Info size={13} className="mt-0.5 flex-shrink-0" />
        <Text variant="tiny">To change portal fee settings, log into the individual school's admin panel.</Text>
      </div>
    </Card>
  );
}

// ============================================
// SCHOOL DRILL-DOWN
// ============================================
function SchoolDrillDown({ school, onBack }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');

  const schoolId = school.school_pk || school.id;

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true); setSummaryError('');
    try { const r = await apiFetch(`/portal-fee/school/${schoolId}/summary/`); setSummaryData(r); }
    catch (e) { setSummaryError(e.message); } finally { setSummaryLoading(false); }
  }, [schoolId]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const sessions = summaryData?.sessions || [];
  const terms = summaryData?.terms || [];
  const summary = summaryData?.summary || {};

  const tabs = [
    { id: 'summary', label: 'Summary', icon: BarChart2 },
    { id: 'invoices', label: 'Invoices', icon: FileText, badge: summary.total_invoices || 0 },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'access', label: 'Access', icon: Users, badge: summary.portal_paid_count || 0 },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Button variant="outline" size="small" icon={ArrowLeft} onClick={onBack}>Back</Button>
        <div>
          <Text variant="h3" className="font-semibold text-gray-800">{school.school_name || school.name}</Text>
          <Text variant="tiny" className="text-gray-500">ID: {school.school_id}</Text>
        </div>
        <Button variant="ghost" size="tiny" icon={RefreshCw} onClick={loadSummary} loading={summaryLoading} className="ml-auto" />
      </div>

      {summaryError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2"><AlertCircle size={13} /> Summary failed: {summaryError}</div>}

      {!summaryLoading && !summaryError && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-5">
          <StatCard title="Revenue" value={fmt$(summary.total_revenue)} icon={DollarSign} color="bg-green-600" />
          <StatCard title="Has Access" value={(summary.portal_paid_count || 0).toLocaleString()} icon={UserCheck} color="bg-emerald-600" />
          <StatCard title="Awaiting" value={(summary.portal_pending_count || 0).toLocaleString()} icon={UserX} color="bg-yellow-600" />
          <StatCard title="Paid invoices" value={(summary.paid_invoices || 0).toLocaleString()} icon={FileText} color="bg-purple-600" />
          <StatCard title="Failed" value={(summary.failed_payments || 0).toLocaleString()} icon={XCircle} color="bg-red-600" />
          <StatCard title="Fee" value={fmt$(summary.school_fee_amount)} icon={Banknote} color="bg-blue-600" />
        </div>
      )}

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'summary' && (
        summaryLoading ? <Spinner /> : summaryError ? <ErrorState message={summaryError} onRetry={loadSummary} /> :
        <Card className="p-4">
          <Text variant="small" className="font-semibold mb-3">Sessions & Terms</Text>
          {sessions.length === 0 ? <Text variant="body" className="text-gray-400">No sessions found for this school.</Text> :
            sessions.map(sess => (
              <div key={sess.id} className="flex flex-wrap items-center gap-3 text-sm p-2.5 bg-gray-50 rounded-lg mb-2">
                {sess.is_current && <StatusBadge status="active" />}
                <Text variant="small" className="font-medium">{sess.name}</Text>
                <Text variant="tiny" className="text-gray-500">{fmtDate(sess.start_date)} – {fmtDate(sess.end_date)}</Text>
                <Text variant="tiny" className="text-gray-400 ml-auto">{terms.filter(t => t.session_id === sess.id).length} terms</Text>
              </div>
            ))
          }
        </Card>
      )}
      {activeTab === 'invoices' && schoolId && <SchoolInvoicesTab schoolId={schoolId} sessions={sessions} terms={terms} />}
      {activeTab === 'payments' && schoolId && <SchoolPaymentsTab schoolId={schoolId} />}
      {activeTab === 'access' && schoolId && <SchoolAccessTab schoolId={schoolId} sessions={sessions} terms={terms} />}
      {activeTab === 'analytics' && schoolId && <SchoolAnalyticsTab schoolId={schoolId} />}
      {activeTab === 'settings' && schoolId && <SchoolSettingsTab schoolId={schoolId} />}
    </div>
  );
}

// ============================================
// MAIN EXPORT
// ============================================
export default function PortalFeeManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSchool, setSelected] = useState(null);
  const [allSchools, setAllSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [schoolsError, setSchoolsError] = useState('');

  const loadSchools = useCallback(async () => {
    setSchoolsLoading(true); setSchoolsError('');
    try {
      const r = await apiFetch('/schools/');
      setAllSchools(r.schools || []);
    } catch (e) {
      setSchoolsError(e.message);
    } finally { setSchoolsLoading(false); }
  }, []);

  useEffect(() => { loadSchools(); }, [loadSchools]);

  const handleSelectSchool = school => { setSelected(school); setActiveTab('school'); };
  const handleBack = () => { setSelected(null); setActiveTab('overview'); };

  const topTabs = [
    { id: 'overview', label: 'All Schools', icon: Globe },
    { id: 'bulk', label: 'Bulk Generate', icon: Play },
    ...(selectedSchool ? [{ id: 'school', label: selectedSchool.school_name || selectedSchool.name, icon: Building2 }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#1D2B49] rounded-xl flex items-center justify-center shadow-sm"><Shield size={18} className="text-white" /></div>
          <div><Text variant="h1" className="font-bold text-gray-800">Portal Fee Management</Text><Text variant="tiny" className="text-gray-500">View and manage portal access fees across all schools</Text></div>
        </div>

        <Tabs tabs={topTabs} active={activeTab} onChange={t => { setActiveTab(t); if (t !== 'school') setSelected(null); }} />

        {activeTab === 'overview' && (schoolsError ? <ErrorState message={`Schools list failed: ${schoolsError}`} onRetry={loadSchools} /> : <OverviewTab onSelectSchool={handleSelectSchool} />)}
        {activeTab === 'bulk' && (schoolsLoading ? <Spinner /> : schoolsError ? <ErrorState message={schoolsError} onRetry={loadSchools} /> : <BulkGenerateTab schools={allSchools} />)}
        {activeTab === 'school' && selectedSchool && <SchoolDrillDown school={selectedSchool} onBack={handleBack} />}
      </div>
    </div>
  );
}