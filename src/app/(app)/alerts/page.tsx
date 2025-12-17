'use client';

import { useState, useMemo, useEffect } from 'react';
import { AlertTable } from '@/components/alerts/alert-table';
import { AlertModal } from '@/components/alerts/alert-modal';
import { CreateRuleModal } from '@/components/alerts/create-rule-modal';
import { Alert, AlertStatus, AlertRule } from '@/types';
import {
  mockAlerts,
  getAlertsByStatus,
  getAlertStats,
} from '@/data/mock-alerts';
import { mockPlants } from '@/data/mock-plants';
import {
  getCorrelatedAlertGroups,
  getFatigueMetrics,
  getFirstOutAnalyses,
  getSuppressionRules,
  getOrchestrationStats,
  CorrelatedAlertGroup,
  FirstOutAnalysis,
  SuppressionRule,
} from '@/data/mock-alarm-orchestration';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Plus,
  Filter,
  Bell,
  ChevronDown,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  MapPin,
  Zap,
  Link2,
  BrainCircuit,
  ShieldOff,
  Activity,
  ChevronRight,
  Target,
  Gauge,
  Timer,
  BellOff,
  Eye,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import { AlertsSkeleton } from '@/components/shared/loading-skeleton';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { subDays, format } from 'date-fns';

type TabValue = 'overview' | 'smart' | 'active' | 'acknowledged' | 'resolved' | 'all';

