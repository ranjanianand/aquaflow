'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { mockPlants } from '@/data/mock-plants';
import {
  Cpu,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Activity,
  Target,
  Zap,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThresholdForecastChart } from '@/components/predictive/threshold-forecast-chart';
import { MaintenanceCalendar } from '@/components/predictive/maintenance-calendar';
import { RiskMatrix } from '@/components/predictive/risk-matrix';
import { CostImpactAnalysis } from '@/components/predictive/cost-impact-analysis';
import { HealthScoreTrends } from '@/components/predictive/health-score-trends';
import { PredictiveSkeleton } from '@/components/shared/loading-skeleton';

interface PredictionResult {
  id: string;
  equipmentName: string;
  plantName: string;
  remainingLife: number;
  remainingLifeUnit: string;
  confidence: number;
  status: 'healthy' | 'watch' | 'warning' | 'critical';
  healthScore: number;
  recommendations: string[];
  lastPrediction: Date;
}

interface AnomalyDetection {
  id: string;
  sensorName: string;
  plantName: string;
  anomalyScore: number;
  detectedAt: Date;
  type: 'spike' | 'drift' | 'pattern_change' | 'flatline';
  description: string;
}

const predictions: PredictionResult[] = [
  {
    id: 'pred-1',
    equipmentName: 'RO Membrane Unit A',
    plantName: 'Chennai WTP-01',
    remainingLife: 45,
    remainingLifeUnit: 'days',
    confidence: 89,
    status: 'watch',
    healthScore: 72,
    recommendations: [
      'Schedule CIP cleaning within 2 weeks',
      'Monitor differential pressure closely',
      'Consider membrane replacement planning',
    ],
    lastPrediction: new Date(),
  },
  {
    id: 'pred-2',
    equipmentName: 'Main Feed Pump P1',
    plantName: 'Mumbai WTP-02',
    remainingLife: 120,
    remainingLifeUnit: 'days',
    confidence: 94,
    status: 'healthy',
    healthScore: 91,
    recommendations: [
      'Continue regular maintenance schedule',
      'Next bearing inspection in 60 days',
    ],
    lastPrediction: new Date(),
  },
  {
    id: 'pred-3',
    equipmentName: 'pH Sensor Bank',
    plantName: 'Delhi WTP-03',
    remainingLife: 15,
    remainingLifeUnit: 'days',
    confidence: 78,
    status: 'warning',
    healthScore: 45,
    recommendations: [
      'Schedule immediate calibration',
      'Prepare replacement sensors',
      'Verify chemical dosing accuracy',
    ],
    lastPrediction: new Date(),
  },
  {
    id: 'pred-4',
    equipmentName: 'Clarifier Drive Motor',
    plantName: 'Bangalore WTP-04',
    remainingLife: 7,
    remainingLifeUnit: 'days',
    confidence: 85,
    status: 'critical',
    healthScore: 28,
    recommendations: [
      'URGENT: Schedule immediate replacement',
      'Arrange backup equipment',
      'Alert operations team',
    ],
    lastPrediction: new Date(),
  },
];

const anomalies: AnomalyDetection[] = [
  {
    id: 'anom-1',
    sensorName: 'Flow Sensor FS-102',
    plantName: 'Chennai WTP-01',
    anomalyScore: 0.85,
    detectedAt: new Date(Date.now() - 2 * 3600000),
    type: 'spike',
    description: 'Unusual flow rate spike detected, 35% above normal pattern',
  },
  {
    id: 'anom-2',
    sensorName: 'Pressure Sensor PS-201',
    plantName: 'Mumbai WTP-02',
    anomalyScore: 0.72,
    detectedAt: new Date(Date.now() - 5 * 3600000),
    type: 'drift',
    description: 'Gradual drift in pressure readings over 48 hours',
  },
  {
    id: 'anom-3',
    sensorName: 'Temperature Sensor TS-301',
    plantName: 'Delhi WTP-03',
    anomalyScore: 0.68,
    detectedAt: new Date(Date.now() - 8 * 3600000),
    type: 'pattern_change',
    description: 'Changed from normal diurnal pattern',
  },
];

// Generate anomaly detection chart data
const generateAnomalyChartData = () => {
  const data = [];
  const now = Date.now();

  for (let i = 24; i >= 0; i--) {
    const timestamp = new Date(now - i * 3600000);
    const baseValue = 0.2 + Math.random() * 0.1;
    const anomaly = i === 5 || i === 8 ? 0.7 + Math.random() * 0.2 : baseValue;

    data.push({
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      score: parseFloat(anomaly.toFixed(2)),
    });
  }

  return data;
};

const anomalyChartData = generateAnomalyChartData();

