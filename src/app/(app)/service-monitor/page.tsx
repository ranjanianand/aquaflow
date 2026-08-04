'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  Plus,
  User,
  MapPin,
  Calendar,
  Phone,
  Star,
  Timer,
  Target,
  ChevronDown,
  MoreVertical,
  Eye,
  UserPlus,
  X,
  FileText,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  Check,
} from 'lucide-react';
import {
  serviceTickets,
  technicians,
  getOpenTicketsCount,
  getCriticalTicketsCount,
  getAvgResolutionTime,
  getSLAComplianceRate,
  getAvailableTechnicians,
  getServiceTypeLabel,
  getStatusLabel,
  getPriorityLabel,
  type ServiceTicket,
  type Technician,
  type ServiceStatus,
  type ServicePriority,
  type ServiceType,
} from '@/data/mock-services';
import { mockPlants } from '@/data/mock-plants';
import { format, formatDistanceToNow, subDays } from 'date-fns';
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
} from 'recharts';
import { toast } from 'sonner';

// Industrial-styled action menu component
function ActionMenu({
  ticket,
  onView,
}: {
  ticket: ServiceTicket;
  onView: (ticket: ServiceTicket) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 hover:bg-slate-200 transition-colors"
        title="Actions"
      >
        <MoreVertical className="h-4 w-4 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] border-2 border-slate-300 bg-white shadow-lg">
          <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Actions</span>
          </div>
          <div className="py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(ticket);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              View Details
            </button>
            {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5 text-slate-500" />
                Assign Technician
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type TabValue = 'overview' | 'tickets' | 'technicians' | 'schedule';

export default function ServiceMonitorPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [selectedTab, setSelectedTab] = useState<TabValue>('overview');

  // Modal states
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [updateStatusOpen, setUpdateStatusOpen] = useState(false);
  const [assignTechOpen, setAssignTechOpen] = useState(false);

  // Form state for new ticket
  const [newTicket, setNewTicket] = useState({
    plantId: '',
    assetName: '',
    type: 'breakdown' as ServiceType,
    priority: 'medium' as ServicePriority,
    subject: '',
    description: '',
    reportedBy: '',
    estimatedHours: 2,
  });

  const filteredTickets = serviceTickets.filter(ticket => {
    const matchesSearch =
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.plantName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Chart data calculations
  const statusDistribution = useMemo(() => {
    const counts = { open: 0, in_progress: 0, on_hold: 0, resolved: 0, closed: 0 };
    serviceTickets.forEach(t => counts[t.status]++);
    return [
      { name: 'Open', value: counts.open, color: '#3b82f6' },
      { name: 'In Progress', value: counts.in_progress, color: '#f59e0b' },
      { name: 'On Hold', value: counts.on_hold, color: '#f97316' },
      { name: 'Resolved', value: counts.resolved, color: '#10b981' },
      { name: 'Closed', value: counts.closed, color: '#64748b' },
    ].filter(d => d.value > 0);
  }, []);

  const priorityDistribution = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    serviceTickets.filter(t => t.status !== 'closed').forEach(t => counts[t.priority]++);
    return [
      { name: 'Critical', value: counts.critical, color: '#ef4444' },
      { name: 'High', value: counts.high, color: '#f97316' },
      { name: 'Medium', value: counts.medium, color: '#f59e0b' },
      { name: 'Low', value: counts.low, color: '#3b82f6' },
    ].filter(d => d.value > 0);
  }, []);

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    serviceTickets.forEach(t => {
      counts[t.type] = (counts[t.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      name: getServiceTypeLabel(type as ServiceType),
      count,
    }));
  }, []);

  const technicianWorkload = useMemo(() => {
    return technicians.map(tech => ({
      name: tech.name.split(' ')[0],
      completed: tech.completedTickets,
      rating: tech.avgRating,
      status: tech.status,
    }));
  }, []);

  // Generate mock trend data (last 7 days)
  const trendData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, 'MMM d'),
        opened: Math.floor(Math.random() * 4) + 1,
        resolved: Math.floor(Math.random() * 3) + 1,
      };
    });
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-amber-100 text-amber-700';
      case 'on_hold': return 'bg-orange-100 text-orange-700';
      case 'resolved': return 'bg-emerald-100 text-emerald-700';
      case 'closed': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getRowBorderColor = (status: string, priority: string) => {
    if (status === 'open' || status === 'in_progress') {
      if (priority === 'critical') return 'border-l-[3px] border-l-red-500';
      if (priority === 'high') return 'border-l-[3px] border-l-orange-500';
      return 'border-l-[3px] border-l-blue-500';
    }
    if (status === 'resolved') return 'border-l-[3px] border-l-emerald-500';
    if (status === 'closed') return 'border-l-[3px] border-l-slate-400';
    return 'border-l-[3px] border-l-amber-400';
  };

  const getTechnicianStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500';
      case 'on_job': return 'bg-amber-500';
      case 'off_duty': return 'bg-slate-400';
      default: return 'bg-slate-400';
    }
  };

  const openTickets = getOpenTicketsCount();
  const criticalTickets = getCriticalTicketsCount();
  const avgResolution = getAvgResolutionTime();
  const slaCompliance = getSLAComplianceRate();

  // Handle create ticket
  const handleCreateTicket = () => {
    if (!newTicket.plantId || !newTicket.subject || !newTicket.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    toast.success('Ticket created successfully', {
      description: `New ${newTicket.priority} priority ${newTicket.type} ticket has been created.`,
    });
    setCreateTicketOpen(false);
    setNewTicket({
      plantId: '',
      assetName: '',
      type: 'breakdown',
      priority: 'medium',
      subject: '',
      description: '',
      reportedBy: '',
      estimatedHours: 2,
    });
  };

  // Handle update status
  const handleUpdateStatus = (newStatus: ServiceStatus) => {
    if (selectedTicket) {
      toast.success('Status updated', {
        description: `Ticket ${selectedTicket.ticketNumber} status changed to ${getStatusLabel(newStatus)}.`,
      });
      setUpdateStatusOpen(false);
    }
  };

  // Handle assign technician
  const handleAssignTechnician = (tech: Technician) => {
    if (selectedTicket) {
      toast.success('Technician assigned', {
        description: `${tech.name} has been assigned to ${selectedTicket.ticketNumber}.`,
      });
      setAssignTechOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Industrial Header Bar */}
      <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Wrench className="h-4 w-4 text-white" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Service Monitor</span>
          <span className="text-[10px] text-slate-400">Track service tickets and technician assignments</span>
        </div>
        <div className="flex items-center gap-3">
          {criticalTickets > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-red-600 text-white text-[10px] font-bold">
              <AlertTriangle className="h-3 w-3" />
              {criticalTickets} CRITICAL
            </span>
          )}
          {openTickets > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-blue-600 text-white text-[10px] font-bold">
              {openTickets} OPEN
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {/* Industrial Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Open Tickets */}
          <div className={cn(
            'border-2 border-slate-300 bg-white p-4',
            openTickets > 0 && 'border-l-[3px] border-l-blue-500'
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Open Tickets</span>
              <Wrench className={cn('h-4 w-4', openTickets > 0 ? 'text-blue-600' : 'text-slate-400')} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                'text-2xl font-bold tracking-tight',
                openTickets > 0 ? 'text-blue-600' : 'text-slate-700'
              )} style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>{openTickets}</span>
              <span className="text-[10px] text-slate-500">REQUIRES ATTENTION</span>
            </div>
          </div>

          {/* Critical Issues */}
          <div className={cn(
            'border-2 border-slate-300 bg-white p-4',
            criticalTickets > 0 && 'border-l-[3px] border-l-red-500'
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Critical Issues</span>
              <AlertTriangle className={cn('h-4 w-4', criticalTickets > 0 ? 'text-red-600' : 'text-slate-400')} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                'text-2xl font-bold tracking-tight',
                criticalTickets > 0 ? 'text-red-600' : 'text-slate-700'
              )} style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>{criticalTickets}</span>
              <span className="text-[10px] text-slate-500">
                {criticalTickets > 0 ? 'IMMEDIATE ACTION' : 'ALL CLEAR'}
              </span>
            </div>
          </div>

          {/* Avg Resolution */}
          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg Resolution</span>
              <Clock className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-purple-600" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>{avgResolution.toFixed(1)}h</span>
              <span className="text-[10px] text-slate-500">THIS MONTH</span>
            </div>
          </div>

          {/* SLA Compliance */}
          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-emerald-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">SLA Compliance</span>
              <Target className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-emerald-600" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>{slaCompliance}%</span>
              <span className="text-[10px] text-slate-500">ON TARGET</span>
            </div>
            <div className="mt-2 h-1.5 bg-slate-200 overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${slaCompliance}%` }} />
            </div>
          </div>
        </div>

        {/* Service Management Panel */}
        <div className="border-2 border-slate-300 bg-white overflow-hidden">
          {/* Panel Header with Tabs */}
          <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center justify-between">
            <div className="flex gap-1">
              {(['overview', 'tickets', 'technicians', 'schedule'] as TabValue[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={cn(
                    'px-3 py-1.5 text-[10px] font-bold uppercase transition-colors',
                    selectedTab === tab
                      ? 'bg-slate-700 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-300'
                  )}
                >
                  {tab === 'overview' ? 'Overview' : tab === 'tickets' ? 'Service Tickets' : tab === 'technicians' ? 'Technicians' : 'Schedule'}
                </button>
              ))}
            </div>
            {(selectedTab === 'tickets' || selectedTab === 'overview') && (
              <button
                onClick={() => setCreateTicketOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
              >
                <Plus className="h-3 w-3" />
                New Ticket
              </button>
            )}
          </div>

          {/* Overview Tab - Visualizations */}
          {selectedTab === 'overview' && (
            <div className="p-4 space-y-4">
              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Ticket Trend Chart */}
                <div className="border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Ticket Trend (7 Days)</span>
                  </div>
                  <div className="p-3">
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" fontSize={10} tick={{ fill: '#64748b' }} />
                          <YAxis fontSize={10} tick={{ fill: '#64748b' }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: 0,
                              fontSize: 11,
                              color: '#fff'
                            }}
                          />
                          <Line type="monotone" dataKey="opened" stroke="#3b82f6" strokeWidth={2} name="Opened" dot={{ fill: '#3b82f6', r: 3 }} />
                          <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" dot={{ fill: '#10b981', r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-4 bg-blue-500" />
                        <span className="text-[10px] text-slate-500">Opened</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-4 bg-emerald-500" />
                        <span className="text-[10px] text-slate-500">Resolved</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Distribution */}
                <div className="border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <PieChartIcon className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Status Distribution</span>
                  </div>
                  <div className="p-3">
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={65}
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
                              borderRadius: 0,
                              fontSize: 11,
                              color: '#fff'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                      {statusDistribution.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-1">
                          <div className="h-2 w-2" style={{ backgroundColor: entry.color }} />
                          <span className="text-[9px] text-slate-500">{entry.name} ({entry.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Priority Distribution */}
                <div className="border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Priority Breakdown</span>
                  </div>
                  <div className="p-3">
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={priorityDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={65}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {priorityDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: 0,
                              fontSize: 11,
                              color: '#fff'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                      {priorityDistribution.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-1">
                          <div className="h-2 w-2" style={{ backgroundColor: entry.color }} />
                          <span className="text-[9px] text-slate-500">{entry.name} ({entry.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Service Type Distribution */}
                <div className="border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Tickets by Service Type</span>
                  </div>
                  <div className="p-3">
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={typeDistribution} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis type="number" fontSize={10} tick={{ fill: '#64748b' }} />
                          <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} width={80} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: 0,
                              fontSize: 11,
                              color: '#fff'
                            }}
                          />
                          <Bar dataKey="count" fill="#6366f1" name="Tickets" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Technician Workload */}
                <div className="border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Technician Performance</span>
                  </div>
                  <div className="p-3">
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={technicianWorkload}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} />
                          <YAxis fontSize={10} tick={{ fill: '#64748b' }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: 0,
                              fontSize: 11,
                              color: '#fff'
                            }}
                          />
                          <Bar dataKey="completed" fill="#10b981" name="Completed Tickets" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tickets Tab Content */}
          {selectedTab === 'tickets' && (
            <>
              {/* Filters Row */}
              <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 sm:max-w-[250px]">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                  />
                </div>

                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-8 px-3 pr-8 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="h-8 px-3 pr-8 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
                  >
                    <option value="all">All Priority</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Tickets Table */}
              <div className="border-t border-slate-200">
                {/* Table Header */}
                <div className="bg-slate-100 border-b-2 border-slate-300 grid grid-cols-[100px_1fr_1fr_90px_80px_80px_100px_80px_60px] gap-2 px-4 py-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ticket #</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Subject</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Plant / Asset</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Type</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Priority</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assigned</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">SLA</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</span>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-slate-200 max-h-[400px] overflow-y-auto">
                  {filteredTickets.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-400">
                      <Wrench className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No tickets found</p>
                    </div>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className={cn(
                          'grid grid-cols-[100px_1fr_1fr_90px_80px_80px_100px_80px_60px] gap-2 px-4 py-3 items-center',
                          'hover:bg-slate-50 cursor-pointer transition-colors',
                          getRowBorderColor(ticket.status, ticket.priority)
                        )}
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <span className="text-sm font-mono text-slate-600">{ticket.ticketNumber}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{ticket.subject}</p>
                          <p className="text-[10px] text-slate-400">
                            {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{ticket.plantName}</p>
                          <p className="text-[10px] text-slate-400 truncate">{ticket.assetName}</p>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 w-fit">
                          {getServiceTypeLabel(ticket.type)}
                        </span>
                        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 w-fit', getPriorityColor(ticket.priority))}>
                          {getPriorityLabel(ticket.priority)}
                        </span>
                        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 w-fit', getStatusColor(ticket.status))}>
                          {getStatusLabel(ticket.status)}
                        </span>
                        <span className="text-[11px] text-slate-600 truncate">
                          {ticket.assignedTo || <span className="text-slate-400">Unassigned</span>}
                        </span>
                        <div>
                          {ticket.slaBreached ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700">BREACHED</span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">
                              {format(new Date(ticket.slaDeadline), 'MMM d')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                          <ActionMenu ticket={ticket} onView={setSelectedTicket} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* Technicians Tab Content */}
          {selectedTab === 'technicians' && (
            <div className="p-4 space-y-4">
              {/* Availability Summary */}
              <div className="border-2 border-slate-300 bg-slate-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Technician Availability</div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-emerald-500" />
                    <span className="text-sm font-medium">Available: {getAvailableTechnicians().length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-amber-500" />
                    <span className="text-sm font-medium">On Job: {technicians.filter(t => t.status === 'on_job').length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-slate-400" />
                    <span className="text-sm font-medium">Off Duty: {technicians.filter(t => t.status === 'off_duty').length}</span>
                  </div>
                </div>
              </div>

              {/* Technicians Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {technicians.map((tech) => (
                  <div
                    key={tech.id}
                    className={cn(
                      'border-2 border-slate-300 bg-white p-4 cursor-pointer hover:bg-slate-50 transition-colors',
                      tech.status === 'available' && 'border-l-[3px] border-l-emerald-500',
                      tech.status === 'on_job' && 'border-l-[3px] border-l-amber-500',
                      tech.status === 'off_duty' && 'border-l-[3px] border-l-slate-400'
                    )}
                    onClick={() => setSelectedTechnician(tech)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="h-10 w-10 bg-slate-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-slate-500" />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 h-3 w-3 border-2 border-white ${getTechnicianStatusColor(tech.status)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-700">{tech.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {tech.specialization.join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Status</span>
                        <span className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5',
                          tech.status === 'available' && 'bg-emerald-100 text-emerald-700',
                          tech.status === 'on_job' && 'bg-amber-100 text-amber-700',
                          tech.status === 'off_duty' && 'bg-slate-100 text-slate-600'
                        )}>
                          {tech.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Completed</span>
                        <span className="font-medium text-slate-700">{tech.completedTickets} tickets</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Rating</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          <span className="font-medium text-slate-700">{tech.avgRating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Schedule Tab Content */}
          {selectedTab === 'schedule' && (
            <div className="p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Upcoming Scheduled Services</div>
              <div className="space-y-3">
                {serviceTickets
                  .filter(t => t.scheduledDate && new Date(t.scheduledDate) >= new Date())
                  .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
                  .map((ticket) => (
                    <div key={ticket.id} className={cn(
                      'border-2 border-slate-300 bg-white p-3 flex items-center gap-4',
                      getRowBorderColor(ticket.status, ticket.priority)
                    )}>
                      <div className="h-10 w-10 bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-700 truncate">{ticket.subject}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span>{ticket.plantName}</span>
                          <span>|</span>
                          <span>{ticket.assignedTo || 'Unassigned'}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-medium text-sm text-slate-700">{format(new Date(ticket.scheduledDate!), 'MMM d, yyyy')}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{format(new Date(ticket.scheduledDate!), 'HH:mm')}</p>
                      </div>
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 flex-shrink-0', getPriorityColor(ticket.priority))}>
                        {getPriorityLabel(ticket.priority)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      <Dialog open={createTicketOpen} onOpenChange={setCreateTicketOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 border-2 border-slate-300 rounded-none" showCloseButton={false}>
          <DialogHeader className="bg-slate-100 px-4 py-3 border-b-2 border-slate-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center border-2 border-slate-300 bg-white">
                  <FileText className="h-4 w-4 text-slate-600" />
                </div>
                <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Create New Ticket
                </DialogTitle>
              </div>
              <button onClick={() => setCreateTicketOpen(false)} className="p-1 hover:bg-slate-200 transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </DialogHeader>
          <div className="p-4 space-y-4">
            {/* Plant Selection */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Plant *</label>
              <div className="relative">
                <select
                  value={newTicket.plantId}
                  onChange={(e) => setNewTicket({ ...newTicket, plantId: e.target.value })}
                  className="w-full h-9 px-3 pr-8 text-sm border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
                >
                  <option value="">Select Plant</option>
                  {mockPlants.map(plant => (
                    <option key={plant.id} value={plant.id}>{plant.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Asset Name */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Asset Name</label>
              <input
                type="text"
                value={newTicket.assetName}
                onChange={(e) => setNewTicket({ ...newTicket, assetName: e.target.value })}
                placeholder="e.g., RO Unit #1, Pump #3"
                className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
              />
            </div>

            {/* Type and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Service Type *</label>
                <div className="relative">
                  <select
                    value={newTicket.type}
                    onChange={(e) => setNewTicket({ ...newTicket, type: e.target.value as ServiceType })}
                    className="w-full h-9 px-3 pr-8 text-sm border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
                  >
                    <option value="breakdown">Breakdown</option>
                    <option value="preventive">Preventive</option>
                    <option value="corrective">Corrective</option>
                    <option value="installation">Installation</option>
                    <option value="inspection">Inspection</option>
                    <option value="calibration">Calibration</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Priority *</label>
                <div className="relative">
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as ServicePriority })}
                    className="w-full h-9 px-3 pr-8 text-sm border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Subject *</label>
              <input
                type="text"
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                placeholder="Brief description of the issue"
                className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Description *</label>
              <textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder="Detailed description of the issue..."
                rows={3}
                className="w-full px-3 py-2 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500 resize-none"
              />
            </div>

            {/* Reported By and Estimated Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Reported By</label>
                <input
                  type="text"
                  value={newTicket.reportedBy}
                  onChange={(e) => setNewTicket({ ...newTicket, reportedBy: e.target.value })}
                  placeholder="Your name"
                  className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Est. Hours</label>
                <input
                  type="number"
                  value={newTicket.estimatedHours}
                  onChange={(e) => setNewTicket({ ...newTicket, estimatedHours: parseInt(e.target.value) || 0 })}
                  min={1}
                  className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-slate-100 border-t-2 border-slate-300 flex items-center justify-end gap-2">
            <button
              onClick={() => setCreateTicketOpen(false)}
              className="px-4 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTicket}
              className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Ticket
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Modal */}
      <Dialog open={!!selectedTicket && !updateStatusOpen && !assignTechOpen} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-2 border-slate-300 rounded-none" showCloseButton={false}>
          <DialogHeader className="bg-slate-100 px-4 py-3 border-b-2 border-slate-300">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center border-2 border-slate-300 bg-white">
                <Wrench className="h-4 w-4 text-slate-600" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-sm font-bold text-slate-700">
                  {selectedTicket?.ticketNumber}
                </DialogTitle>
                <p className="text-[11px] text-slate-500 mt-0.5">{selectedTicket?.subject}</p>
              </div>
              <span className={cn('px-2 py-1 text-[9px] font-bold uppercase', getPriorityColor(selectedTicket?.priority || 'low'))}>
                {selectedTicket && getPriorityLabel(selectedTicket.priority)}
              </span>
            </div>
          </DialogHeader>
          {selectedTicket && (
            <div className="bg-white">
              <div className="px-4 py-4 border-b border-slate-200">
                <p className="text-sm text-slate-600">{selectedTicket.description}</p>
              </div>

              <div className="px-4 py-4 border-b border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Ticket Details</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] uppercase text-slate-500">Location</p>
                      <p className="text-sm font-medium text-slate-700">{selectedTicket.plantName}</p>
                      <p className="text-[10px] text-slate-500">{selectedTicket.assetName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] uppercase text-slate-500">Reported By</p>
                      <p className="text-sm font-medium text-slate-700">{selectedTicket.reportedBy}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] uppercase text-slate-500">Created</p>
                      <p className="text-sm font-mono text-slate-700">{format(new Date(selectedTicket.createdAt), 'MMM d, yyyy HH:mm')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Timer className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] uppercase text-slate-500">Estimated</p>
                      <p className="text-sm font-mono text-slate-700">{selectedTicket.estimatedHours}h</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Assignment */}
              <div className="px-4 py-4 border-b border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Current Assignment</div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{selectedTicket.assignedTo || 'Not Assigned'}</p>
                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5', getStatusColor(selectedTicket.status))}>
                      {getStatusLabel(selectedTicket.status)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedTicket.notes.length > 0 && (
                <div className="px-4 py-4 border-b border-slate-200">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Activity Log</div>
                  <div className="space-y-3">
                    {selectedTicket.notes.map((note) => (
                      <div key={note.id} className="border-l-2 border-slate-300 pl-3 py-1">
                        <p className="text-sm text-slate-600">{note.content}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {note.author} - {format(new Date(note.timestamp), 'MMM d, HH:mm')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTicket.partsUsed.length > 0 && (
                <div className="px-4 py-4 border-b border-slate-200">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Parts Used</div>
                  <div className="border-2 border-slate-300">
                    <div className="bg-slate-100 grid grid-cols-3 gap-2 px-3 py-2 border-b border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Part</span>
                      <span className="text-[10px] font-bold uppercase text-slate-500">Qty</span>
                      <span className="text-[10px] font-bold uppercase text-slate-500 text-right">Cost</span>
                    </div>
                    {selectedTicket.partsUsed.map((part) => (
                      <div key={part.partId} className="grid grid-cols-3 gap-2 px-3 py-2 border-b border-slate-100 last:border-0">
                        <span className="text-sm text-slate-700">{part.partName}</span>
                        <span className="text-sm text-slate-700">{part.quantity}</span>
                        <span className="text-sm text-slate-700 text-right font-mono">
                          {(part.quantity * part.unitCost).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-4 py-3 bg-slate-100 border-t-2 border-slate-300 flex items-center justify-end gap-2">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Close
                </button>
                {selectedTicket.status !== 'closed' && (
                  <>
                    <button
                      onClick={() => setUpdateStatusOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Update Status
                    </button>
                    <button
                      onClick={() => setAssignTechOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Assign
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Modal */}
      <Dialog open={updateStatusOpen} onOpenChange={setUpdateStatusOpen}>
        <DialogContent className="max-w-sm p-0 gap-0 border-2 border-slate-300 rounded-none" showCloseButton={false}>
          <DialogHeader className="bg-slate-100 px-4 py-3 border-b-2 border-slate-300">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Update Status
              </DialogTitle>
              <button onClick={() => setUpdateStatusOpen(false)} className="p-1 hover:bg-slate-200 transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </DialogHeader>
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
              Select new status for {selectedTicket?.ticketNumber}
            </p>
            <div className="space-y-2">
              {(['open', 'in_progress', 'on_hold', 'resolved', 'closed'] as ServiceStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(status)}
                  disabled={selectedTicket?.status === status}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium border-2 transition-colors',
                    selectedTicket?.status === status
                      ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer'
                  )}
                >
                  <span>{getStatusLabel(status)}</span>
                  {selectedTicket?.status === status && (
                    <span className="text-[9px] font-bold bg-slate-200 text-slate-500 px-1.5 py-0.5">CURRENT</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Technician Modal */}
      <Dialog open={assignTechOpen} onOpenChange={setAssignTechOpen}>
        <DialogContent className="max-w-md p-0 gap-0 border-2 border-slate-300 rounded-none" showCloseButton={false}>
          <DialogHeader className="bg-slate-100 px-4 py-3 border-b-2 border-slate-300">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Assign Technician
              </DialogTitle>
              <button onClick={() => setAssignTechOpen(false)} className="p-1 hover:bg-slate-200 transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </DialogHeader>
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
              Select technician for {selectedTicket?.ticketNumber}
            </p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {technicians.map((tech) => (
                <button
                  key={tech.id}
                  onClick={() => handleAssignTechnician(tech)}
                  disabled={tech.status === 'off_duty'}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 border-2 transition-colors',
                    tech.status === 'off_duty'
                      ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                      : 'border-slate-300 bg-white hover:bg-slate-50 cursor-pointer',
                    selectedTicket?.assignedTechnicianId === tech.id && 'border-blue-500 bg-blue-50'
                  )}
                >
                  <div className="relative">
                    <div className="h-10 w-10 bg-slate-200 flex items-center justify-center">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 h-3 w-3 border-2 border-white ${getTechnicianStatusColor(tech.status)}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-700">{tech.name}</p>
                    <p className="text-[10px] text-slate-500">{tech.specialization.slice(0, 2).join(', ')}</p>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5',
                      tech.status === 'available' && 'bg-emerald-100 text-emerald-700',
                      tech.status === 'on_job' && 'bg-amber-100 text-amber-700',
                      tech.status === 'off_duty' && 'bg-slate-100 text-slate-500'
                    )}>
                      {tech.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="text-[10px] text-slate-600">{tech.avgRating}</span>
                    </div>
                  </div>
                  {selectedTicket?.assignedTechnicianId === tech.id && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Technician Detail Modal */}
      <Dialog open={!!selectedTechnician} onOpenChange={() => setSelectedTechnician(null)}>
        <DialogContent className="p-0 gap-0 border-2 border-slate-300 rounded-none" showCloseButton={false}>
          <DialogHeader className="bg-slate-100 px-4 py-3 border-b-2 border-slate-300">
            <DialogTitle className="text-sm font-bold text-slate-700">Technician Details</DialogTitle>
          </DialogHeader>
          {selectedTechnician && (
            <div className="bg-white">
              <div className="px-4 py-4 border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-slate-200 flex items-center justify-center">
                    <User className="h-7 w-7 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-700">{selectedTechnician.name}</h3>
                    <p className="text-sm text-slate-500">{selectedTechnician.email}</p>
                  </div>
                </div>
              </div>

              <div className="px-4 py-4 border-b border-slate-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{selectedTechnician.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-slate-400" />
                    <span>{selectedTechnician.completedTickets} completed</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span>{selectedTechnician.avgRating} rating</span>
                  </div>
                  <span className={cn(
                    'text-[9px] font-bold px-2 py-1 w-fit',
                    selectedTechnician.status === 'available' && 'bg-emerald-100 text-emerald-700',
                    selectedTechnician.status === 'on_job' && 'bg-amber-100 text-amber-700',
                    selectedTechnician.status === 'off_duty' && 'bg-slate-100 text-slate-600'
                  )}>
                    {selectedTechnician.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="px-4 py-4 border-b border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Specializations</div>
                <div className="flex flex-wrap gap-2">
                  {selectedTechnician.specialization.map((spec) => (
                    <span key={spec} className="text-[10px] font-medium px-2 py-1 bg-slate-100 text-slate-600 border border-slate-200">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {selectedTechnician.currentTicketId && (
                <div className="px-4 py-3 bg-amber-50 border-l-[3px] border-l-amber-500">
                  <p className="text-[10px] font-bold uppercase text-amber-700">Currently Working On</p>
                  <p className="text-sm text-amber-600 font-mono">{selectedTechnician.currentTicketId}</p>
                </div>
              )}

              {/* Footer */}
              <div className="px-4 py-3 bg-slate-100 border-t-2 border-slate-300 flex items-center justify-end">
                <button
                  onClick={() => setSelectedTechnician(null)}
                  className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Close
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
