'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Filter,
  Download,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Activity,
  Search,
  Calendar,
  User,
  Cpu,
  Boxes,
  Bell,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import {
  getAuditLog,
  getAuditStats,
  type AuditLogEntry,
  type CommandRiskLevel,
} from '@/data/mock-commands';
import { mockPlants } from '@/data/mock-plants';

type ActionFilter = 'all' | 'executed' | 'failed' | 'cancelled' | 'confirmed' | 'created';
type RiskFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';
type SourceFilter = 'all' | 'manual' | 'ai_optimization' | 'virtual_twin' | 'alarm_response';

const actionColors: Record<string, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  created: { bg: 'bg-slate-100', text: 'text-slate-600', icon: Clock },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
  executed: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
  failed: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  cancelled: { bg: 'bg-amber-100', text: 'text-amber-700', icon: AlertTriangle },
  expired: { bg: 'bg-slate-100', text: 'text-slate-500', icon: Clock },
};

const riskColors: Record<CommandRiskLevel, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' },
};

const sourceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  manual: User,
  ai_optimization: Cpu,
  virtual_twin: Boxes,
  alarm_response: Bell,
};

const sourceLabels: Record<string, string> = {
  manual: 'Manual',
  ai_optimization: 'AI Optimization',
  virtual_twin: 'Virtual Twin',
  alarm_response: 'Alarm Response',
};

