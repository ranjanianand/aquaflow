'use client';

import { useState, useEffect, useMemo } from 'react';
import { InsightsSummary } from '@/components/insights/insights-summary';
import { ObservationCard } from '@/components/insights/observation-card';
import { ObservationDetailModal } from '@/components/insights/observation-detail-modal';
import { ProcessOptimization } from '@/components/insights/process-optimization';
import { usePlants } from '@/lib/api/hooks';
import {
  Lightbulb,
  Filter,
  SlidersHorizontal,
  TrendingUp,
  Wrench,
  Zap,
  RefreshCw,
  ChevronDown,
  Sparkles,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InsightsSkeleton } from '@/components/shared/loading-skeleton';
import { FEATURES } from '@/lib/features';
import { useAcknowledgements, useAckHistory, useInsights } from '@/lib/api/hooks';
import { deriveObservations, KIND_LABEL,
         type Observation, type ObservationKind } from '@/lib/insights/derive';
import { FeatureDisabled } from '@/components/shared/feature-disabled';

type InsightType = ObservationKind | 'all';
type InsightPriority = 'high' | 'medium' | 'low' | 'all';

function InsightsContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<InsightType>('all');
  const [selectedPriority, setSelectedPriority] = useState<InsightPriority>('all');
  const [selectedPlant, setSelectedPlant] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('recommendations');
  const { data: acks, refresh: refreshAcks } = useAcknowledgements();
  const { data: ackHistory } = useAckHistory(50);
  const [openObservation, setOpenObservation] = useState<Observation | null>(null);

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Observations counted from readings. Nothing modelled, so nothing
  // recommended — see lib/insights/derive.ts.
  const { data: insightsData, loading: insightsLoading } = useInsights(30);
  const { data: livePlants } = usePlants();
  const mockPlants = livePlants ?? [];

  const observations = useMemo(
    () => deriveObservations(insightsData ?? null),
    [insightsData]);

  const filteredInsights = observations.filter((o) => {
    if (selectedType !== 'all' && o.kind !== selectedType) return false;
    if (selectedPriority !== 'all' && o.priority !== selectedPriority) return false;
    if (selectedPlant !== 'all' && o.plantId !== selectedPlant) return false;
    return true;
  });

  const rank = { high: 0, medium: 1, low: 2 };
  const sortedInsights = [...filteredInsights].sort(
    (a, b) => rank[a.priority] - rank[b.priority]);

  const typeFilters = [
    { value: 'all', label: 'All', icon: Lightbulb },
    { value: 'breach', label: KIND_LABEL.breach, icon: TrendingUp },
    { value: 'stuck', label: KIND_LABEL.stuck, icon: Zap },
    { value: 'silent', label: KIND_LABEL.silent, icon: Wrench },
  ];

  const highPriorityCount = filteredInsights.filter(i => i.priority === 'high').length;



  if (isLoading || insightsLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Insights</span>
            <span className="text-[10px] text-slate-400">Observations counted from sensor readings</span>
          </div>
        </header>
        <InsightsSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Industrial Header Bar */}
      <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Sparkles className="h-4 w-4 text-white" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Insights</span>
          <span className="text-[10px] text-slate-400">Observations counted from sensor readings</span>
        </div>
        <div className="flex items-center gap-3">
          {highPriorityCount > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-amber-600 text-white text-[10px] font-bold">
              <Lightbulb className="h-3 w-3" />
              {highPriorityCount} HIGH PRIORITY
            </span>
          )}
          <span className="text-[10px] font-mono text-slate-400">LAST 30 DAYS</span>
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {/* Summary Cards */}
        <InsightsSummary observations={observations}
                         coverage={insightsData?.coverage ?? null} />

        {/* Tab Header */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('recommendations')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase transition-colors',
                activeTab === 'recommendations'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-slate-300'
              )}
            >
              <Lightbulb className="h-3.5 w-3.5" />
              Recommendations
            </button>
            <button
              onClick={() => setActiveTab('processes')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase transition-colors',
                activeTab === 'processes'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-slate-300'
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Process Analysis
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase transition-colors',
                activeTab === 'history'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-slate-300'
              )}
            >
              <History className="h-3.5 w-3.5" />
              History
            </button>
          </div>

          <button className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {/* Filters Panel */}
            <div className="border-2 border-slate-300 bg-white p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Filters:</span>
                </div>

                {/* Type Filter Buttons */}
                <div className="flex items-center gap-1">
                  {typeFilters.map((filter) => {
                    const Icon = filter.icon;
                    const isActive = selectedType === filter.value;
                    return (
                      <button
                        key={filter.value}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase transition-colors',
                          isActive
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        )}
                        onClick={() => setSelectedType(filter.value as InsightType)}
                      >
                        <Icon className="h-3 w-3" />
                        {filter.label}
                      </button>
                    );
                  })}
                </div>

                {/* Priority Dropdown */}
                <div className="relative">
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value as InsightPriority)}
                    className="h-7 px-2 pr-7 text-[10px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                </div>

                {/* Plant Dropdown */}
                <div className="relative">
                  <select
                    value={selectedPlant}
                    onChange={(e) => setSelectedPlant(e.target.value)}
                    className="h-7 px-2 pr-7 text-[10px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
                  >
                    <option value="all">All Plants</option>
                    {mockPlants.map((plant) => (
                      <option key={plant.id} value={plant.id}>
                        {plant.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                </div>

                {/* Results count */}
                <span className="text-[10px] font-mono text-slate-500 ml-auto">
                  {sortedInsights.length} INSIGHT{sortedInsights.length !== 1 ? 'S' : ''} FOUND
                </span>
              </div>
            </div>

            {/* Insights Grid */}
            {sortedInsights.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {sortedInsights.map((insight) => (
                  <ObservationCard
                    key={insight.id}
                    observation={insight}
                    acknowledgement={acks?.[insight.id] ?? null}
                    onAcknowledged={refreshAcks}
                    onOpenData={setOpenObservation}
                  />
                ))}
              </div>
            ) : (
              <div className="border-2 border-slate-300 bg-white p-12 text-center">
                <Lightbulb className="h-10 w-10 mx-auto text-slate-300 mb-4" />
                <h3 className="text-sm font-bold text-slate-600 mb-1">NO INSIGHTS FOUND</h3>
                <p className="text-[11px] text-slate-500">
                  Try adjusting your filters to see more recommendations
                </p>
              </div>
            )}
          </div>
        )}

        {/* Process Analysis Tab */}
        {activeTab === 'processes' && (
          <ProcessOptimization data={insightsData ?? null} loading={insightsLoading} />
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-blue-500">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Acknowledged
                </span>
                <p className="text-3xl font-bold font-mono text-blue-600 mt-1">
                  {ackHistory?.length ?? 0}
                </p>
                <p className="text-[10px] text-slate-500">observations read</p>
              </div>
              <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Awaiting review
                </span>
                <p className="text-3xl font-bold font-mono text-slate-700 mt-1">
                  {observations.filter((o) => !acks?.[o.id]).length}
                </p>
                <p className="text-[10px] text-slate-500">no one has acknowledged</p>
              </div>
              <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Most recent
                </span>
                <p className="text-sm font-semibold text-slate-700 mt-2">
                  {ackHistory?.[0]
                    ? new Date(ackHistory[0].acknowledgedAt).toLocaleString()
                    : '\u2014'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {ackHistory?.[0] ? `by ${ackHistory[0].acknowledgedBy}` : 'nothing yet'}
                </p>
              </div>
            </div>

            <div className="border-2 border-slate-300 bg-white overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Acknowledgement history
                </span>
                <span className="text-[10px] text-slate-500">newest first</span>
              </div>

              {(ackHistory ?? []).length === 0 ? (
                <div className="p-10 text-center">
                  <History className="h-9 w-9 mx-auto text-slate-300 mb-3" />
                  <p className="text-sm text-slate-500 mb-1">Nothing acknowledged yet</p>
                  {/* Says what this records, so an empty panel is not read as
                      a screen that is broken or not wired up. */}
                  <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                    When somebody acknowledges an observation it is recorded here
                    with their name and the time, so the next shift can see what
                    has already been looked at.
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b-2 border-slate-200">
                      <th className="text-left px-4 py-2 font-bold">Observation</th>
                      <th className="text-left px-4 py-2 font-bold">Plant</th>
                      <th className="text-left px-4 py-2 font-bold">Acknowledged by</th>
                      <th className="text-left px-4 py-2 font-bold">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ackHistory ?? []).map((a) => (
                      <tr key={a.id} className="border-b border-slate-100">
                        <td className="px-4 py-2">
                          <span className="text-slate-700">{a.subject}</span>
                          <span className="block text-[10px] text-slate-400">
                            {KIND_LABEL[a.kind as ObservationKind] ?? a.kind}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-600 text-xs">
                          {a.plantName ?? '\u2014'}
                        </td>
                        <td className="px-4 py-2 text-slate-700 text-xs">
                          {a.acknowledgedBy}
                        </td>
                        <td className="px-4 py-2 font-mono text-[11px] text-slate-500">
                          {new Date(a.acknowledgedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              Acknowledging records that somebody read an observation. It sends
              nothing to the plant — any change is made in the control system by
              an operator.
            </p>
          </div>
        )}
      </div>
      <ObservationDetailModal
        observation={openObservation}
        open={openObservation !== null}
        onOpenChange={(o) => { if (!o) setOpenObservation(null); }}
      />
    </div>
  );
}

// Gated: see lib/features.ts
export default function InsightsPage() {
  if (!FEATURES.operationalInsights) {
    return (
      <FeatureDisabled
        title="Operational insights are not available"
        reason="Each recommendation on this screen carries an action that writes a setpoint to plant equipment — feed pressure, chlorine dosing rate, backwash timing. Readings reach the platform as file exports, which is a one-way path, so an applied change would never arrive at the equipment."
        requirement="A control path to the plant. Alternatively the screen can return as advisory-only, presenting the recommendation for an operator to apply by hand."
      />
    );
  }
  return <InsightsContent />;
}