export default function PredictivePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState('all');

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const statusConfig: Record<
    string,
    { color: string; bgColor: string; label: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    healthy: {
      color: 'text-[var(--success)]',
      bgColor: 'bg-[var(--success-bg)]',
      label: 'Healthy',
      icon: CheckCircle,
    },
    watch: {
      color: 'text-[var(--info)]',
      bgColor: 'bg-[var(--info-bg)]',
      label: 'Watch',
      icon: Activity,
    },
    warning: {
      color: 'text-[var(--warning)]',
      bgColor: 'bg-[var(--warning-bg)]',
      label: 'Warning',
      icon: AlertTriangle,
    },
    critical: {
      color: 'text-[var(--danger)]',
      bgColor: 'bg-[var(--danger-bg)]',
      label: 'Critical',
      icon: Zap,
    },
  };

  const anomalyTypeConfig: Record<string, string> = {
    spike: 'Spike',
    drift: 'Drift',
    pattern_change: 'Pattern Change',
    flatline: 'Flatline',
  };

  const filteredPredictions =
    selectedPlant === 'all'
      ? predictions
      : predictions.filter((p) =>
          mockPlants.find((plant) => plant.name === p.plantName)?.id === selectedPlant
        );

  const healthyCount = predictions.filter((p) => p.status === 'healthy').length;
  const watchCount = predictions.filter((p) => p.status === 'watch').length;
  const warningCount = predictions.filter((p) => p.status === 'warning').length;
  const criticalCount = predictions.filter((p) => p.status === 'critical').length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Cpu className="h-4 w-4 text-white" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Predictive Maintenance</span>
            <span className="text-[10px] text-slate-400">AI-powered equipment health predictions</span>
          </div>
        </header>
        <PredictiveSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Industrial Header Bar */}
      <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Cpu className="h-4 w-4 text-white" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Predictive Maintenance</span>
          <span className="text-[10px] text-slate-400">AI-powered equipment health predictions</span>
        </div>
        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-red-600 text-white text-[10px] font-bold">
              <Zap className="h-3 w-3" />
              {criticalCount} CRITICAL
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-amber-600 text-white text-[10px] font-bold">
              {warningCount} WARN
            </span>
          )}
          <span className="text-[10px] font-mono text-emerald-400">AI MODEL ACTIVE</span>
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {/* Filter Bar */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Filter:</span>
          <div className="relative">
            <select
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
              className="h-8 px-3 pr-8 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
            >
              <option value="all">All Plants</option>
              {mockPlants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Industrial Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Healthy */}
          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-emerald-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Healthy</span>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-emerald-600">{healthyCount}</span>
              <span className="text-[10px] text-slate-500">EQUIPMENT UNITS</span>
            </div>
          </div>

          {/* Watch */}
          <div className={cn(
            'border-2 border-slate-300 bg-white p-4',
            watchCount > 0 && 'border-l-[3px] border-l-blue-500'
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Watch</span>
              <Activity className={cn('h-4 w-4', watchCount > 0 ? 'text-blue-600' : 'text-slate-400')} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                'text-3xl font-bold font-mono',
                watchCount > 0 ? 'text-blue-600' : 'text-slate-700'
              )}>{watchCount}</span>
              <span className="text-[10px] text-slate-500">NEED MONITORING</span>
            </div>
          </div>

          {/* Warning */}
          <div className={cn(
            'border-2 border-slate-300 bg-white p-4',
            warningCount > 0 && 'border-l-[3px] border-l-amber-500'
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Warning</span>
              <AlertTriangle className={cn('h-4 w-4', warningCount > 0 ? 'text-amber-600' : 'text-slate-400')} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                'text-3xl font-bold font-mono',
                warningCount > 0 ? 'text-amber-600' : 'text-slate-700'
              )}>{warningCount}</span>
              <span className="text-[10px] text-slate-500">ACTION REQUIRED</span>
            </div>
          </div>

          {/* Critical */}
          <div className={cn(
            'border-2 border-slate-300 bg-white p-4',
            criticalCount > 0 && 'border-l-[3px] border-l-red-500'
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Critical</span>
              <Zap className={cn('h-4 w-4', criticalCount > 0 ? 'text-red-600' : 'text-slate-400')} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                'text-3xl font-bold font-mono',
                criticalCount > 0 ? 'text-red-600' : 'text-slate-700'
              )}>{criticalCount}</span>
              <span className="text-[10px] text-slate-500">URGENT ATTENTION</span>
            </div>
          </div>
        </div>

        {/* NEW: Risk Assessment & Health Trends Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <RiskMatrix />
          <HealthScoreTrends />
        </div>

        {/* NEW: Cost Impact Analysis */}
        <CostImpactAnalysis />

        {/* Threshold Forecast Chart */}
        <ThresholdForecastChart />

        {/* Maintenance Calendar */}
        <MaintenanceCalendar />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Equipment Health Predictions */}
          <div className="border-2 border-slate-300 bg-white overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Equipment Health Predictions
              </span>
            </div>
            <div className="divide-y divide-slate-200 max-h-[500px] overflow-y-auto">
              {filteredPredictions.map((prediction) => {
                const config = statusConfig[prediction.status];
                const StatusIcon = config.icon;

                return (
                  <div
                    key={prediction.id}
                    className={cn(
                      'p-4 hover:bg-slate-50 transition-colors cursor-pointer',
                      prediction.status === 'critical' && 'border-l-[3px] border-l-red-500',
                      prediction.status === 'warning' && 'border-l-[3px] border-l-amber-500',
                      prediction.status === 'watch' && 'border-l-[3px] border-l-blue-500',
                      prediction.status === 'healthy' && 'border-l-[3px] border-l-emerald-500'
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-medium text-slate-700">{prediction.equipmentName}</h4>
                        <p className="text-[10px] text-slate-500">{prediction.plantName}</p>
                      </div>
                      <span className={cn(
                        'flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold',
                        prediction.status === 'critical' && 'bg-red-100 text-red-700',
                        prediction.status === 'warning' && 'bg-amber-100 text-amber-700',
                        prediction.status === 'watch' && 'bg-blue-100 text-blue-700',
                        prediction.status === 'healthy' && 'bg-emerald-100 text-emerald-700'
                      )}>
                        <StatusIcon className="h-3 w-3" />
                        {config.label.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-[10px] text-slate-500 mb-0.5">REMAINING LIFE</p>
                        <p className="text-lg font-bold font-mono text-slate-700">
                          {prediction.remainingLife}
                          <span className="text-[10px] font-normal text-slate-500 ml-1">
                            {prediction.remainingLifeUnit}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 mb-0.5">HEALTH SCORE</p>
                        <p className={cn(
                          'text-lg font-bold font-mono',
                          prediction.healthScore > 70 && 'text-emerald-600',
                          prediction.healthScore <= 70 && prediction.healthScore > 40 && 'text-amber-600',
                          prediction.healthScore <= 40 && 'text-red-600'
                        )}>{prediction.healthScore}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 mb-0.5">CONFIDENCE</p>
                        <p className="text-lg font-bold font-mono text-slate-700">{prediction.confidence}%</p>
                      </div>
                    </div>

                    {/* Health Bar */}
                    <div className="mb-3">
                      <div className="h-1.5 bg-slate-200 overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all',
                            prediction.healthScore > 70 && 'bg-emerald-500',
                            prediction.healthScore <= 70 && prediction.healthScore > 40 && 'bg-amber-500',
                            prediction.healthScore <= 40 && 'bg-red-500'
                          )}
                          style={{ width: `${prediction.healthScore}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Recommendations:</p>
                      <ul className="space-y-0.5">
                        {prediction.recommendations.slice(0, 2).map((rec, idx) => (
                          <li key={idx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                            <ChevronRight className="h-3 w-3 text-slate-400 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Anomaly Detection Column */}
          <div className="space-y-4">
            {/* Anomaly Chart */}
            <div className="border-2 border-slate-300 bg-white overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Anomaly Detection Score
                </span>
              </div>
              <div className="p-4">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={anomalyChartData}>
                      <defs>
                        <linearGradient id="anomalyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        domain={[0, 1]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '2px solid #cbd5e1',
                          borderRadius: '0',
                          fontSize: '11px',
                        }}
                        formatter={(value: number) => [`${(value * 100).toFixed(0)}%`, 'Anomaly Score']}
                      />
                      <ReferenceLine
                        y={0.6}
                        stroke="#ef4444"
                        strokeDasharray="5 5"
                        label={{ value: 'Threshold', position: 'right', fill: '#ef4444', fontSize: 10 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fill="url(#anomalyGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Anomalies */}
            <div className="border-2 border-slate-300 bg-white overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-slate-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Detected Anomalies
                  </span>
                </div>
                <span className="text-[10px] font-mono text-amber-600 font-bold">{anomalies.length} DETECTED</span>
              </div>
              <div className="divide-y divide-slate-200 max-h-[250px] overflow-y-auto">
                {anomalies.map((anomaly) => (
                  <div
                    key={anomaly.id}
                    className={cn(
                      'p-4 hover:bg-slate-50 transition-colors cursor-pointer',
                      anomaly.anomalyScore > 0.8 ? 'border-l-[3px] border-l-red-500' : 'border-l-[3px] border-l-amber-500'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-slate-700">{anomaly.sensorName}</h4>
                        <p className="text-[10px] text-slate-500">{anomaly.plantName}</p>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600">
                        {anomalyTypeConfig[anomaly.type].toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mb-2">{anomaly.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">Score:</span>
                      <span className={cn(
                        'text-[11px] font-bold font-mono',
                        anomaly.anomalyScore > 0.8 ? 'text-red-600' : 'text-amber-600'
                      )}>
                        {(anomaly.anomalyScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