export default function AuditLogPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [plantFilter, setPlantFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Load audit entries
      const entries = getAuditLog({ limit: 100 });
      setAuditEntries(entries);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => getAuditStats(), []);

  const filteredEntries = useMemo(() => {
    let entries = [...auditEntries];

    if (actionFilter !== 'all') {
      entries = entries.filter(e => e.action === actionFilter);
    }
    if (riskFilter !== 'all') {
      entries = entries.filter(e => e.riskLevel === riskFilter);
    }
    if (sourceFilter !== 'all') {
      entries = entries.filter(e => e.source === sourceFilter);
    }
    if (plantFilter !== 'all') {
      entries = entries.filter(e => e.plantId === plantFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      entries = entries.filter(e =>
        e.equipmentName.toLowerCase().includes(query) ||
        e.parameterName.toLowerCase().includes(query) ||
        e.performedBy.toLowerCase().includes(query) ||
        e.details.toLowerCase().includes(query)
      );
    }

    return entries;
  }, [auditEntries, actionFilter, riskFilter, sourceFilter, plantFilter, searchQuery]);

  const handleRefresh = () => {
    const entries = getAuditLog({ limit: 100 });
    setAuditEntries(entries);
  };

  const handleExport = () => {
    // Mock export functionality
    const csvContent = [
      ['Timestamp', 'Action', 'Equipment', 'Parameter', 'Previous', 'New', 'Unit', 'Risk', 'Source', 'User', 'Details'],
      ...filteredEntries.map(e => [
        format(e.performedAt, 'yyyy-MM-dd HH:mm:ss'),
        e.action,
        e.equipmentName,
        e.parameterName,
        e.previousValue,
        e.newValue,
        e.unit,
        e.riskLevel,
        e.source,
        e.performedBy,
        e.details,
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Command Audit Log</span>
          </div>
        </header>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-slate-200 border-2 border-slate-300" />
              ))}
            </div>
            <div className="h-96 bg-slate-200 border-2 border-slate-300" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Industrial Header */}
      <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <FileText className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Command Audit Log</span>
          <span className="text-[10px] text-slate-400">Control Action History & Compliance</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-600"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase bg-blue-600 text-white hover:bg-blue-700"
          >
            <Download className="h-3 w-3" />
            Export CSV
          </button>
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Commands */}
          <div className="border-2 border-slate-300 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Entries</span>
              <Activity className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-700">{stats.total}</span>
              <span className="text-[10px] text-slate-500">LOGGED ACTIONS</span>
            </div>
          </div>

          {/* Executed */}
          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-emerald-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Executed</span>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-600">{stats.executed}</span>
              <span className="text-[10px] text-slate-500">SUCCESSFUL</span>
            </div>
          </div>

          {/* Failed */}
          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-red-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Failed</span>
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-red-600">{stats.failed}</span>
              <span className="text-[10px] text-slate-500">ERRORS</span>
            </div>
          </div>

          {/* Cancelled */}
          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-amber-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cancelled</span>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-amber-600">{stats.cancelled}</span>
              <span className="text-[10px] text-slate-500">ABORTED</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search equipment, user..."
                className="h-8 pl-9 pr-3 text-[11px] border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500 w-48"
              />
            </div>

            {/* Action Filter */}
            <div className="relative">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value as ActionFilter)}
                className="h-8 px-3 pr-8 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
              >
                <option value="all">All Actions</option>
                <option value="executed">Executed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
                <option value="confirmed">Confirmed</option>
                <option value="created">Created</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Risk Filter */}
            <div className="relative">
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as RiskFilter)}
                className="h-8 px-3 pr-8 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
                <option value="critical">Critical</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Source Filter */}
            <div className="relative">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
                className="h-8 px-3 pr-8 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
              >
                <option value="all">All Sources</option>
                <option value="manual">Manual</option>
                <option value="ai_optimization">AI Optimization</option>
                <option value="virtual_twin">Virtual Twin</option>
                <option value="alarm_response">Alarm Response</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Plant Filter */}
            <div className="relative">
              <select
                value={plantFilter}
                onChange={(e) => setPlantFilter(e.target.value)}
                className="h-8 px-3 pr-8 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
              >
                <option value="all">All Plants</option>
                {mockPlants.map((plant) => (
                  <option key={plant.id} value={plant.id}>
                    {plant.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            Showing {filteredEntries.length} of {auditEntries.length} entries
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="border-2 border-slate-300 bg-white overflow-hidden">
          <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Audit Trail
            </span>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No Audit Entries</h3>
              <p className="text-sm text-slate-500">
                No commands match your current filters. Try adjusting the filters or execute some commands.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Timestamp
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Action
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Equipment / Parameter
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Change
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Risk
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Source
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      User
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEntries.map((entry) => {
                    const actionConfig = actionColors[entry.action] || actionColors.created;
                    const ActionIcon = actionConfig.icon;
                    const riskConfig = riskColors[entry.riskLevel];
                    const SourceIcon = sourceIcons[entry.source] || Activity;

                    return (
                      <tr key={entry.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="text-[11px] font-mono text-slate-700">
                            {format(entry.performedAt, 'MMM d, HH:mm:ss')}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {formatDistanceToNow(entry.performedAt, { addSuffix: true })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase',
                            actionConfig.bg,
                            actionConfig.text
                          )}>
                            <ActionIcon className="h-3 w-3" />
                            {entry.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-[12px] font-semibold text-slate-700">
                            {entry.equipmentName}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {entry.plantName} • {entry.parameterName}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-[11px] font-mono">
                            <span className="text-slate-500">{entry.previousValue}</span>
                            {entry.action === 'executed' ? (
                              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3 text-slate-400" />
                            )}
                            <span className={cn(
                              entry.action === 'executed' ? 'text-emerald-700 font-bold' : 'text-slate-600'
                            )}>
                              {entry.newValue}
                            </span>
                            <span className="text-[10px] text-slate-400">{entry.unit}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'px-2 py-0.5 text-[9px] font-bold uppercase',
                            riskConfig.bg,
                            riskConfig.text
                          )}>
                            {entry.riskLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <SourceIcon className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-[10px] text-slate-600">
                              {sourceLabels[entry.source] || entry.source}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] text-slate-700">{entry.performedBy}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Statistics by Source */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* By Risk Level */}
          <div className="border-2 border-slate-300 bg-white overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Executed Commands by Risk Level
              </span>
            </div>
            <div className="p-4 space-y-3">
              {(['low', 'medium', 'high', 'critical'] as CommandRiskLevel[]).map((level) => {
                const count = stats.byRiskLevel[level] || 0;
                const total = Object.values(stats.byRiskLevel).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                const config = riskColors[level];

                return (
                  <div key={level} className="flex items-center gap-3">
                    <div className={cn('px-2 py-1 text-[9px] font-bold uppercase', config.bg, config.text)}>
                      {level}
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-slate-200 overflow-hidden">
                        <div
                          className={cn('h-full', config.bg.replace('50', '400'))}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-600 w-12 text-right">
                      {count} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Source */}
          <div className="border-2 border-slate-300 bg-white overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Commands by Source
              </span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {Object.entries(sourceLabels).map(([key, label]) => {
                const count = stats.bySource[key] || 0;
                const SourceIcon = sourceIcons[key] || Activity;

                return (
                  <div key={key} className="p-3 border border-slate-200 flex items-center gap-3">
                    <div className="p-2 bg-slate-100">
                      <SourceIcon className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-lg font-bold font-mono text-slate-700">{count}</p>
                      <p className="text-[9px] text-slate-500 uppercase">{label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
