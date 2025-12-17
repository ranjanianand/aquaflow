'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Cpu,
  Zap,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Target,
  Gauge,
  DollarSign,
  Activity,
  Play,
  Pause,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  History,
  Filter,
  BarChart3,
  Sparkles,
  Shield,
  Leaf,
  Droplets,
  Wrench,
  RefreshCw,
  Eye,
  Settings,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import {
  mockRecommendations,
  getOptimizationStats,
  getPendingRecommendations,
  getAppliedRecommendations,
  getCategoryLabel,
  getRiskLabel,
  type OptimizationRecommendation,
} from '@/data/mock-optimization';
import { mockPlants } from '@/data/mock-plants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type TabValue = 'pending' | 'history' | 'analytics';
type CategoryFilter = 'all' | 'energy' | 'quality' | 'throughput' | 'maintenance';

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  energy: Zap,
  quality: Droplets,
  throughput: TrendingUp,
  maintenance: Wrench,
};

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  energy: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-l-amber-500' },
  quality: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-l-blue-500' },
  throughput: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-l-emerald-500' },
  maintenance: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-l-purple-500' },
};

const riskColors: Record<string, { bg: string; text: string }> = {
  low: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700' },
  high: { bg: 'bg-red-100', text: 'text-red-700' },
};

export default function AutonomousOptimizationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>('pending');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [plantFilter, setPlantFilter] = useState('all');
  const [selectedRecommendation, setSelectedRecommendation] = useState<OptimizationRecommendation | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [modifiedValue, setModifiedValue] = useState<string>('');
  const [aiEnabled, setAiEnabled] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const stats = getOptimizationStats();
  const pendingRecommendations = getPendingRecommendations();
  const appliedRecommendations = getAppliedRecommendations();

  const filteredRecommendations = useMemo(() => {
    let recommendations = activeTab === 'pending'
      ? pendingRecommendations
      : mockRecommendations.filter(r => r.status !== 'pending');

    if (categoryFilter !== 'all') {
      recommendations = recommendations.filter(r => r.category === categoryFilter);
    }

    if (plantFilter !== 'all') {
      recommendations = recommendations.filter(r => r.plantId === plantFilter);
    }

    return recommendations;
  }, [activeTab, categoryFilter, plantFilter]);

  const handleApprove = (recommendation: OptimizationRecommendation) => {
    toast.success('Recommendation Approved', {
      description: `${recommendation.parameterName} will be adjusted to ${recommendation.recommendedValue} ${recommendation.unit}`,
    });
    setDetailModalOpen(false);
  };

  const handleReject = (recommendation: OptimizationRecommendation) => {
    toast.info('Recommendation Rejected', {
      description: 'The AI will learn from this feedback to improve future recommendations.',
    });
    setDetailModalOpen(false);
  };

  const handleModify = () => {
    if (selectedRecommendation && modifiedValue) {
      toast.success('Modified Value Approved', {
        description: `${selectedRecommendation.parameterName} will be adjusted to ${modifiedValue} ${selectedRecommendation.unit}`,
      });
      setModifyModalOpen(false);
      setDetailModalOpen(false);
    }
  };

  const openModifyModal = (recommendation: OptimizationRecommendation) => {
    setSelectedRecommendation(recommendation);
    setModifiedValue(recommendation.recommendedValue.toString());
    setModifyModalOpen(true);
  };

  const getTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Cpu className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Autonomous Optimization</span>
          </div>
        </header>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 bg-slate-200 border-2 border-slate-300" />
              ))}
            </div>
            <div className="h-96 bg-slate-200 border-2 border-slate-300" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Industrial Header */}
      <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Cpu className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Autonomous Optimization</span>
          <span className="text-[10px] text-slate-400">AI-Powered Process Control</span>
        </div>
        <div className="flex items-center gap-3">
          {/* AI Status Toggle */}
          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase transition-colors',
              aiEnabled
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-600 text-slate-300'
            )}
          >
            {aiEnabled ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            AI {aiEnabled ? 'ACTIVE' : 'PAUSED'}
          </button>
          {pendingRecommendations.length > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-purple-600 text-white text-[10px] font-bold">
              <Sparkles className="h-3 w-3" />
              {pendingRecommendations.length} PENDING
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Pending Approval */}
          <div className={cn(
            'border-2 border-slate-300 bg-white p-4',
            stats.pendingApproval > 0 && 'border-l-[3px] border-l-purple-500'
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending</span>
              <Clock className={cn('h-4 w-4', stats.pendingApproval > 0 ? 'text-purple-600' : 'text-slate-400')} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                'text-2xl font-bold font-mono',
                stats.pendingApproval > 0 ? 'text-purple-600' : 'text-slate-700'
              )}>{stats.pendingApproval}</span>
              <span className="text-[10px] text-slate-500">AWAITING REVIEW</span>
            </div>
          </div>

          {/* Applied This Week */}
          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-emerald-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Applied</span>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-600">{stats.appliedThisWeek}</span>
              <span className="text-[10px] text-slate-500">THIS WEEK</span>
            </div>
          </div>

          {/* Success Rate */}
          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Success Rate</span>
              <Target className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-blue-600">{stats.successRate}%</span>
              <span className="text-[10px] text-slate-500">TARGETS MET</span>
            </div>
          </div>

          {/* Total Savings */}
          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-amber-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Savings</span>
              <DollarSign className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-amber-600">
                {(stats.totalSavings / 1000).toFixed(1)}K
              </span>
              <span className="text-[10px] text-slate-500">{stats.savingsUnit}</span>
            </div>
          </div>

          {/* AI Confidence */}
          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">AI Confidence</span>
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-purple-600">87%</span>
              <span className="text-[10px] text-slate-500">AVG SCORE</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {[
              { id: 'pending' as TabValue, label: 'Pending Approval', icon: Clock, count: stats.pendingApproval },
              { id: 'history' as TabValue, label: 'History', icon: History },
              { id: 'analytics' as TabValue, label: 'Analytics', icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase transition-colors',
                    activeTab === tab.id
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-slate-300'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={cn(
                      'ml-1 px-1.5 py-0.5 text-[9px]',
                      activeTab === tab.id ? 'bg-purple-500' : 'bg-purple-600 text-white'
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                className="h-8 px-3 pr-8 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
              >
                <option value="all">All Categories</option>
                <option value="energy">Energy</option>
                <option value="quality">Quality</option>
                <option value="throughput">Throughput</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={plantFilter}
                onChange={(e) => setPlantFilter(e.target.value)}
                className="h-8 px-3 pr-8 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
              >
                <option value="all">All Plants</option>
                {mockPlants.map((plant) => (
                  <option key={plant.id} value={plant.id}>
                    {plant.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        {activeTab === 'pending' && (
          <div className="space-y-3">
            {filteredRecommendations.length === 0 ? (
              <div className="border-2 border-slate-300 bg-white p-12 text-center">
                <Sparkles className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Pending Recommendations</h3>
                <p className="text-sm text-slate-500">
                  The AI is continuously analyzing your systems. New recommendations will appear here.
                </p>
              </div>
            ) : (
              filteredRecommendations.map((rec) => {
                const CategoryIcon = categoryIcons[rec.category] || Activity;
                const colors = categoryColors[rec.category];
                const riskColor = riskColors[rec.riskLevel];
                const timeRemaining = getTimeRemaining(rec.expiresAt);
                const isExpiringSoon = rec.expiresAt.getTime() - new Date().getTime() < 2 * 60 * 60 * 1000;

                return (
                  <div
                    key={rec.id}
                    className={cn(
                      'border-2 border-slate-300 bg-white overflow-hidden',
                      colors.border,
                      'border-l-[4px]'
                    )}
                  >
                    {/* Recommendation Header */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className={cn('p-2', colors.bg)}>
                            <CategoryIcon className={cn('h-5 w-5', colors.text)} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-slate-800">{rec.equipmentName}</h3>
                              <span className={cn(
                                'px-1.5 py-0.5 text-[9px] font-bold uppercase',
                                colors.bg, colors.text
                              )}>
                                {getCategoryLabel(rec.category)}
                              </span>
                              <span className={cn(
                                'px-1.5 py-0.5 text-[9px] font-bold uppercase',
                                riskColor.bg, riskColor.text
                              )}>
                                {getRiskLabel(rec.riskLevel)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">{rec.plantName}</p>
                          </div>
                        </div>

                        {/* Time & Confidence */}
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-slate-500">Confidence:</span>
                            <span className={cn(
                              'text-sm font-bold font-mono',
                              rec.confidenceScore >= 90 ? 'text-emerald-600' :
                              rec.confidenceScore >= 80 ? 'text-blue-600' :
                              rec.confidenceScore >= 70 ? 'text-amber-600' : 'text-red-600'
                            )}>
                              {rec.confidenceScore}%
                            </span>
                          </div>
                          <div className={cn(
                            'flex items-center gap-1 text-[10px]',
                            isExpiringSoon ? 'text-red-600' : 'text-slate-500'
                          )}>
                            <Clock className="h-3 w-3" />
                            <span>Expires in {timeRemaining}</span>
                          </div>
                        </div>
                      </div>

                      {/* Before/After Comparison */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        {/* Current Value */}
                        <div className="p-3 bg-slate-50 border border-slate-200">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Current</p>
                          <p className="text-lg font-bold font-mono text-slate-700">
                            {rec.currentValue}
                            <span className="text-[11px] font-normal text-slate-500 ml-1">{rec.unit}</span>
                          </p>
                          <p className="text-[10px] text-slate-500">{rec.parameterName}</p>
                        </div>

                        {/* Arrow */}
                        <div className="flex items-center justify-center">
                          <div className="flex flex-col items-center">
                            <ChevronRight className="h-8 w-8 text-purple-500" />
                            <span className="text-[9px] font-bold text-purple-600 uppercase">AI Suggests</span>
                          </div>
                        </div>

                        {/* Recommended Value */}
                        <div className="p-3 bg-purple-50 border border-purple-200">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-purple-600 mb-1">Recommended</p>
                          <p className="text-lg font-bold font-mono text-purple-700">
                            {rec.recommendedValue}
                            <span className="text-[11px] font-normal text-purple-500 ml-1">{rec.unit}</span>
                          </p>
                          <p className="text-[10px] text-purple-600">{rec.parameterName}</p>
                        </div>
                      </div>

                      {/* Expected Outcome */}
                      <div className="p-3 bg-emerald-50 border border-emerald-200 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 mb-1">
                              Expected Outcome
                            </p>
                            <p className="text-sm text-slate-700">
                              <span className="font-semibold">{rec.expectedImprovement.metric}:</span>{' '}
                              <span className="font-mono">{rec.expectedImprovement.currentValue}</span>
                              <span className="mx-2">→</span>
                              <span className="font-mono font-bold text-emerald-700">
                                {rec.expectedImprovement.projectedValue}
                              </span>{' '}
                              <span className="text-slate-500">{rec.expectedImprovement.unit}</span>
                            </p>
                          </div>
                          <div className={cn(
                            'flex items-center gap-1 px-2 py-1',
                            rec.expectedImprovement.percentChange < 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                          )}>
                            {rec.expectedImprovement.percentChange < 0 ? (
                              <TrendingDown className="h-4 w-4" />
                            ) : (
                              <TrendingUp className="h-4 w-4" />
                            )}
                            <span className="text-sm font-bold font-mono">
                              {Math.abs(rec.expectedImprovement.percentChange).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Reasoning */}
                      <div className="mb-4">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          AI Reasoning
                        </p>
                        <p className="text-[12px] text-slate-600 leading-relaxed">
                          {rec.reasoning}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(rec)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-[11px] font-bold uppercase hover:bg-emerald-700 transition-colors"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => openModifyModal(rec)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-[11px] font-bold uppercase hover:bg-blue-700 transition-colors"
                        >
                          <Edit3 className="h-4 w-4" />
                          Modify
                        </button>
                        <button
                          onClick={() => handleReject(rec)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-600 text-white text-[11px] font-bold uppercase hover:bg-slate-700 transition-colors"
                        >
                          <ThumbsDown className="h-4 w-4" />
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRecommendation(rec);
                            setDetailModalOpen(true);
                          }}
                          className="px-4 py-2.5 border-2 border-slate-300 text-slate-600 text-[11px] font-bold uppercase hover:bg-slate-50 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="border-2 border-slate-300 bg-white overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
              <History className="h-4 w-4 text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Optimization History
              </span>
            </div>
            <div className="divide-y divide-slate-200">
              {filteredRecommendations.map((rec) => {
                const CategoryIcon = categoryIcons[rec.category] || Activity;
                const colors = categoryColors[rec.category];

                return (
                  <div key={rec.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn('p-2', colors.bg)}>
                          <CategoryIcon className={cn('h-4 w-4', colors.text)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-slate-700">{rec.equipmentName}</h4>
                            <span className={cn(
                              'px-1.5 py-0.5 text-[9px] font-bold uppercase',
                              rec.status === 'applied' ? 'bg-emerald-100 text-emerald-700' :
                              rec.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-600'
                            )}>
                              {rec.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mb-2">
                            {rec.plantName} • {rec.parameterName}: {rec.currentValue} → {rec.recommendedValue} {rec.unit}
                          </p>
                          {rec.actualOutcome && (
                            <div className={cn(
                              'inline-flex items-center gap-1.5 px-2 py-1 text-[10px]',
                              rec.actualOutcome.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            )}>
                              {rec.actualOutcome.success ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              <span>
                                Achieved: {rec.actualOutcome.achievedValue} {rec.actualOutcome.unit}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {rec.approvedBy && (
                          <p className="text-[10px] text-slate-500">
                            {rec.status === 'applied' ? 'Approved' : 'Reviewed'} by {rec.approvedBy}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400">
                          {format(rec.createdAt, 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Distribution */}
            <div className="border-2 border-slate-300 bg-white overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-slate-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Recommendations by Category
                </span>
              </div>
              <div className="p-4 space-y-3">
                {['energy', 'quality', 'throughput', 'maintenance'].map((category) => {
                  const count = mockRecommendations.filter(r => r.category === category).length;
                  const percentage = Math.round((count / mockRecommendations.length) * 100);
                  const CategoryIcon = categoryIcons[category];
                  const colors = categoryColors[category];

                  return (
                    <div key={category} className="flex items-center gap-3">
                      <div className={cn('p-2', colors.bg)}>
                        <CategoryIcon className={cn('h-4 w-4', colors.text)} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-semibold text-slate-700">
                            {getCategoryLabel(category)}
                          </span>
                          <span className="text-[11px] font-bold font-mono text-slate-600">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-slate-200 overflow-hidden">
                          <div
                            className={cn('h-full', colors.bg.replace('50', '500'))}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Success Metrics */}
            <div className="border-2 border-slate-300 bg-white overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
                <Target className="h-4 w-4 text-slate-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  AI Performance Metrics
                </span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-center">
                  <p className="text-2xl font-bold font-mono text-emerald-600">94%</p>
                  <p className="text-[10px] font-bold uppercase text-emerald-700">Accuracy Rate</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 text-center">
                  <p className="text-2xl font-bold font-mono text-blue-600">2.3h</p>
                  <p className="text-[10px] font-bold uppercase text-blue-700">Avg Response Time</p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 text-center">
                  <p className="text-2xl font-bold font-mono text-amber-600">78%</p>
                  <p className="text-[10px] font-bold uppercase text-amber-700">Approval Rate</p>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 text-center">
                  <p className="text-2xl font-bold font-mono text-purple-600">12</p>
                  <p className="text-[10px] font-bold uppercase text-purple-700">Learning Cycles</p>
                </div>
              </div>
            </div>

            {/* Recent Savings */}
            <div className="lg:col-span-2 border-2 border-slate-300 bg-white overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-slate-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Realized Savings (Last 30 Days)
                </span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 border border-slate-200">
                    <Zap className="h-5 w-5 text-amber-500 mx-auto mb-2" />
                    <p className="text-lg font-bold font-mono text-slate-700">18,500</p>
                    <p className="text-[9px] text-slate-500 uppercase">kWh Saved</p>
                  </div>
                  <div className="text-center p-3 border border-slate-200">
                    <Droplets className="h-5 w-5 text-blue-500 mx-auto mb-2" />
                    <p className="text-lg font-bold font-mono text-slate-700">2,340</p>
                    <p className="text-[9px] text-slate-500 uppercase">m³ Water Saved</p>
                  </div>
                  <div className="text-center p-3 border border-slate-200">
                    <Leaf className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
                    <p className="text-lg font-bold font-mono text-slate-700">4.2</p>
                    <p className="text-[9px] text-slate-500 uppercase">Tons CO₂ Reduced</p>
                  </div>
                  <div className="text-center p-3 border border-slate-200">
                    <DollarSign className="h-5 w-5 text-green-500 mx-auto mb-2" />
                    <p className="text-lg font-bold font-mono text-slate-700">₹45.2K</p>
                    <p className="text-[9px] text-slate-500 uppercase">Cost Savings</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modify Value Modal */}
      <Dialog open={modifyModalOpen} onOpenChange={setModifyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-blue-600" />
              Modify Recommended Value
            </DialogTitle>
          </DialogHeader>
          {selectedRecommendation && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Parameter
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {selectedRecommendation.parameterName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Current
                  </p>
                  <p className="text-lg font-bold font-mono text-slate-700">
                    {selectedRecommendation.currentValue} {selectedRecommendation.unit}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-1">
                    AI Suggested
                  </p>
                  <p className="text-lg font-bold font-mono text-purple-700">
                    {selectedRecommendation.recommendedValue} {selectedRecommendation.unit}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                  Your Modified Value
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={modifiedValue}
                    onChange={(e) => setModifiedValue(e.target.value)}
                    className="flex-1 h-10 px-3 text-lg font-mono border-2 border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-sm text-slate-500">{selectedRecommendation.unit}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                  <p className="text-[11px] text-amber-700">
                    The AI will learn from your modification to improve future recommendations.
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setModifyModalOpen(false)}
              className="px-4 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleModify}
              className="px-4 py-2 text-[11px] font-bold uppercase bg-blue-600 text-white hover:bg-blue-700"
            >
              Apply Modified Value
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Recommendation Details
            </DialogTitle>
          </DialogHeader>
          {selectedRecommendation && (
            <div className="space-y-4 py-4">
              {/* Equipment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Equipment</p>
                  <p className="text-sm font-semibold text-slate-700">{selectedRecommendation.equipmentName}</p>
                  <p className="text-[11px] text-slate-500">{selectedRecommendation.plantName}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Category</p>
                  <p className="text-sm font-semibold text-slate-700">{getCategoryLabel(selectedRecommendation.category)}</p>
                  <p className="text-[11px] text-slate-500">Risk: {getRiskLabel(selectedRecommendation.riskLevel)}</p>
                </div>
              </div>

              {/* Full Reasoning */}
              <div className="p-4 bg-purple-50 border border-purple-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-2">
                  AI Analysis & Reasoning
                </p>
                <p className="text-[13px] text-slate-700 leading-relaxed">
                  {selectedRecommendation.reasoning}
                </p>
              </div>

              {/* Data Sources */}
              <div className="p-3 border border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Data Sources Analyzed
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-[10px] bg-slate-100 text-slate-600">7-day sensor history</span>
                  <span className="px-2 py-1 text-[10px] bg-slate-100 text-slate-600">Flow rate patterns</span>
                  <span className="px-2 py-1 text-[10px] bg-slate-100 text-slate-600">Energy consumption logs</span>
                  <span className="px-2 py-1 text-[10px] bg-slate-100 text-slate-600">Similar equipment benchmarks</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                <button
                  onClick={() => handleApprove(selectedRecommendation)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-[11px] font-bold uppercase hover:bg-emerald-700"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    openModifyModal(selectedRecommendation);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-[11px] font-bold uppercase hover:bg-blue-700"
                >
                  <Edit3 className="h-4 w-4" />
                  Modify
                </button>
                <button
                  onClick={() => handleReject(selectedRecommendation)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-600 text-white text-[11px] font-bold uppercase hover:bg-slate-700"
                >
                  <ThumbsDown className="h-4 w-4" />
                  Reject
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
