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
import { DashboardSkeleton } from '@/components/shared/loading-skeleton';
import { DataFreshness } from '@/components/shared/data-freshness';
import { useKpis } from '@/lib/api/hooks';

export default function DashboardPage() {
  // One endpoint serves the whole strip. Previously five separate mock
  // helpers, each counting a different fixture, so the numbers could not be
  // guaranteed to agree with each other or with the screens below.
  const { data: kpis, error, loading } = useKpis();

  const onlinePlants = kpis?.plantsOnline ?? 0;
  const totalPlants = kpis?.plantsTotal ?? 0;
  const totalSensors = kpis?.sensorsTotal ?? 0;
  const criticalAlerts = kpis?.alertsCritical ?? 0;
  const activeAlerts = criticalAlerts + (kpis?.alertsWarning ?? 0);

  const isLoading = loading && !kpis;

  // The treated-volume tile is gone. It read a hardcoded 12,847 m3 — there is
  // no flow totaliser in the readings, so the figure cannot be derived. A
  // fabricated number on an overview screen is the one most likely to be
  // repeated in a meeting.

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
            <p className="text-sm text-muted-foreground mt-0.5">{formattedDate}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {kpis?.lastIngestReconciled === false && (
              <span className="text-red-600 font-medium">
                Last ingest failed reconciliation
              </span>
            )}
            <DataFreshness newest={kpis?.lastIngest ?? null} error={error} loading={loading} />
          </div>
        </div>

        {/* SECTION 1: Critical Status at a Glance */}
        <section aria-label="Critical Status">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatusCard
              title="Active Plants"
              value={`${onlinePlants}/${totalPlants}`}
              icon={Building2}
              status={onlinePlants === totalPlants ? 'success' : onlinePlants ? 'warning' : 'danger'}
              color="blue"
              trend={{
                value: onlinePlants === totalPlants
                  ? 'All reporting'
                  : `${totalPlants - onlinePlants} not reporting`,
                direction: 'neutral',
              }}
            />
            <StatusCard
              title="Total Sensors"
              value={totalSensors}
              icon={Cpu}
              status="success"
              color="green"
              trend={{ value: 'configured', direction: 'neutral' }}
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
              title="Rows Ingested"
              value={(kpis?.lastIngestRows ?? 0).toLocaleString()}
              subtitle="last run"
              icon={Droplets}
              color="blue"
              trend={{
                value: kpis?.lastIngestReconciled ? 'reconciled' : 'not verified',
                direction: 'neutral',
              }}
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
