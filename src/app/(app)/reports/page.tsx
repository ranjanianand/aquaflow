'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Calendar,
  ClipboardCheck,
  AlertTriangle,
  Wrench,
  Droplets,
  Download,
  Plus,
  Clock,
  CheckCircle,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  X,
  BarChart3,
  Play,
  RefreshCw,
  Trash2,
  Eye,
  Settings,
  Send,
  MoreVertical,
  Copy,
  Share2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  schedule: 'auto' | 'manual';
  frequency?: string;
  lastGenerated?: Date;
}

interface GeneratedReport {
  id: string;
  name: string;
  generatedAt: Date;
  generatedBy: string;
  status: 'completed' | 'processing' | 'failed';
  size: string;
  format: 'PDF' | 'Excel' | 'CSV';
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'daily-ops',
    name: 'Daily Operations Summary',
    description: 'Comprehensive daily overview of all plant operations, sensor readings, and alerts.',
    icon: FileText,
    schedule: 'auto',
    frequency: 'Daily at 6:00 AM',
    lastGenerated: new Date(Date.now() - 6 * 3600000),
  },
  {
    id: 'weekly-perf',
    name: 'Weekly Performance Report',
    description: 'Weekly analysis of system performance, KPIs, and trend insights.',
    icon: Calendar,
    schedule: 'auto',
    frequency: 'Every Monday',
    lastGenerated: new Date(Date.now() - 3 * 24 * 3600000),
  },
  {
    id: 'compliance',
    name: 'Compliance Report',
    description: 'Regulatory compliance documentation for EPA and state agencies.',
    icon: ClipboardCheck,
    schedule: 'manual',
    lastGenerated: new Date(Date.now() - 7 * 24 * 3600000),
  },
  {
    id: 'alert-analysis',
    name: 'Alert Analysis Report',
    description: 'Detailed breakdown of alerts, response times, and resolution patterns.',
    icon: AlertTriangle,
    schedule: 'manual',
    lastGenerated: new Date(Date.now() - 2 * 24 * 3600000),
  },
  {
    id: 'equipment-health',
    name: 'Equipment Health Report',
    description: 'Maintenance status, equipment health scores, and predictive insights.',
    icon: Wrench,
    schedule: 'manual',
    lastGenerated: new Date(Date.now() - 14 * 24 * 3600000),
  },
  {
    id: 'water-quality',
    name: 'Water Quality Report',
    description: 'Comprehensive water quality parameters and compliance status.',
    icon: Droplets,
    schedule: 'auto',
    frequency: 'Daily at 7:00 AM',
    lastGenerated: new Date(Date.now() - 5 * 3600000),
  },
];

const recentReports: GeneratedReport[] = [
  {
    id: 'rep-1',
    name: 'Daily Operations Summary - Dec 10, 2024',
    generatedAt: new Date(Date.now() - 6 * 3600000),
    generatedBy: 'System Auto',
    status: 'completed',
    size: '2.4 MB',
    format: 'PDF',
  },
  {
    id: 'rep-2',
    name: 'Water Quality Report - Dec 10, 2024',
    generatedAt: new Date(Date.now() - 5 * 3600000),
    generatedBy: 'System Auto',
    status: 'completed',
    size: '1.8 MB',
    format: 'PDF',
  },
  {
    id: 'rep-3',
    name: 'Alert Analysis - Dec 9, 2024',
    generatedAt: new Date(Date.now() - 24 * 3600000),
    generatedBy: 'Rahul Kumar',
    status: 'completed',
    size: '3.2 MB',
    format: 'Excel',
  },
  {
    id: 'rep-4',
    name: 'Weekly Performance Report - Dec 9, 2024',
    generatedAt: new Date(Date.now() - 26 * 3600000),
    generatedBy: 'System Auto',
    status: 'completed',
    size: '4.1 MB',
    format: 'PDF',
  },
  {
    id: 'rep-5',
    name: 'Custom Export - Chennai WTP',
    generatedAt: new Date(Date.now() - 48 * 3600000),
    generatedBy: 'Priya Sharma',
    status: 'completed',
    size: '856 KB',
    format: 'CSV',
  },
  {
    id: 'rep-6',
    name: 'Equipment Health Report - Dec 8, 2024',
    generatedAt: new Date(Date.now() - 72 * 3600000),
    generatedBy: 'System Auto',
    status: 'processing',
    size: '--',
    format: 'PDF',
  },
];

type TabType = 'templates' | 'history' | 'scheduled';

