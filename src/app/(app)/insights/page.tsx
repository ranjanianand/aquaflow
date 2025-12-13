'use client';

import { useState, useEffect } from 'react';
import { InsightsSummary } from '@/components/insights/insights-summary';
import { InsightCard } from '@/components/insights/insight-card';
import { ProcessOptimization } from '@/components/insights/process-optimization';
import { mockInsights, OperationalInsight } from '@/data/mock-operations';
import { mockPlants } from '@/data/mock-plants';
import {
  Lightbulb,
  Filter,
  SlidersHorizontal,
  TrendingUp,
  Wrench,
  DollarSign,
  Shield,
  Zap,
  RefreshCw,
  ChevronDown,
  Sparkles,
  History,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InsightsSkeleton } from '@/components/shared/loading-skeleton';

type InsightType = OperationalInsight['type'] | 'all';
type InsightPriority = OperationalInsight['priority'] | 'all';

export default function InsightsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<InsightType>('all');
  const [selectedPriority, setSelectedPriority] = useState<InsightPriority>('all');
  const [selectedPlant, setSelectedPlant] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('recommendations');

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Filter insights
  const filteredInsights = mockInsights.filter((insight) => {
    if (selectedType !== 'all' && insight.type !== selectedType) return false;
    if (selectedPriority !== 'all' && insight.priority !== selectedPriority) return false;
    if (selectedPlant !== 'all' && insight.plantId !== selectedPlant) return false;
    return true;
  });

  // Sort by priority (high first)
  const sortedInsights = [...filteredInsights].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const handleApply = (id: string) => {
    console.log('Applying recommendation:', id);
    // In real app, this would send to backend
  };

  const handleDismiss = (id: string) => {
    console.log('Dismissing recommendation:', id);
    // In real app, this would update state
  };

  const typeFilters = [
    { value: 'all', label: 'All Types', icon: Lightbulb },
    { value: 'optimization', label: 'Optimization', icon: TrendingUp },
    { value: 'maintenance', label: 'Maintenance', icon: Wrench },
    { value: 'efficiency', label: 'Efficiency', icon: Zap },
    { value: 'cost', label: 'Cost', icon: DollarSign },
    { value: 'compliance', label: 'Compliance', icon: Shield },
  ];

  const highPriorityCount = mockInsights.filter(i => i.priority === 'high').length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Operational Insights</span>
            <span className="text-[10px] text-slate-400">AI-powered recommendations</span>
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
          <span className="text-sm font-bold text-white uppercase tracking-wider">Operational Insights</span>
          <span className="text-[10px] text-slate-400">AI-powered recommendations</span>
        </div>
        <div className="flex items-center gap-3">
          {highPriorityCount > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-amber-600 text-white text-[10px] font-bold">
              <Lightbulb className="h-3 w-3" />
              {highPriorityCount} HIGH PRIORITY
            </span>
          )}
          <span className="text-[10px] font-mono text-emerald-400">AI ENGINE ACTIVE</span>
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {/* Summary Cards */}
        <InsightsSummary />

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
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onApply={handleApply}
                    onDismiss={handleDismiss}
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
          <ProcessOptimization />
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* History Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-emerald-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Applied</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono text-emerald-600">24</span>
                  <span className="text-[10px] text-slate-500">THIS MONTH</span>
                </div>
              </div>

              <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-slate-400">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dismissed</span>
                  <XCircle className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono text-slate-600">8</span>
                  <span className="text-[10px] text-slate-500">THIS MONTH</span>
                </div>
              </div>

              <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-emerald-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Helpful</span>
                  <ThumbsUp className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono text-emerald-600">87%</span>
                  <span className="text-[10px] text-slate-500">ACCURACY</span>
                </div>
              </div>

              <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Savings</span>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono text-blue-600">₹4.2L</span>
                  <span className="text-[10px] text-slate-500">REALIZED</span>
                </div>
              </div>
            </div>

            {/* History Timeline */}
            <div className="border-2 border-slate-300 bg-white overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Insight History
                </span>
                <span className="text-[10px] text-slate-400 ml-auto">Last 30 days</span>
              </div>

              <div className="divide-y divide-slate-200">
                {/* Mock history items */}
                {[
                  { id: 1, title: 'Reduce RO pressure to 12.5 bar', type: 'optimization', status: 'applied', outcome: 'helpful', date: '2 days ago', savings: '₹45,000/mo' },
                  { id: 2, title: 'Adjust chlorine dosing to 1.8 ppm', type: 'efficiency', status: 'applied', outcome: 'helpful', date: '5 days ago', savings: '₹12,000/mo' },
                  { id: 3, title: 'Schedule pump maintenance', type: 'maintenance', status: 'dismissed', outcome: null, date: '1 week ago', savings: null },
                  { id: 4, title: 'Optimize filter backwash frequency', type: 'cost', status: 'applied', outcome: 'not_helpful', date: '2 weeks ago', savings: '₹8,000/mo' },
                  { id: 5, title: 'Reduce chemical inventory buffer', type: 'cost', status: 'applied', outcome: 'helpful', date: '3 weeks ago', savings: '₹22,000/mo' },
                ].map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'p-4 hover:bg-slate-50 transition-colors',
                      item.status === 'applied' && 'border-l-[3px] border-l-emerald-500',
                      item.status === 'dismissed' && 'border-l-[3px] border-l-slate-400'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {item.status === 'applied' ? (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              APPLIED
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-600">
                              <XCircle className="h-3 w-3" />
                              DISMISSED
                            </span>
                          )}
                          <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 font-medium uppercase">
                            {item.type}
                          </span>
                          {item.outcome && (
                            <span className={cn(
                              'flex items-center gap-0.5 text-[9px] px-1.5 py-0.5',
                              item.outcome === 'helpful' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            )}>
                              {item.outcome === 'helpful' ? <ThumbsUp className="h-2.5 w-2.5" /> : <ThumbsDown className="h-2.5 w-2.5" />}
                              {item.outcome === 'helpful' ? 'Helpful' : 'Not helpful'}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-medium text-slate-700">{item.title}</h4>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500">{item.date}</div>
                        {item.savings && (
                          <div className="text-[11px] font-bold font-mono text-emerald-600 mt-1">
                            {item.savings}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More */}
              <div className="p-4 border-t-2 border-slate-200 bg-slate-50 text-center">
                <button className="text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors">
                  Load More History...
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
