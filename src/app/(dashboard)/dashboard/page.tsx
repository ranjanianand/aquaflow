'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { StatusCard } from '@/components/dashboard/status-card';
import { FlowChart } from '@/components/dashboard/flow-chart';
import { MultiParamChart } from '@/components/dashboard/multi-param-chart';
import { RealtimeGauges } from '@/components/dashboard/realtime-gauges';
import { PlantHealthMatrix } from '@/components/dashboard/plant-health-matrix';
import { AlertSummaryBar } from '@/components/dashboard/alert-summary-bar';
import { PredictiveSummary } from '@/components/dashboard/predictive-summary';
import { ProcessEfficiencyCard } from '@/components/dashboard/process-efficiency-card';
import { Building2, Cpu, Bell, Droplets } from 'lucide-react';
import { getOnlinePlantsCount, getTotalSensorCount } from '@/data/mock-plants';
import { getActiveAlertsCount, getCriticalAlertsCount } from '@/data/mock-alerts';
import { DashboardSkeleton } from '@/components/shared/loading-skeleton';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const onlinePlants = getOnlinePlantsCount();
  const totalPlants = 6; // Total plant count
  const totalSensors = getTotalSensorCount();
  const activeAlerts = getActiveAlertsCount();
  const criticalAlerts = getCriticalAlertsCount();

  // Calculate total volume (mock)
  const totalVolume = 12847;

  // Get current date for welcome message
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Overview" />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Overview" />

      <div className="p-6 space-y-5">
        {/* Welcome Section with System Status */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Welcome back, Operator</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">{formattedDate}</p>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            All systems operational
          </div>
        </div>

        {/* SECTION 1: Critical Status at a Glance */}
        <section aria-label="Critical Status">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatusCard
              title="Active Plants"
              value={`${onlinePlants}/${totalPlants}`}
              icon={Building2}
              status="success"
              color="blue"
              trend={{ value: 'All operational', direction: 'neutral' }}
            />
            <StatusCard
              title="Total Sensors"
              value={totalSensors}
              icon={Cpu}
              status="success"
              color="green"
              trend={{ value: '98% online', direction: 'up' }}
            />
            <StatusCard
              title="Active Alerts"
              value={activeAlerts}
              icon={Bell}
              status={criticalAlerts > 0 ? 'danger' : activeAlerts > 0 ? 'warning' : 'success'}
              color={criticalAlerts > 0 ? 'red' : activeAlerts > 0 ? 'orange' : 'green'}
              trend={{
                value: `${criticalAlerts} critical`,
                direction: criticalAlerts > 0 ? 'down' : 'neutral',
              }}
            />
            <StatusCard
              title="Volume Today"
              value={totalVolume.toLocaleString()}
              subtitle="m³ processed"
              icon={Droplets}
              color="blue"
              trend={{ value: '+12%', direction: 'up' }}
            />
          </div>
        </section>

        {/* SECTION 2: Alerts Overview */}
        <section aria-label="Alerts Overview">
          <AlertSummaryBar />
        </section>

        {/* SECTION 3: Real-Time Operations - Primary operator focus */}
        <section aria-label="Real-Time Operations">
          <RealtimeGauges />
        </section>

        {/* SECTION 4: Predictive Maintenance */}
        <section aria-label="Predictive Maintenance">
          <PredictiveSummary />
        </section>

        {/* SECTION 5: Performance Trends */}
        <section aria-label="Performance Trends">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <FlowChart />
            </div>
            <div className="xl:col-span-1">
              <ProcessEfficiencyCard />
            </div>
          </div>
        </section>

        {/* SECTION 6: Multi-Parameter Analysis - Full Width */}
        <section aria-label="Parameter Analysis">
          <MultiParamChart />
        </section>

        {/* SECTION 7: Plant Status Overview */}
        <section aria-label="Plant Status">
          <PlantHealthMatrix />
        </section>
      </div>
    </div>
  );
}
