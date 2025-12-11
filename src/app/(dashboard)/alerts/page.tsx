'use client';

import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { AlertTable } from '@/components/alerts/alert-table';
import { AlertModal } from '@/components/alerts/alert-modal';
import { StatusCard } from '@/components/dashboard/status-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertStatus } from '@/types';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { AlertsSkeleton } from '@/components/shared/loading-skeleton';

type TabValue = 'active' | 'acknowledged' | 'resolved' | 'all';

export default function AlertsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<TabValue>('active');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [plantFilter, setPlantFilter] = useState<string>('all');

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const stats = getAlertStats();

  const filteredAlerts = useMemo(() => {
    let alerts = selectedTab === 'all' ? mockAlerts : getAlertsByStatus(selectedTab as AlertStatus);

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

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header
          title="Alerts Center"
          subtitle="Monitor and manage system alerts"
        />
        <AlertsSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Alerts Center"
        subtitle="Monitor and manage system alerts"
      />

      <div className="p-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatusCard
            title="Critical Alerts"
            value={stats.critical}
            icon={AlertTriangle}
            status={stats.critical > 0 ? 'danger' : 'success'}
            color="red"
            trend={{
              value: 'Requires immediate action',
              direction: stats.critical > 0 ? 'down' : 'neutral',
            }}
          />
          <StatusCard
            title="Warnings"
            value={stats.warning}
            icon={AlertCircle}
            status={stats.warning > 0 ? 'warning' : 'success'}
            color="orange"
            trend={{
              value: 'Monitor closely',
              direction: stats.warning > 0 ? 'down' : 'neutral',
            }}
          />
          <StatusCard
            title="Resolution Rate"
            value={`${Math.round((stats.resolved / stats.total) * 100)}%`}
            icon={CheckCircle}
            color="green"
            trend={{
              value: `${stats.resolved} resolved this week`,
              direction: 'up',
            }}
          />
          <StatusCard
            title="Avg Response Time"
            value="12m"
            icon={Clock}
            color="blue"
            trend={{
              value: '3m faster than target',
              direction: 'up',
            }}
          />
        </div>

        {/* Alerts Table Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/50 px-6 py-4">
            <CardTitle className="text-base font-semibold">Alert Management</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Create Rule
            </Button>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Tabs
                value={selectedTab}
                onValueChange={(v) => setSelectedTab(v as TabValue)}
                className="w-full sm:w-auto"
              >
                <TabsList>
                  <TabsTrigger value="active" className="relative">
                    Active
                    {stats.active > 0 && (
                      <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                        {stats.active}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="acknowledged">
                    Acknowledged ({stats.acknowledged})
                  </TabsTrigger>
                  <TabsTrigger value="resolved">Resolved ({stats.resolved})</TabsTrigger>
                  <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex flex-1 gap-3 sm:ml-auto">
                <div className="relative flex-1 sm:max-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search alerts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[130px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={plantFilter} onValueChange={setPlantFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Plants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plants</SelectItem>
                    {mockPlants.map((plant) => (
                      <SelectItem key={plant.id} value={plant.id}>
                        {plant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <AlertTable
              alerts={filteredAlerts}
              onViewAlert={handleViewAlert}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
            />
          </CardContent>
        </Card>
      </div>

      {/* Alert Detail Modal */}
      <AlertModal
        alert={selectedAlert}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAcknowledge={handleAcknowledge}
        onResolve={handleResolve}
      />
    </div>
  );
}
