'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { InsightsSummary } from '@/components/insights/insights-summary';
import { InsightCard } from '@/components/insights/insight-card';
import { ProcessOptimization } from '@/components/insights/process-optimization';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  RefreshCw
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

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header
          title="Operational Insights"
          subtitle="AI-powered recommendations to optimize plant performance"
        />
        <InsightsSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Operational Insights"
        subtitle="AI-powered recommendations to optimize plant performance"
      />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <InsightsSummary />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="recommendations" className="gap-1.5">
                <Lightbulb className="h-4 w-4" />
                Recommendations
              </TabsTrigger>
              <TabsTrigger value="processes" className="gap-1.5">
                <SlidersHorizontal className="h-4 w-4" />
                Process Analysis
              </TabsTrigger>
            </TabsList>

            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            {/* Filters */}
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[13px] font-medium">Filters:</span>
                </div>

                {/* Type Filter Buttons */}
                <div className="flex items-center gap-1">
                  {typeFilters.map((filter) => {
                    const Icon = filter.icon;
                    const isActive = selectedType === filter.value;
                    return (
                      <Button
                        key={filter.value}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        className={cn('h-8 text-[12px]', !isActive && 'text-muted-foreground')}
                        onClick={() => setSelectedType(filter.value as InsightType)}
                      >
                        <Icon className="h-3.5 w-3.5 mr-1" />
                        {filter.label}
                      </Button>
                    );
                  })}
                </div>

                {/* Priority Dropdown */}
                <Select value={selectedPriority} onValueChange={(v) => setSelectedPriority(v as InsightPriority)}>
                  <SelectTrigger className="w-[140px] h-8 text-[12px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                {/* Plant Dropdown */}
                <Select value={selectedPlant} onValueChange={setSelectedPlant}>
                  <SelectTrigger className="w-[180px] h-8 text-[12px]">
                    <SelectValue placeholder="Plant" />
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

                {/* Results count */}
                <span className="text-[12px] text-muted-foreground ml-auto">
                  {sortedInsights.length} insight{sortedInsights.length !== 1 ? 's' : ''} found
                </span>
              </div>
            </Card>

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
              <Card className="p-12 text-center">
                <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-[15px] font-semibold mb-1">No insights found</h3>
                <p className="text-[13px] text-muted-foreground">
                  Try adjusting your filters to see more recommendations
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Process Analysis Tab */}
          <TabsContent value="processes">
            <ProcessOptimization />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