export default function AlertsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<TabValue>('overview');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createRuleModalOpen, setCreateRuleModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [plantFilter, setPlantFilter] = useState<string>('all');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [selectedFirstOut, setSelectedFirstOut] = useState<FirstOutAnalysis | null>(null);

  // Smart Alarm Orchestration data
  const correlatedGroups = useMemo(() => getCorrelatedAlertGroups(), []);
  const fatigueMetrics = useMemo(() => getFatigueMetrics(), []);
  const firstOutAnalyses = useMemo(() => getFirstOutAnalyses(), []);
  const suppressionRules = useMemo(() => getSuppressionRules(), []);
  const orchestrationStats = useMemo(() => getOrchestrationStats(), []);

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const stats = getAlertStats();

  // Chart color constants
  const COLORS = {
    critical: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    active: '#ef4444',
    acknowledged: '#f59e0b',
    resolved: '#10b981',
  };

  // Severity distribution data for pie chart
  const severityDistribution = useMemo(() => [
    { name: 'Critical', value: stats.critical, color: COLORS.critical },
    { name: 'Warning', value: stats.warning, color: COLORS.warning },
    { name: 'Info', value: stats.info, color: COLORS.info },
  ], [stats.critical, stats.warning, stats.info]);

  // Status distribution data for pie chart
  const statusDistribution = useMemo(() => [
    { name: 'Active', value: stats.active, color: COLORS.active },
    { name: 'Acknowledged', value: stats.acknowledged, color: COLORS.acknowledged },
    { name: 'Resolved', value: stats.resolved, color: COLORS.resolved },
  ], [stats.active, stats.acknowledged, stats.resolved]);

  // Alerts by plant data
  const alertsByPlant = useMemo(() => {
    const plantCounts: Record<string, { name: string; critical: number; warning: number; info: number }> = {};
    mockAlerts.forEach((alert) => {
      if (!plantCounts[alert.plantId]) {
        plantCounts[alert.plantId] = { name: alert.plantName, critical: 0, warning: 0, info: 0 };
      }
      plantCounts[alert.plantId][alert.severity]++;
    });
    return Object.values(plantCounts);
  }, []);

  // Alert trend data (last 7 days)
  const alertTrend = useMemo(() => {
    const days: { date: string; alerts: number; critical: number; resolved: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'MMM dd');
      // Simulated data based on pattern
      const baseAlerts = Math.floor(Math.random() * 8) + 4;
      const critical = Math.floor(Math.random() * 3);
      const resolved = Math.floor(Math.random() * 6) + 2;
      days.push({ date: dateStr, alerts: baseAlerts, critical, resolved });
    }
    return days;
  }, []);

  // Alert types distribution
  const alertTypes = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    mockAlerts.forEach((alert) => {
      typeCounts[alert.type] = (typeCounts[alert.type] || 0) + 1;
    });
    return Object.entries(typeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, []);

  const filteredAlerts = useMemo(() => {
    let alerts = selectedTab === 'all' || selectedTab === 'overview'
      ? mockAlerts
      : getAlertsByStatus(selectedTab as AlertStatus);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      alerts = alerts.filter(
        (a) =>
          a.type.toLowerCase().includes(query) ||
          a.plantName.toLowerCase().includes(query) ||
          a.sensorName.toLowerCase().includes(query)
      );
    }

    if (severityFilter !== 'all') {
      alerts = alerts.filter((a) => a.severity === severityFilter);
    }

    if (plantFilter !== 'all') {
      alerts = alerts.filter((a) => a.plantId === plantFilter);
    }

    return alerts;
  }, [selectedTab, searchQuery, severityFilter, plantFilter]);

  const handleViewAlert = (alert: Alert) => {
    setSelectedAlert(alert);
    setModalOpen(true);
  };

  const handleAcknowledge = (alertId: string) => {
    // In a real app, this would update the alert in the backend
    toast.success('Alert acknowledged', {
      description: 'The alert has been acknowledged successfully.',
    });
    setModalOpen(false);
  };

  const handleResolve = (alertId: string) => {
    // In a real app, this would update the alert in the backend
    toast.success('Alert resolved', {
      description: 'The alert has been marked as resolved.',
    });
    setModalOpen(false);
  };

  const handleCreateRule = (rule: Omit<AlertRule, 'id'>) => {
    // In a real app, this would save the rule to the backend
    console.log('New rule created:', rule);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Bell className="h-4 w-4 text-white" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Alerts Center</span>
            <span className="text-[10px] text-slate-400">Monitor and manage system alerts</span>
          </div>
        </header>
        <AlertsSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Industrial Header Bar */}
      <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Bell className="h-4 w-4 text-white" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Alerts Center</span>
          <span className="text-[10px] text-slate-400">Monitor and manage system alerts</span>
        </div>
        <div className="flex items-center gap-3">
          {stats.critical > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-red-600 text-white text-[10px] font-bold">
              <AlertTriangle className="h-3 w-3" />
              {stats.critical} CRITICAL
            </span>
          )}
          {stats.warning > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-amber-600 text-white text-[10px] font-bold">
              {stats.warning} WARN
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {/* Industrial Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Critical Alerts */}
          <div className={cn(
            'border-2 border-slate-300 bg-white p-4',
            stats.critical > 0 && 'border-l-[3px] border-l-red-500'
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Critical Alerts</span>
              <AlertTriangle className={cn('h-4 w-4', stats.critical > 0 ? 'text-red-600' : 'text-slate-400')} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                'text-2xl font-bold tracking-tight',
                stats.critical > 0 ? 'text-red-600' : 'text-slate-700'
              )} style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>{stats.critical}</span>
              <span className="text-[10px] text-slate-500">
                {stats.critical > 0 ? 'REQUIRES ACTION' : 'ALL CLEAR'}
              </span>
            </div>
          </div>

          {/* Warnings */}
          <div className={cn(
            'border-2 border-slate-300 bg-white p-4',
            stats.warning > 0 && 'border-l-[3px] border-l-amber-500'
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Warnings</span>
              <AlertCircle className={cn('h-4 w-4', stats.warning > 0 ? 'text-amber-600' : 'text-slate-400')} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                'text-2xl font-bold tracking-tight',
                stats.warning > 0 ? 'text-amber-600' : 'text-slate-700'
              )} style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>{stats.warning}</span>
              <span className="text-[10px] text-slate-500">MONITOR CLOSELY</span>
            </div>
          </div>

          {/* Resolution Rate */}
          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-emerald-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Resolution Rate</span>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-emerald-600" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                {Math.round((stats.resolved / stats.total) * 100)}%
              </span>
              <span className="text-[10px] text-slate-500">{stats.resolved} RESOLVED</span>
            </div>
          </div>

          {/* Avg Response Time */}
          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg Response Time</span>
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-blue-600" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>12m</span>
              <span className="text-[10px] text-slate-500">3m FASTER THAN TARGET</span>
            </div>
          </div>
        </div>

        {/* Alert Management Panel */}
        <div className="border-2 border-slate-300 bg-white overflow-hidden">
          {/* Panel Header */}
          <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Alert Management</span>
            <button
              onClick={() => setCreateRuleModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Create Rule
            </button>
          </div>

          {/* Filters Row */}
          <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
            {/* Tab Buttons */}
            <div className="flex gap-1">
              {(['overview', 'smart', 'active', 'acknowledged', 'resolved', 'all'] as TabValue[]).map((tab) => {
                const count = tab === 'all' ? stats.total : tab === 'overview' || tab === 'smart' ? null : stats[tab as keyof typeof stats];
                return (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={cn(
                      'px-3 py-1.5 text-[10px] font-bold uppercase transition-colors flex items-center gap-1',
                      selectedTab === tab
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                      tab === 'smart' && selectedTab !== 'smart' && 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                    )}
                  >
                    {tab === 'smart' && <BrainCircuit className="h-3 w-3" />}
                    {tab}
                    {tab === 'active' && stats.active > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-red-600 text-white text-[9px]">
                        {stats.active}
                      </span>
                    )}
                    {tab === 'smart' && (
                      <span className="ml-1 px-1.5 py-0.5 bg-violet-600 text-white text-[9px]">
                        AI
                      </span>
                    )}
                    {tab !== 'active' && tab !== 'overview' && tab !== 'smart' && (
                      <span className="ml-1 text-[9px] opacity-70">({count})</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-1 gap-2 sm:ml-auto">
              <div className="relative flex-1 sm:max-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                />
              </div>

              {/* Severity Filter */}
              <div className="relative">
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="h-8 px-3 pr-8 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
                >
                  <option value="all">All Severity</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
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
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {selectedTab === 'overview' ? (
            <div className="p-4 space-y-4">
              {/* Overview Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Alert Trend Chart */}
                <div className="lg:col-span-2 border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Alert Trend (7 Days)</span>
                  </div>
                  <div className="p-4 h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={alertTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#f8fafc',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="alerts"
                          name="New Alerts"
                          stroke="#ef4444"
                          fill="#fecaca"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="resolved"
                          name="Resolved"
                          stroke="#10b981"
                          fill="#a7f3d0"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Severity Distribution Pie */}
                <div className="border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <PieChartIcon className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">By Severity</span>
                  </div>
                  <div className="p-4 h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={severityDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {severityDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#f8fafc',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 -mt-2">
                      {severityDistribution.map((item) => (
                        <div key={item.name} className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5" style={{ backgroundColor: item.color }} />
                          <span className="text-[10px] text-slate-600">{item.name}: {item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Overview Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Alerts by Plant */}
                <div className="lg:col-span-2 border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Alerts by Plant</span>
                  </div>
                  <div className="p-4 h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={alertsByPlant} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          width={100}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#f8fafc',
                          }}
                        />
                        <Bar dataKey="critical" name="Critical" fill="#ef4444" stackId="a" />
                        <Bar dataKey="warning" name="Warning" fill="#f59e0b" stackId="a" />
                        <Bar dataKey="info" name="Info" fill="#3b82f6" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Status Distribution Pie */}
                <div className="border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <BarChart3 className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">By Status</span>
                  </div>
                  <div className="p-4 h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#f8fafc',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 -mt-2">
                      {statusDistribution.map((item) => (
                        <div key={item.name} className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5" style={{ backgroundColor: item.color }} />
                          <span className="text-[10px] text-slate-600">{item.name}: {item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Alert Types Row */}
              <div className="border-2 border-slate-300 bg-white overflow-hidden">
                <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-slate-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Alert Types Distribution</span>
                </div>
                <div className="p-4 h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={alertTypes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#f8fafc',
                        }}
                      />
                      <Bar dataKey="value" name="Count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : selectedTab === 'smart' ? (
            /* Smart Alarm Orchestration Tab */
            <div className="p-4 space-y-4">
              {/* Smart Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Correlated Groups */}
                <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-violet-500">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Correlated Groups</span>
                    <Link2 className="h-4 w-4 text-violet-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-violet-600" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                      {orchestrationStats.correlatedGroups}
                    </span>
                    <span className="text-[10px] text-slate-500">ROOT CAUSES IDENTIFIED</span>
                  </div>
                </div>

                {/* Suppressed Alerts */}
                <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-emerald-500">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Suppressed Alerts</span>
                    <BellOff className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-emerald-600" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                      {orchestrationStats.suppressedAlerts}
                    </span>
                    <span className="text-[10px] text-slate-500">{orchestrationStats.alertReduction}% REDUCTION</span>
                  </div>
                </div>

                {/* Avg Time to Root Cause */}
                <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-blue-500">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg Root Cause Time</span>
                    <Timer className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-blue-600" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                      {orchestrationStats.avgTimeToRootCause}m
                    </span>
                    <span className="text-[10px] text-slate-500">AI-ASSISTED</span>
                  </div>
                </div>

                {/* Operator Fatigue */}
                <div className={cn(
                  'border-2 border-slate-300 bg-white p-4',
                  fatigueMetrics.currentScore > 70 ? 'border-l-[3px] border-l-red-500' :
                  fatigueMetrics.currentScore > 50 ? 'border-l-[3px] border-l-amber-500' :
                  'border-l-[3px] border-l-emerald-500'
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Operator Fatigue</span>
                    <Gauge className={cn(
                      'h-4 w-4',
                      fatigueMetrics.currentScore > 70 ? 'text-red-600' :
                      fatigueMetrics.currentScore > 50 ? 'text-amber-600' : 'text-emerald-600'
                    )} />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={cn(
                      'text-2xl font-bold tracking-tight',
                      fatigueMetrics.currentScore > 70 ? 'text-red-600' :
                      fatigueMetrics.currentScore > 50 ? 'text-amber-600' : 'text-emerald-600'
                    )} style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                      {fatigueMetrics.currentScore}%
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {fatigueMetrics.currentScore > 70 ? 'HIGH LOAD' :
                       fatigueMetrics.currentScore > 50 ? 'MODERATE' : 'MANAGEABLE'}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all',
                        fatigueMetrics.currentScore > 70 ? 'bg-red-500' :
                        fatigueMetrics.currentScore > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      )}
                      style={{ width: `${fatigueMetrics.currentScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Correlated Alert Groups */}
                <div className="xl:col-span-2 border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-violet-100 px-3 py-2 border-b-2 border-slate-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="h-3.5 w-3.5 text-violet-700" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700">AI Root Cause Analysis</span>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 bg-violet-600 text-white font-bold">
                      {correlatedGroups.length} GROUPS
                    </span>
                  </div>
                  <div className="divide-y divide-slate-200 max-h-[500px] overflow-y-auto">
                    {correlatedGroups.map((group) => (
                      <div key={group.id} className="p-4">
                        {/* Group Header */}
                        <div
                          className="flex items-start justify-between cursor-pointer"
                          onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Target className={cn(
                                'h-4 w-4',
                                group.estimatedImpact === 'critical' ? 'text-red-600' :
                                group.estimatedImpact === 'high' ? 'text-amber-600' : 'text-blue-600'
                              )} />
                              <span className="text-sm font-semibold text-slate-800">{group.rootCause}</span>
                              <span className={cn(
                                'text-[9px] font-bold px-1.5 py-0.5',
                                group.estimatedImpact === 'critical' ? 'bg-red-100 text-red-700' :
                                group.estimatedImpact === 'high' ? 'bg-amber-100 text-amber-700' :
                                group.estimatedImpact === 'medium' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-700'
                              )}>
                                {group.estimatedImpact.toUpperCase()} IMPACT
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Link2 className="h-3 w-3" />
                                {group.alerts.length} linked alerts
                              </span>
                              <span className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                {group.confidence}% confidence
                              </span>
                              <span className="capitalize px-1.5 py-0.5 bg-slate-100 text-slate-600 font-medium">
                                {group.rootCauseType.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className={cn(
                            'h-5 w-5 text-slate-400 transition-transform',
                            expandedGroup === group.id && 'rotate-90'
                          )} />
                        </div>

                        {/* Expanded Content */}
                        {expandedGroup === group.id && (
                          <div className="mt-4 pl-6 space-y-3">
                            {/* Linked Alerts */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold uppercase text-slate-500">Linked Alerts</span>
                              {group.alerts.map((alert, idx) => (
                                <div key={alert.id} className="flex items-center gap-2 text-xs bg-slate-50 p-2 border border-slate-200">
                                  <span className={cn(
                                    'w-2 h-2 rounded-full',
                                    alert.severity === 'critical' ? 'bg-red-500' :
                                    alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                                  )} />
                                  <span className="font-medium text-slate-700">{alert.type}</span>
                                  <span className="text-slate-500">-</span>
                                  <span className="text-slate-600">{alert.sensorName}</span>
                                  <span className="ml-auto text-[10px] text-slate-400">{alert.duration}</span>
                                </div>
                              ))}
                            </div>

                            {/* Affected Systems */}
                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Affected Systems</span>
                              <div className="flex flex-wrap gap-1">
                                {group.affectedSystems.map((system) => (
                                  <span key={system} className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700">
                                    {system}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Suggested Action */}
                            <div className="bg-emerald-50 border border-emerald-200 p-3">
                              <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-1">AI Suggested Action</span>
                              <p className="text-xs text-emerald-800">{group.suggestedAction}</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  toast.success('Alerts acknowledged as group');
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Acknowledge All
                              </button>
                              <button
                                onClick={() => {
                                  toast.info('Suppressing similar alerts for 30 minutes');
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                              >
                                <BellOff className="h-3 w-3" />
                                Suppress Similar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column - Fatigue & Suppression */}
                <div className="space-y-4">
                  {/* Operator Fatigue Details */}
                  <div className="border-2 border-slate-300 bg-white overflow-hidden">
                    <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                      <Gauge className="h-3.5 w-3.5 text-slate-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Fatigue Analysis</span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-slate-50 border border-slate-200">
                          <div className="text-lg font-bold text-slate-700" style={{ fontFamily: 'ui-monospace, monospace' }}>
                            {fatigueMetrics.alertsLastHour}
                          </div>
                          <div className="text-[9px] uppercase text-slate-500">Last Hour</div>
                        </div>
                        <div className="text-center p-2 bg-slate-50 border border-slate-200">
                          <div className="text-lg font-bold text-slate-700" style={{ fontFamily: 'ui-monospace, monospace' }}>
                            {fatigueMetrics.alertsLastShift}
                          </div>
                          <div className="text-[9px] uppercase text-slate-500">This Shift</div>
                        </div>
                        <div className="text-center p-2 bg-slate-50 border border-slate-200">
                          <div className="text-lg font-bold text-slate-700" style={{ fontFamily: 'ui-monospace, monospace' }}>
                            {fatigueMetrics.avgAcknowledgeTime}m
                          </div>
                          <div className="text-[9px] uppercase text-slate-500">Avg Ack Time</div>
                        </div>
                        <div className="text-center p-2 bg-slate-50 border border-slate-200">
                          <div className={cn(
                            'text-lg font-bold',
                            fatigueMetrics.missedAlerts > 0 ? 'text-red-600' : 'text-emerald-600'
                          )} style={{ fontFamily: 'ui-monospace, monospace' }}>
                            {fatigueMetrics.missedAlerts}
                          </div>
                          <div className="text-[9px] uppercase text-slate-500">Missed</div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-600 bg-blue-50 border border-blue-200 p-2">
                        <BrainCircuit className="h-3 w-3 text-blue-600 inline mr-1" />
                        {fatigueMetrics.recommendation}
                      </div>
                    </div>
                  </div>

                  {/* Active Suppression Rules */}
                  <div className="border-2 border-slate-300 bg-white overflow-hidden">
                    <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldOff className="h-3.5 w-3.5 text-slate-600" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Suppression Rules</span>
                      </div>
                      <button className="text-[9px] px-2 py-0.5 bg-slate-700 text-white font-bold hover:bg-slate-800">
                        + ADD
                      </button>
                    </div>
                    <div className="divide-y divide-slate-200 max-h-[280px] overflow-y-auto">
                      {suppressionRules.map((rule) => (
                        <div key={rule.id} className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-slate-700">{rule.name}</span>
                            <span className={cn(
                              'text-[9px] font-bold px-1.5 py-0.5',
                              rule.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            )}>
                              {rule.active ? 'ACTIVE' : 'EXPIRED'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mb-2">{rule.condition}</p>
                          <div className="flex items-center justify-between text-[9px]">
                            <span className="text-slate-400">
                              {rule.suppressedCount} suppressed
                            </span>
                            {rule.expiresAt && rule.active && (
                              <span className="text-amber-600">
                                Expires in {Math.round((rule.expiresAt.getTime() - Date.now()) / 60000)}m
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* First-Out Analysis Panel */}
              <div className="border-2 border-slate-300 bg-white overflow-hidden">
                <div className="bg-amber-100 px-3 py-2 border-b-2 border-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Play className="h-3.5 w-3.5 text-amber-700" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">First-Out Analysis</span>
                  </div>
                  <span className="text-[9px] text-amber-700">Sequence of events leading to alarms</span>
                </div>
                <div className="p-4">
                  {/* Analysis Selector */}
                  <div className="flex gap-2 mb-4">
                    {firstOutAnalyses.map((analysis) => (
                      <button
                        key={analysis.id}
                        onClick={() => setSelectedFirstOut(selectedFirstOut?.id === analysis.id ? null : analysis)}
                        className={cn(
                          'px-3 py-2 text-xs font-medium border-2 transition-colors',
                          selectedFirstOut?.id === analysis.id
                            ? 'bg-amber-100 border-amber-500 text-amber-800'
                            : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
                        )}
                      >
                        <div className="font-semibold">{analysis.incident}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{analysis.duration} ago</div>
                      </button>
                    ))}
                  </div>

                  {/* Selected Analysis */}
                  {selectedFirstOut && (
                    <div className="space-y-4">
                      {/* Event Timeline */}
                      <div className="relative">
                        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200" />
                        <div className="space-y-3">
                          {selectedFirstOut.events.map((event, idx) => (
                            <div key={event.alertId} className="relative pl-8">
                              <div className={cn(
                                'absolute left-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2',
                                event.isRootCause
                                  ? 'bg-red-100 border-red-500 text-red-700'
                                  : 'bg-white border-slate-300 text-slate-600'
                              )}>
                                {event.sequence}
                              </div>
                              <div className={cn(
                                'p-3 border-2',
                                event.isRootCause ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'
                              )}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className={cn(
                                    'text-xs font-semibold',
                                    event.isRootCause ? 'text-red-700' : 'text-slate-700'
                                  )}>
                                    {event.alertType}
                                    {event.isRootCause && (
                                      <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-red-600 text-white">ROOT CAUSE</span>
                                    )}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {format(event.timestamp, 'HH:mm:ss')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-[10px]">
                                  <span className="text-slate-600">{event.sensorName}</span>
                                  <span className="font-mono text-slate-700">
                                    {event.value} {event.unit}
                                  </span>
                                  <span className={cn(
                                    'font-medium',
                                    event.isRootCause ? 'text-red-600' : 'text-amber-600'
                                  )}>
                                    {event.deviation}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI Analysis */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-slate-50 border border-slate-200 p-3">
                          <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                            <BrainCircuit className="h-3 w-3 inline mr-1" />
                            AI Analysis
                          </span>
                          <p className="text-xs text-slate-700">{selectedFirstOut.aiAnalysis}</p>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 p-3">
                          <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-1">
                            <Zap className="h-3 w-3 inline mr-1" />
                            Prevention Recommendation
                          </span>
                          <p className="text-xs text-emerald-800">{selectedFirstOut.preventionRecommendation}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!selectedFirstOut && (
                    <div className="text-center py-8 text-slate-400">
                      <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Select an incident above to view first-out analysis</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Alert Table */
            <AlertTable
              alerts={filteredAlerts}
              onViewAlert={handleViewAlert}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
            />
          )}
        </div>
      </div>

      {/* Alert Detail Modal */}
      <AlertModal
        alert={selectedAlert}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAcknowledge={handleAcknowledge}
        onResolve={handleResolve}
      />

      {/* Create Rule Modal */}
      <CreateRuleModal
        open={createRuleModalOpen}
        onClose={() => setCreateRuleModalOpen(false)}
        onSave={handleCreateRule}
      />
    </div>
  );
}
