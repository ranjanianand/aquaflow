'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlarmSummaryBar,
  IndustrialKPIBar,
  DenseSensorGrid,
  IndustrialAlertsPanel,
  RecentEventsPanel,
  FlowRateChart,
  EnergyConsumptionChart,
  WaterQualityChart,
  ProcessEfficiencyChart,
  IndustrialPredictiveSummary,
  ManagerDashboard,
  ExecutiveDashboard,
} from '@/components/dashboard-v2';

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="min-h-screen animate-pulse bg-slate-100">
      <div className="h-10 bg-red-200" />
      <div className="h-12 bg-slate-300" />
      <div className="h-14 bg-slate-200" />
      <div className="p-4 space-y-4">
        <div className="h-40 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 bg-slate-200 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 h-64 bg-slate-200 rounded-lg" />
          <div className="h-64 bg-slate-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Operator Dashboard - Default view for plant operators
function OperatorDashboard() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Sticky Header Section */}
      <header className="sticky top-0 z-30 shadow-sm">
        {/* Alarm Summary Bar */}
        <AlarmSummaryBar />

        {/* KPI Bar */}
        <IndustrialKPIBar />
      </header>

      {/* Main Content - Dense Industrial Layout */}
      <main className="flex-1 p-4 space-y-4">
        {/* Row 1: Sensor Grid by Plant (Full Width) */}
        <section aria-label="Live Sensors">
          <DenseSensorGrid />
        </section>

        {/* Row 2: Trend Charts */}
        <section aria-label="Performance Trends" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <FlowRateChart />
          <EnergyConsumptionChart />
          <WaterQualityChart />
          <ProcessEfficiencyChart />
        </section>

        {/* Row 4: Predictive Maintenance */}
        <section aria-label="Predictive Maintenance">
          <IndustrialPredictiveSummary />
        </section>

        {/* Row 5: Secondary Panels */}
        <section aria-label="Operations Details" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Alerts Panel */}
          <div className="lg:col-span-1">
            <IndustrialAlertsPanel />
          </div>
          {/* Recent Events */}
          <div className="lg:col-span-1">
            <RecentEventsPanel />
          </div>
        </section>
      </main>
    </div>
  );
}

// Dashboard content with role-based rendering
function DashboardContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  // Get role from query parameter
  const role = searchParams.get('role') || 'operator';

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Render dashboard based on role
  switch (role) {
    case 'manager':
      return <ManagerDashboard />;
    case 'executive':
      return <ExecutiveDashboard />;
    default:
      return <OperatorDashboard />;
  }
}

// Main page component with Suspense boundary for useSearchParams
export default function DashboardV2Page() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
