'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
];

export default function ReportsPage() {
  const [builderOpen, setBuilderOpen] = useState(false);

  const handleGenerate = (templateId: string) => {
    toast.success('Report generation started', {
      description: 'You will be notified when the report is ready.',
    });
  };

  const handleDownload = (reportId: string) => {
    toast.success('Download started', {
      description: 'Your report is being downloaded.',
    });
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Reports"
        subtitle="Generate and download system reports"
      />

      <div className="p-8 space-y-6">
        {/* Report Templates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/50 px-6 py-4">
            <CardTitle className="text-base font-semibold">Report Templates</CardTitle>
            <Button onClick={() => setBuilderOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Custom Report
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {reportTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <Card
                    key={template.id}
                    className="p-5 transition-all duration-200 cursor-pointer card-hover"
                    onClick={() => handleGenerate(template.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-[var(--accent-blue)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge
                        variant={template.schedule === 'auto' ? 'default' : 'secondary'}
                        className={cn(
                          template.schedule === 'auto' && 'bg-[var(--success-bg)] text-[var(--success)] hover:bg-[var(--success-bg)]'
                        )}
                      >
                        {template.schedule === 'auto' ? 'Auto' : 'Manual'}
                      </Badge>
                    </div>
                    <h4 className="font-semibold mb-1.5">{template.name}</h4>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {template.frequency ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {template.frequency}
                        </span>
                      ) : (
                        <span>Generate on demand</span>
                      )}
                      {template.lastGenerated && (
                        <span>
                          Last: {format(template.lastGenerated, 'MMM d')}
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader className="border-b bg-muted/50 px-6 py-4">
            <CardTitle className="text-base font-semibold">Recent Reports</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Report Name</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Generated By</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{report.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(report.generatedAt, 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>{report.generatedBy}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{report.format}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{report.size}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {report.status === 'completed' && (
                          <>
                            <CheckCircle className="h-4 w-4 text-[var(--success)]" />
                            <span className="text-[var(--success)]">Completed</span>
                          </>
                        )}
                        {report.status === 'processing' && (
                          <>
                            <Loader2 className="h-4 w-4 text-[var(--accent-blue)] animate-spin" />
                            <span className="text-[var(--accent-blue)]">Processing</span>
                          </>
                        )}
                        {report.status === 'failed' && (
                          <>
                            <AlertTriangle className="h-4 w-4 text-[var(--danger)]" />
                            <span className="text-[var(--danger)]">Failed</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(report.id)}
                        disabled={report.status !== 'completed'}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Custom Report Builder Dialog */}
      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Custom Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Report Name</Label>
              <Input placeholder="e.g., Monthly Summary - Chennai" />
            </div>
            <div className="space-y-2">
              <Label>Plants</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select plants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plants</SelectItem>
                  <SelectItem value="plant-1">Chennai WTP-01</SelectItem>
                  <SelectItem value="plant-2">Mumbai WTP-02</SelectItem>
                  <SelectItem value="plant-3">Delhi WTP-03</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuilderOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast.success('Report generation started');
                setBuilderOpen(false);
              }}
            >
              Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
