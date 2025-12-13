'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Plus,
  Search,
  Send,
  Eye,
  Edit,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  BarChart3,
  Download,
  Mail,
  Paperclip,
  X,
  Filter,
  MoreVertical,
  Activity,
  PieChart as PieChartIcon,
  Users,
  Target,
} from 'lucide-react';
import {
  proposals,
  proposalTemplates,
  getProposalsByStatus,
  getDraftProposals,
  getPendingProposals,
  getAcceptedProposals,
  getTotalPipelineValue,
  getConversionRate,
  getAvgProposalValue,
  getProposalTypeLabel,
  getStatusLabel,
  getMonthlyProposals,
  type Proposal,
  type ProposalTemplate,
} from '@/data/mock-proposals';
import { format, formatDistanceToNow } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

type TabType = 'overview' | 'all' | 'drafts' | 'pending' | 'templates';

export default function ProposalBuilderPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showNewProposal, setShowNewProposal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch =
      proposal.proposalNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    const matchesType = typeFilter === 'all' || proposal.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-700';
      case 'pending_review': return 'bg-amber-100 text-amber-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-purple-100 text-purple-800';
      case 'accepted': return 'bg-emerald-100 text-emerald-800';
      case 'rejected': return 'bg-rose-100 text-rose-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'new_project': return 'bg-blue-600 text-white';
      case 'amc': return 'bg-emerald-600 text-white';
      case 'upgrade': return 'bg-purple-600 text-white';
      case 'consumables': return 'bg-orange-600 text-white';
      case 'service': return 'bg-cyan-600 text-white';
      default: return 'bg-slate-600 text-white';
    }
  };

  const monthlyData = getMonthlyProposals();

  // Proposal type distribution for pie chart
  const typeDistribution = [
    { name: 'New Project', value: proposals.filter(p => p.type === 'new_project').length },
    { name: 'AMC', value: proposals.filter(p => p.type === 'amc').length },
    { name: 'Upgrade', value: proposals.filter(p => p.type === 'upgrade').length },
    { name: 'Consumables', value: proposals.filter(p => p.type === 'consumables').length },
    { name: 'Service', value: proposals.filter(p => p.type === 'service').length },
  ].filter(d => d.value > 0);

  // Value by type for bar chart
  const valueByType = [
    { name: 'New Project', value: proposals.filter(p => p.type === 'new_project').reduce((sum, p) => sum + p.total, 0) },
    { name: 'AMC', value: proposals.filter(p => p.type === 'amc').reduce((sum, p) => sum + p.total, 0) },
    { name: 'Upgrade', value: proposals.filter(p => p.type === 'upgrade').reduce((sum, p) => sum + p.total, 0) },
    { name: 'Service', value: proposals.filter(p => p.type === 'service').reduce((sum, p) => sum + p.total, 0) },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4'];

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity className="h-3.5 w-3.5" /> },
    { id: 'all', label: 'All Proposals', icon: <FileText className="h-3.5 w-3.5" /> },
    { id: 'drafts', label: 'Drafts', icon: <Edit className="h-3.5 w-3.5" /> },
    { id: 'pending', label: 'Pending', icon: <Clock className="h-3.5 w-3.5" /> },
    { id: 'templates', label: 'Templates', icon: <Copy className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Industrial Header */}
      <header className="bg-slate-800 px-4 py-2.5 flex items-center">
        <div className="flex items-center gap-4">
          <FileText className="h-4 w-4 text-white" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Proposal Builder</span>
          <span className="text-[10px] text-slate-400">Quotes, proposals & estimates</span>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* KPI Stats Cards - Always visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-blue-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Proposals</span>
              <FileText className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-blue-600">{proposals.length}</span>
              <span className="text-[10px] text-slate-500">all time</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-emerald-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pipeline Value</span>
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono text-emerald-600">
                {(getTotalPipelineValue() / 100000).toFixed(1)}L
              </span>
              <span className="text-[10px] text-slate-500">active</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-green-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Conversion Rate</span>
              <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-green-600">{getConversionRate()}%</span>
            </div>
            <div className="mt-1 h-1.5 bg-slate-200 w-full">
              <div className="h-full bg-green-500" style={{ width: `${getConversionRate()}%` }} />
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-amber-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending Review</span>
              <Clock className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-amber-600">
                {getProposalsByStatus('pending_review').length}
              </span>
              <span className="text-[10px] text-slate-500">awaiting</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-purple-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg Value</span>
              <BarChart3 className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono text-purple-600">
                {(getAvgProposalValue() / 100000).toFixed(1)}L
              </span>
              <span className="text-[10px] text-slate-500">per proposal</span>
            </div>
          </div>
        </div>

        {/* Full-width Tabs Container */}
        <div className="border-2 border-slate-300 bg-white overflow-hidden">
          {/* Tab Navigation */}
          <div className="bg-slate-100 px-2 py-1.5 border-b-2 border-slate-300 flex items-center justify-between">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    activeTab === tab.id
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowNewProposal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-3 w-3" />
              New Proposal
            </button>
          </div>

          {/* Overview Tab Content - Charts */}
          {activeTab === 'overview' && (
            <div className="p-4 space-y-4">
              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Monthly Performance Chart */}
                <div className="border-2 border-slate-200 bg-white overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-slate-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Monthly Performance</span>
                  </div>
                  <div className="p-4">
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="month" fontSize={10} tick={{ fill: '#64748b' }} />
                          <YAxis yAxisId="left" fontSize={10} tick={{ fill: '#64748b' }} />
                          <YAxis yAxisId="right" orientation="right" fontSize={10} tick={{ fill: '#64748b' }} tickFormatter={(v) => `${v / 100000}L`} />
                          <Tooltip
                            contentStyle={{
                              border: '2px solid #cbd5e1',
                              borderRadius: 0,
                              fontSize: '12px',
                              fontFamily: 'monospace'
                            }}
                            formatter={(value: number, name: string) =>
                              name === 'value'
                                ? value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
                                : value
                            }
                          />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                          <Bar yAxisId="left" dataKey="sent" fill="#3b82f6" name="Sent" />
                          <Bar yAxisId="left" dataKey="accepted" fill="#10b981" name="Accepted" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Type Distribution Pie Chart */}
                <div className="border-2 border-slate-200 bg-white overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-slate-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Proposals by Type</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-6">
                      <div className="h-[180px] w-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={typeDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={75}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {typeDistribution.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-2">
                        {typeDistribution.map((item, index) => (
                          <div key={item.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span className="text-slate-600">{item.name}</span>
                            </div>
                            <span className="font-bold font-mono text-slate-800">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pipeline by Status */}
                <div className="border-2 border-slate-200 bg-white overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center gap-2">
                    <Target className="h-4 w-4 text-slate-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Pipeline by Status</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      { status: 'draft', label: 'Draft', count: getDraftProposals().length, color: 'bg-slate-500' },
                      { status: 'pending_review', label: 'Pending Review', count: getProposalsByStatus('pending_review').length, color: 'bg-amber-500' },
                      { status: 'sent', label: 'Sent', count: getProposalsByStatus('sent').length, color: 'bg-blue-500' },
                      { status: 'viewed', label: 'Viewed', count: getProposalsByStatus('viewed').length, color: 'bg-purple-500' },
                      { status: 'accepted', label: 'Accepted', count: getAcceptedProposals().length, color: 'bg-emerald-500' },
                    ].map((item) => (
                      <div key={item.status} className="flex items-center gap-3">
                        <div className={`h-3 w-3 ${item.color}`} />
                        <span className="flex-1 text-xs text-slate-600">{item.label}</span>
                        <span className="font-bold font-mono text-sm text-slate-800">{item.count}</span>
                        <div className="w-24 h-1.5 bg-slate-200">
                          <div className={`h-full ${item.color}`} style={{ width: `${(item.count / proposals.length) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Value by Type + Quick Actions */}
                <div className="border-2 border-slate-200 bg-white overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-slate-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Value by Type</span>
                  </div>
                  <div className="p-4">
                    <div className="h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={valueByType} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis type="number" fontSize={10} tick={{ fill: '#64748b' }} tickFormatter={(v) => `${v / 100000}L`} />
                          <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} width={80} />
                          <Tooltip
                            contentStyle={{
                              border: '2px solid #cbd5e1',
                              borderRadius: 0,
                              fontSize: '12px',
                              fontFamily: 'monospace'
                            }}
                            formatter={(value: number) => value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                          />
                          <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Quick Actions */}
                    <div className="mt-4 pt-4 border-t-2 border-slate-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Quick Actions</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowNewProposal(true)}
                          className="flex-1 p-2 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-300"
                        >
                          <Plus className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-[10px] font-medium text-slate-700">New Proposal</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('drafts')}
                          className="flex-1 p-2 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-300"
                        >
                          <Edit className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-[10px] font-medium text-slate-700">View Drafts</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('templates')}
                          className="flex-1 p-2 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-300"
                        >
                          <Copy className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-[10px] font-medium text-slate-700">Templates</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Proposals Tab */}
          {activeTab === 'all' && (
            <div>
              {/* Filters */}
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search proposals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="all">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="pending_review">Pending Review</option>
                      <option value="sent">Sent</option>
                      <option value="viewed">Viewed</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="all">All Types</option>
                      <option value="new_project">New Project</option>
                      <option value="amc">AMC</option>
                      <option value="upgrade">Upgrade</option>
                      <option value="consumables">Consumables</option>
                      <option value="service">Service</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Proposals Table */}
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-200">
                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Proposal #</th>
                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Title</th>
                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer</th>
                    <th className="text-center px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Type</th>
                    <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Value</th>
                    <th className="text-center px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Valid Until</th>
                    <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProposals.map((proposal) => (
                    <tr key={proposal.id} className="hover:bg-slate-50 cursor-pointer">
                      <td className="px-4 py-3 font-mono text-sm text-slate-800">{proposal.proposalNumber}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-800">{proposal.title}</p>
                        <p className="text-[10px] text-slate-500">
                          {formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-700">{proposal.customerName}</p>
                        <p className="text-[10px] text-slate-500">{proposal.contactPerson}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getTypeStyles(proposal.type)}`}>
                          {getProposalTypeLabel(proposal.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                        {proposal.total.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusStyles(proposal.status)}`}>
                          {getStatusLabel(proposal.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {format(new Date(proposal.validUntil), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === proposal.id ? null : proposal.id); }}
                            className="p-1.5 hover:bg-slate-100 transition-colors"
                            title="Actions"
                          >
                            <MoreVertical className="h-4 w-4 text-slate-500" />
                          </button>

                          {/* Dropdown Menu */}
                          {openMenuId === proposal.id && (
                            <div className="absolute right-0 top-full mt-1 z-50 w-40 border-2 border-slate-300 bg-white shadow-lg">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedProposal(proposal); setOpenMenuId(null); }}
                                className="w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View Details
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}
                                className="w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                Edit Proposal
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}
                                className="w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                Duplicate
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Drafts Tab */}
          {activeTab === 'drafts' && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getDraftProposals().map((proposal) => (
                <div key={proposal.id} className="border-2 border-slate-200 bg-white hover:border-slate-300 transition-colors">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getTypeStyles(proposal.type)}`}>
                        {getProposalTypeLabel(proposal.type)}
                      </span>
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                        Draft
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 mb-1">{proposal.title}</p>
                    <p className="text-xs text-slate-500 mb-3">{proposal.customerName}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold font-mono text-slate-800">
                        {proposal.total.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                      </p>
                      <div className="flex gap-1">
                        <button className="px-2 py-1 border-2 border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1">
                          <Edit className="h-3 w-3" />
                          Edit
                        </button>
                        <button className="px-2 py-1 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center gap-1">
                          <Send className="h-3 w-3" />
                          Submit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pending Tab */}
          {activeTab === 'pending' && (
            <div className="divide-y divide-slate-200">
              {getPendingProposals().map((proposal) => (
                <div key={proposal.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono text-slate-500">{proposal.proposalNumber}</p>
                      <p className="text-sm font-bold text-slate-800">{proposal.title}</p>
                      <p className="text-xs text-slate-500">{proposal.customerName}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold font-mono text-slate-800">
                          {proposal.total.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                        </p>
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusStyles(proposal.status)}`}>
                          {getStatusLabel(proposal.status)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedProposal(proposal)}
                          className="px-3 py-1.5 border-2 border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          View
                        </button>
                        {proposal.status === 'pending_review' && (
                          <>
                            <button className="px-3 py-1.5 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Approve
                            </button>
                            <button className="px-3 py-1.5 border-2 border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              Reject
                            </button>
                          </>
                        )}
                        {proposal.status === 'sent' && (
                          <button className="px-3 py-1.5 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Follow Up
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {proposalTemplates.map((template) => (
                <div key={template.id} className="border-2 border-slate-200 bg-white hover:border-slate-300 transition-colors">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getTypeStyles(template.type)}`}>
                        {getProposalTypeLabel(template.type)}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 mb-1">{template.name}</p>
                    <p className="text-xs text-slate-500 mb-3">{template.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-4">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {template.sections.length} sections
                      </span>
                      <span>|</span>
                      <span>{template.defaultItems.length} default items</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowNewProposal(true);
                      }}
                      className="w-full px-4 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="h-3 w-3" />
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Proposal Detail Modal - Industrial Style */}
      <Dialog open={!!selectedProposal} onOpenChange={() => setSelectedProposal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 gap-0 rounded-none border-2 border-slate-300">
          <DialogTitle className="sr-only">Proposal Details</DialogTitle>
          {selectedProposal && (
            <>
              {/* Modal Header */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-b-2 border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center bg-slate-100 border border-slate-300">
                    <FileText className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{selectedProposal.proposalNumber}</h2>
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusStyles(selectedProposal.status)}`}>
                      {getStatusLabel(selectedProposal.status)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProposal(null)}
                  className="p-1 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-4 space-y-4">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border-2 border-slate-200 p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Customer</span>
                    <p className="text-sm font-bold text-slate-800">{selectedProposal.customerName}</p>
                    <p className="text-xs text-slate-600">{selectedProposal.contactPerson}</p>
                    <p className="text-xs text-slate-500">{selectedProposal.contactEmail}</p>
                  </div>
                  <div className="border-2 border-slate-200 p-4 text-right">
                    <div className="mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Created</span>
                      <p className="text-sm text-slate-800">{format(new Date(selectedProposal.createdAt), 'PPP')}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Valid Until</span>
                      <p className="text-sm text-slate-800">{format(new Date(selectedProposal.validUntil), 'PPP')}</p>
                    </div>
                  </div>
                </div>

                {/* Proposal Title */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{selectedProposal.title}</h3>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getTypeStyles(selectedProposal.type)}`}>
                    {getProposalTypeLabel(selectedProposal.type)}
                  </span>
                </div>

                {/* Line Items */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Line Items</span>
                  <table className="w-full border-2 border-slate-200">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Description</th>
                        <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Category</th>
                        <th className="text-center px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Qty</th>
                        <th className="text-right px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Unit Price</th>
                        <th className="text-right px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedProposal.lineItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2">
                            <p className="text-sm text-slate-800">{item.description}</p>
                            {item.notes && <p className="text-[10px] text-slate-500">{item.notes}</p>}
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-600">{item.category}</td>
                          <td className="px-3 py-2 text-center font-mono text-sm">{item.quantity} {item.unit}</td>
                          <td className="px-3 py-2 text-right font-mono text-sm">
                            {item.unitPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-semibold text-slate-800">
                            {item.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-72 border-2 border-slate-200 p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-mono">{selectedProposal.subtotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                    </div>
                    {selectedProposal.discount > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>Discount ({selectedProposal.discountType === 'percentage' ? `${selectedProposal.discount}%` : 'Fixed'})</span>
                        <span className="font-mono">
                          -{selectedProposal.discountType === 'percentage'
                            ? (selectedProposal.subtotal * selectedProposal.discount / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
                            : selectedProposal.discount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Taxes (18% GST)</span>
                      <span className="font-mono">{selectedProposal.taxes.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-slate-200">
                      <span>Total</span>
                      <span className="font-mono">{selectedProposal.total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="border-2 border-slate-200 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Terms & Conditions</span>
                  <p className="text-xs text-slate-600">{selectedProposal.terms}</p>
                </div>

                {/* Notes */}
                {selectedProposal.notes && (
                  <div className="border-2 border-slate-200 p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Notes</span>
                    <p className="text-xs text-slate-600">{selectedProposal.notes}</p>
                  </div>
                )}

                {/* Attachments */}
                {selectedProposal.attachments.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Attachments</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedProposal.attachments.map((att) => (
                        <button key={att.id} className="px-3 py-1.5 border-2 border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          {att.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t-2 border-slate-200 px-4 py-3 flex justify-end gap-2 bg-slate-50">
                <button className="px-4 py-2 border-2 border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2">
                  <Download className="h-3 w-3" />
                  Download PDF
                </button>
                {selectedProposal.status === 'draft' && (
                  <button className="px-4 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center gap-2">
                    <Send className="h-3 w-3" />
                    Submit for Review
                  </button>
                )}
                {selectedProposal.status === 'pending_review' && (
                  <button className="px-4 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Approve & Send
                  </button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Proposal Modal - Industrial Style */}
      <Dialog open={showNewProposal} onOpenChange={() => { setShowNewProposal(false); setSelectedTemplate(null); }}>
        <DialogContent className="max-w-lg p-0 gap-0 rounded-none border-2 border-slate-300">
          <DialogTitle className="sr-only">Create New Proposal</DialogTitle>
          {/* Modal Header */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b-2 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center bg-slate-100 border border-slate-300">
                <Plus className="h-4 w-4 text-slate-600" />
              </div>
              <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">Create New Proposal</span>
            </div>
            <button
              onClick={() => { setShowNewProposal(false); setSelectedTemplate(null); }}
              className="p-1 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {selectedTemplate ? (
              <div className="border-2 border-blue-200 bg-blue-50 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-1">Using Template</span>
                <p className="text-sm font-bold text-blue-900">{selectedTemplate.name}</p>
              </div>
            ) : (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-3">Select a template to get started:</span>
                <div className="grid grid-cols-2 gap-2">
                  {proposalTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className="p-3 border-2 border-slate-200 text-left hover:border-slate-300 hover:bg-slate-50 transition-colors"
                    >
                      <p className="text-xs font-bold text-slate-800">{template.name}</p>
                      <p className="text-[10px] text-slate-500">{getProposalTypeLabel(template.type)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedTemplate && (
              <>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Customer</label>
                  <select className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-blue-500 bg-white">
                    <option value="">Select customer</option>
                    <option value="cust-001">TechPark Industries</option>
                    <option value="cust-002">GreenValley Township</option>
                    <option value="cust-003">Metro Water Authority</option>
                    <option value="cust-004">PharmaCare Ltd</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Proposal Title</label>
                  <input
                    type="text"
                    placeholder="Enter proposal title"
                    className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Valid Until</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </>
            )}

            {/* Footer Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t-2 border-slate-200">
              <button
                onClick={() => { setShowNewProposal(false); setSelectedTemplate(null); }}
                className="px-4 py-2 border-2 border-slate-300 text-slate-600 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!selectedTemplate}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
                  selectedTemplate
                    ? 'bg-slate-700 text-white hover:bg-slate-800'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <FileText className="h-3 w-3" />
                Create Proposal
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
