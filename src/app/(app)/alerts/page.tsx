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

type TabValue = 'overview' | 'active' | 'acknowledged' | 'resolved' | 'all';

export default function AlertsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<TabValue>('overview');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createRuleModalOpen, setCreateRuleModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [plantFilter, setPlantFilter] = useState<string>('all');

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
              {(['overview', 'active', 'acknowledged', 'resolved', 'all'] as TabValue[]).map((tab) => {
                const count = tab === 'all' ? stats.total : tab === 'overview' ? null : stats[tab as keyof typeof stats];
                return (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={cn(
                      'px-3 py-1.5 text-[10px] font-bold uppercase transition-colors',
                      selectedTab === tab
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {tab}
                    {tab === 'active' && stats.active > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-red-600 text-white text-[9px]">
                        {stats.active}
                      </span>
                    )}
                    {tab !== 'active' && tab !== 'overview' && (
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