export default function ReportsPage() {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleGenerate = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    toast.success('Report generation started', {
      description: `${template.name} will be ready in a few minutes.`,
    });
  };

  const handleDownload = (reportId: string) => {
    toast.success('Download started', {
      description: 'Your report is being downloaded.',
    });
  };

  const filteredReports = recentReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          report.generatedBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFormat = formatFilter === 'all' || report.format === formatFilter;
    return matchesSearch && matchesFormat;
  });

  const completedReports = recentReports.filter(r => r.status === 'completed').length;
  const processingReports = recentReports.filter(r => r.status === 'processing').length;
  const autoTemplates = reportTemplates.filter(t => t.schedule === 'auto').length;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'templates', label: 'Report Templates', icon: <FileText className="h-3.5 w-3.5" /> },
    { id: 'history', label: 'Report History', icon: <Clock className="h-3.5 w-3.5" /> },
    { id: 'scheduled', label: 'Scheduled Reports', icon: <Calendar className="h-3.5 w-3.5" /> },
  ];

  const getFormatBadge = (format: string) => {
    switch (format) {
      case 'PDF':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Excel':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'CSV':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Industrial Header - Standard */}
      <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BarChart3 className="h-4 w-4 text-white" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Reports</span>
          <span className="text-[10px] text-slate-400">Generate and download system reports</span>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* KPI Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-blue-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Templates</span>
              <FileText className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-blue-600">{reportTemplates.length}</span>
              <span className="text-[10px] text-slate-500">available</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-emerald-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Auto-Scheduled</span>
              <RefreshCw className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-emerald-600">{autoTemplates}</span>
              <span className="text-[10px] text-slate-500">active</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-purple-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Reports Generated</span>
              <CheckCircle className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-purple-600">{completedReports}</span>
              <span className="text-[10px] text-slate-500">completed</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-amber-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Processing</span>
              <Loader2 className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-amber-600">{processingReports}</span>
              <span className="text-[10px] text-slate-500">in queue</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-cyan-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Storage Used</span>
              <Download className="h-3.5 w-3.5 text-cyan-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-cyan-600">12.4</span>
              <span className="text-[10px] text-slate-500">MB total</span>
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
              onClick={() => setBuilderOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Custom Report
            </button>
          </div>

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {reportTemplates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <div
                      key={template.id}
                      className="border-2 border-slate-200 bg-white overflow-hidden hover:border-slate-400 transition-colors"
                    >
                      <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-slate-600" />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                            {template.name}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          template.schedule === 'auto'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {template.schedule}
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-slate-600 mb-4 line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-4">
                          {template.frequency ? (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {template.frequency}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Play className="h-3 w-3" />
                              On demand
                            </span>
                          )}
                          {template.lastGenerated && (
                            <span className="font-mono">
                              Last: {format(template.lastGenerated, 'MMM d')}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleGenerate(template)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                        >
                          <Play className="h-3 w-3" />
                          Generate Now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              {/* Filters */}
              <div className="p-4 border-b-2 border-slate-200 bg-slate-50">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search reports..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Format:</span>
                    <div className="relative">
                      <select
                        value={formatFilter}
                        onChange={(e) => setFormatFilter(e.target.value)}
                        className="h-9 px-3 pr-8 border-2 border-slate-300 bg-white text-sm appearance-none focus:outline-none focus:border-slate-500"
                      >
                        <option value="all">All Formats</option>
                        <option value="PDF">PDF</option>
                        <option value="Excel">Excel</option>
                        <option value="CSV">CSV</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Reports Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b-2 border-slate-200">
                      <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Report Name
                      </th>
                      <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Generated
                      </th>
                      <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Generated By
                      </th>
                      <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Format
                      </th>
                      <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Size
                      </th>
                      <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                      <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-800">{report.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono text-slate-600">
                            {format(report.generatedAt, 'MMM d, yyyy HH:mm')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${
                            report.generatedBy === 'System Auto' ? 'text-slate-500 italic' : 'text-slate-700'
                          }`}>
                            {report.generatedBy}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getFormatBadge(report.format)}`}>
                            {report.format}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono text-slate-500">{report.size}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {report.status === 'completed' && (
                              <>
                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                                <span className="text-xs font-medium text-emerald-600">Completed</span>
                              </>
                            )}
                            {report.status === 'processing' && (
                              <>
                                <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
                                <span className="text-xs font-medium text-amber-600">Processing</span>
                              </>
                            )}
                            {report.status === 'failed' && (
                              <>
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <span className="text-xs font-medium text-red-600">Failed</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === report.id ? null : report.id)}
                              className="p-1.5 border-2 border-slate-300 text-slate-500 hover:bg-slate-100 transition-colors"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {openMenuId === report.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border-2 border-slate-300 shadow-lg z-20">
                                  <button
                                    onClick={() => {
                                      handleDownload(report.id);
                                      setOpenMenuId(null);
                                    }}
                                    disabled={report.status !== 'completed'}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs ${
                                      report.status === 'completed'
                                        ? 'text-slate-700 hover:bg-slate-100'
                                        : 'text-slate-400 cursor-not-allowed'
                                    }`}
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                    Download Report
                                  </button>
                                  <button
                                    onClick={() => {
                                      toast.info('Opening preview...');
                                      setOpenMenuId(null);
                                    }}
                                    disabled={report.status !== 'completed'}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs ${
                                      report.status === 'completed'
                                        ? 'text-slate-700 hover:bg-slate-100'
                                        : 'text-slate-400 cursor-not-allowed'
                                    }`}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    Preview
                                  </button>
                                  <button
                                    onClick={() => {
                                      toast.info('Copied to clipboard');
                                      setOpenMenuId(null);
                                    }}
                                    disabled={report.status !== 'completed'}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs ${
                                      report.status === 'completed'
                                        ? 'text-slate-700 hover:bg-slate-100'
                                        : 'text-slate-400 cursor-not-allowed'
                                    }`}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                    Copy Link
                                  </button>
                                  <button
                                    onClick={() => {
                                      toast.info('Share dialog...');
                                      setOpenMenuId(null);
                                    }}
                                    disabled={report.status !== 'completed'}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs ${
                                      report.status === 'completed'
                                        ? 'text-slate-700 hover:bg-slate-100'
                                        : 'text-slate-400 cursor-not-allowed'
                                    }`}
                                  >
                                    <Share2 className="h-3.5 w-3.5" />
                                    Share
                                  </button>
                                  <div className="border-t border-slate-200" />
                                  <button
                                    onClick={() => {
                                      toast.success('Report deleted');
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-2 border-t-2 border-slate-200 bg-slate-50 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Showing <span className="font-mono font-bold">1-{filteredReports.length}</span> of{' '}
                  <span className="font-mono font-bold">{filteredReports.length}</span> reports
                </p>
                <div className="flex items-center gap-1">
                  <button className="h-7 px-3 border-2 border-slate-300 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 disabled:opacity-50" disabled>
                    Previous
                  </button>
                  <button className="h-7 w-7 border-2 border-slate-700 bg-slate-700 text-white text-[10px] font-bold">
                    1
                  </button>
                  <button className="h-7 px-3 border-2 border-slate-300 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 disabled:opacity-50" disabled>
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Scheduled Tab */}
          {activeTab === 'scheduled' && (
            <div className="p-4">
              <div className="space-y-4">
                {reportTemplates.filter(t => t.schedule === 'auto').map((template) => {
                  const Icon = template.icon;
                  return (
                    <div
                      key={template.id}
                      className="border-2 border-slate-200 bg-white overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-slate-100 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{template.name}</p>
                            <p className="text-xs text-slate-500">{template.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Schedule</p>
                            <p className="text-sm font-mono text-slate-700">{template.frequency}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Last Run</p>
                            <p className="text-sm font-mono text-slate-700">
                              {template.lastGenerated ? format(template.lastGenerated, 'MMM d, HH:mm') : '--'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Toggle ON/OFF */}
                            <div className="flex border-2 border-slate-300">
                              <button className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white">
                                On
                              </button>
                              <button className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-white text-slate-500 hover:bg-slate-100">
                                Off
                              </button>
                            </div>
                            <button className="p-2 border-2 border-slate-300 text-slate-500 hover:bg-slate-100 transition-colors">
                              <Settings className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Report Builder Dialog - Industrial Style */}
      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent showCloseButton={false} className="max-w-lg p-0 gap-0 rounded-none border-2 border-slate-300">
          <DialogTitle className="sr-only">Create Custom Report</DialogTitle>
          {/* Modal Header */}
          <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plus className="h-4 w-4 text-white" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">Create Custom Report</span>
            </div>
            <button
              onClick={() => setBuilderOpen(false)}
              className="p-1 hover:bg-slate-700 transition-colors"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Report Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Monthly Summary - Chennai"
                className="w-full px-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Plants <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select className="w-full px-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white appearance-none">
                  <option value="all">All Plants</option>
                  <option value="plant-1">Chennai WTP-01</option>
                  <option value="plant-2">Mumbai WTP-02</option>
                  <option value="plant-3">Delhi WTP-03</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Date Range <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select className="w-full px-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white appearance-none">
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="custom">Custom range</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Output Format <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 border-2 border-slate-700 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider">
                  PDF
                </button>
                <button className="flex-1 px-4 py-2 border-2 border-slate-300 bg-white text-slate-600 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-100">
                  Excel
                </button>
                <button className="flex-1 px-4 py-2 border-2 border-slate-300 bg-white text-slate-600 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-100">
                  CSV
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Include Sections
              </label>
              <div className="space-y-2">
                {['Sensor Data', 'Alert History', 'Performance Metrics', 'Equipment Status', 'Compliance Data'].map((section) => (
                  <label key={section} className="flex items-center gap-3 p-2 border-2 border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" defaultChecked className="h-4 w-4 accent-slate-700" />
                    <span className="text-sm text-slate-700">{section}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-100 px-6 py-4 border-t-2 border-slate-300 flex items-center justify-between">
            <button
              onClick={() => setBuilderOpen(false)}
              className="px-4 py-2 border-2 border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.success('Report generation started', {
                  description: 'Your custom report will be ready in a few minutes.',
                });
                setBuilderOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
            >
              <Send className="h-3 w-3" />
              Generate Report
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
