import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Search,
  Filter,
  LayoutGrid,
  List,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { mockProperties } from '../data/mock-data';

type SortKey = 'date' | 'risk' | 'sumInsured' | 'name';
type ViewMode = 'list' | 'grid';

function RiskRing({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const cfg = {
    sm: { dim: 32, stroke: 3, fs: 'text-[10px]' },
    md: { dim: 40, stroke: 3.5, fs: 'text-xs' },
  }[size];
  const radius = (cfg.dim - cfg.stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - Math.min(score, 100) / 100);
  const color = score >= 70 ? '#ef4444' : score >= 40 ? '#eab308' : '#22c55e';
  return (
    <div className="relative inline-flex" style={{ width: cfg.dim, height: cfg.dim }}>
      <svg width={cfg.dim} height={cfg.dim} viewBox={`0 0 ${cfg.dim} ${cfg.dim}`} className="-rotate-90">
        <circle cx={cfg.dim / 2} cy={cfg.dim / 2} r={radius} fill="none" strokeWidth={cfg.stroke} stroke={color} opacity={0.15} />
        <circle cx={cfg.dim / 2} cy={cfg.dim / 2} r={radius} fill="none" strokeWidth={cfg.stroke} stroke={color} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center font-bold ${cfg.fs}`} style={{ color }}>{score}</span>
    </div>
  );
}

function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    referred: 'bg-orange-50 text-orange-700 border-orange-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />,
    approved: <CheckCircle2 className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />,
    referred: <AlertTriangle className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />,
    rejected: <XCircle className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />,
  };
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold capitalize border ${sizeClasses} ${map[status] || map.pending}`}>
      {icons[status]}
      {status}
    </span>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-2.5 py-2">
      <p className="text-gray-400 text-[10px] font-medium">{label}</p>
      <p className="text-gray-800 font-semibold truncate mt-0.5 text-[11px]">{value}</p>
    </div>
  );
}

export default function CommandCenterSubmissions() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const statusCounts = useMemo(() => ({
    all: mockProperties.length,
    pending: mockProperties.filter((p) => p.status === 'pending').length,
    approved: mockProperties.filter((p) => p.status === 'approved').length,
    referred: mockProperties.filter((p) => p.status === 'referred').length,
    rejected: mockProperties.filter((p) => p.status === 'rejected').length,
  }), []);

  const filtered = useMemo(() => {
    let items = mockProperties.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.city.toLowerCase().includes(search.toLowerCase()) ||
        p.broker.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    items = [...items].sort((a, b) => {
      switch (sortBy) {
        case 'risk': return b.riskScore - a.riskScore;
        case 'sumInsured': return b.sumInsured - a.sumInsured;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });
    return items;
  }, [search, statusFilter, sortBy]);

  const getDaysAgo = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const getRiskBorderLeft = (score: number) => {
    if (score >= 70) return 'border-l-4 border-l-red-400';
    if (score >= 40) return 'border-l-4 border-l-yellow-400';
    return 'border-l-4 border-l-green-400';
  };

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-[1440px] mx-auto bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Submissions</h1>
          <p className="text-sm text-gray-500 mt-1">{mockProperties.length} properties in portfolio</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sort */}
          <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
            <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="bg-transparent text-xs text-gray-700 outline-none cursor-pointer font-medium"
            >
              <option value="date">Date</option>
              <option value="risk">Risk Score</option>
              <option value="sumInsured">Sum Insured</option>
              <option value="name">Name</option>
            </select>
          </div>
          {/* View toggle */}
          <div className="flex rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by name, city, or broker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-gray-400" />
          {(['all', 'pending', 'approved', 'referred', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-all ${
                statusFilter === s
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s}{' '}
              <span className={statusFilter === s ? 'text-white/70' : 'text-gray-400'}>
                ({statusCounts[s]})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {viewMode === 'list' ? (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-[48px_1fr_140px_120px_100px_100px_80px_32px] items-center px-4 py-3 gap-2">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Risk</span>
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Risk Name</span>
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Insurer</span>
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Broker</span>
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Approached</span>
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">TSI</span>
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-center">Status</span>
              <span />
            </div>
          </div>
          <div>
            {filtered.map((prop, idx) => (
              <div
                key={prop.id}
                className={`grid grid-cols-[48px_1fr_140px_120px_100px_100px_80px_32px] items-center px-4 py-3.5 gap-2 cursor-pointer group hover:bg-gray-50 transition-colors ${getRiskBorderLeft(prop.riskScore)} ${idx < filtered.length - 1 ? 'border-b border-gray-100' : ''}`}
                onClick={() => navigate('submissions')}
              >
                <div><RiskRing score={prop.riskScore} size="sm" /></div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 group-hover:text-primary transition-colors truncate">{prop.name}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{prop.city} • {prop.type}</p>
                </div>
                <p className="text-gray-700 text-xs truncate">{prop.insurerName}</p>
                <p className="text-gray-700 text-xs truncate">{prop.broker}</p>
                <div>
                  <p className="text-gray-700 text-xs">{prop.dateApproached}</p>
                  <p className="text-[10px] font-semibold text-gray-400">{getDaysAgo(prop.dateApproached)}</p>
                </div>
                <p className="text-gray-900 text-xs font-semibold text-right">AED {(prop.sumInsured / 1_000_000).toFixed(1)}M</p>
                <div className="text-center"><StatusBadge status={prop.status} /></div>
                <div>
                  <ArrowRight className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((prop) => (
            <div
              key={prop.id}
              className="group rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
              onClick={() => navigate('submissions')}
            >
              <div className={`h-1.5 ${prop.riskScore >= 70 ? 'bg-gradient-to-r from-red-500 to-red-300' : prop.riskScore >= 40 ? 'bg-gradient-to-r from-yellow-500 to-yellow-300' : 'bg-gradient-to-r from-green-500 to-green-300'}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate group-hover:text-primary transition-colors">{prop.name}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{prop.broker} • {prop.city}</p>
                  </div>
                  <RiskRing score={prop.riskScore} size="md" />
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-[11px] mb-4">
                  <InfoCell label="Insurer" value={prop.insurerName} />
                  <InfoCell label="Share Offered" value={`${prop.shareOffered}%`} />
                  <InfoCell label="RI Broker" value={prop.reinsuranceBroker} />
                  <InfoCell label="Sum Insured" value={`AED ${(prop.sumInsured / 1_000_000).toFixed(1)}M`} />
                  <InfoCell label="Risk Start" value={prop.riskStartDate} />
                  <InfoCell label="Approached" value={getDaysAgo(prop.dateApproached)} />
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <StatusBadge status={prop.status} size="md" />
                  {prop.riskScore >= 70 && (
                    <span className="text-[10px] text-red-600 font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {prop.aiInsights.filter((i) => i.severity === 'high').length} critical
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <Search className="h-10 w-10 mx-auto mb-4 opacity-30" />
          <p className="font-semibold text-gray-700">No submissions match your filters</p>
          <p className="text-xs mt-1.5">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
