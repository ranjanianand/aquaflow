'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { StatusBadge } from '@/components/shared/status-badge';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThresholdForecastChart } from '@/components/predictive/threshold-forecast-chart';
import { MaintenanceCalendar } from '@/components/predictive/maintenance-calendar';
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

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header
          title="Predictive Maintenance"
          subtitle="AI-powered equipment health and failure predictions"
        />
        <PredictiveSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Predictive Maintenance"
        subtitle="AI-powered equipment health and failure predictions"
      />

      <div className="p-8 space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select value={selectedPlant} onValueChange={setSelectedPlant}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by plant" />
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

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--success-bg)] text-[var(--success)]">
                <CheckCircle className="h-5 w-5" />
              </div>
              <span className="text-sm text-muted-foreground">Healthy</span>
            </div>
            <p className="text-2xl font-bold text-[var(--success)]">
              {predictions.filter((p) => p.status === 'healthy').length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Equipment units</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--info-bg)] text-[var(--info)]">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-sm text-muted-foreground">Watch</span>
            </div>
            <p className="text-2xl font-bold text-[var(--info)]">
              {predictions.filter((p) => p.status === 'watch').length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Need monitoring</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--warning-bg)] text-[var(--warning)]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <span className="text-sm text-muted-foreground">Warning</span>
            </div>
            <p className="text-2xl font-bold text-[var(--warning)]">
              {predictions.filter((p) => p.status === 'warning').length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Action required</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--danger-bg)] text-[var(--danger)]">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-sm text-muted-foreground">Critical</span>
            </div>
            <p className="text-2xl font-bold text-[var(--danger)]">
              {predictions.filter((p) => p.status === 'critical').length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Urgent attention</p>
          </Card>
        </div>

        {/* NEW: Threshold Forecast Chart */}
        <ThresholdForecastChart />

        {/* NEW: Maintenance Calendar */}
        <MaintenanceCalendar />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Equipment Health Predictions */}
          <Card>
            <CardHeader className="border-b bg-muted/50 px-6 py-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Equipment Health Predictions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {filteredPredictions.map((prediction) => {
                const config = statusConfig[prediction.status];
                const StatusIcon = config.icon;

                return (
                  <Card key={prediction.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{prediction.equipmentName}</h4>
                        <p className="text-sm text-muted-foreground">{prediction.plantName}</p>
                      </div>
                      <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold', config.bgColor, config.color)}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {config.label}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Remaining Life</p>
                        <p className="text-lg font-bold">
                          {prediction.remainingLife}{' '}
                          <span className="text-sm font-normal text-muted-foreground">
                            {prediction.remainingLifeUnit}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Health Score</p>
                        <p className="text-lg font-bold">{prediction.healthScore}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                        <p className="text-lg font-bold">{prediction.confidence}%</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Health Progress</span>
                        <span>{prediction.healthScore}%</span>
                      </div>
                      <Progress
                        value={prediction.healthScore}
                        className={cn(
                          'h-2',
                          prediction.healthScore > 70 && '[&>div]:bg-[var(--success)]',
                          prediction.healthScore <= 70 && prediction.healthScore > 40 && '[&>div]:bg-[var(--warning)]',
                          prediction.healthScore <= 40 && '[&>div]:bg-[var(--danger)]'
                        )}
                      />
                    </div>

                    <div>
                      <p className="text-xs font-semibold mb-2">Recommendations:</p>
                      <ul className="space-y-1">
                        {prediction.recommendations.slice(0, 2).map((rec, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                );
              })}
            </CardContent>
          </Card>

          {/* Anomaly Detection */}
          <div className="space-y-6">
            {/* Anomaly Chart */}
            <Card>
              <CardHeader className="border-b bg-muted/50 px-6 py-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Anomaly Detection Score
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={anomalyChartData}>
                      <defs>
                        <linearGradient id="anomalyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--warning)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                        domain={[0, 1]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${(value * 100).toFixed(0)}%`, 'Anomaly Score']}
                      />
                      <ReferenceLine
                        y={0.6}
                        stroke="var(--danger)"
                        strokeDasharray="5 5"
                        label={{ value: 'Threshold', position: 'right', fill: 'var(--danger)', fontSize: 10 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="var(--warning)"
                        strokeWidth={2}
                        fill="url(#anomalyGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Anomalies */}
            <Card>
              <CardHeader className="border-b bg-muted/50 px-6 py-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Detected Anomalies
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {anomalies.map((anomaly) => (
                  <div
                    key={anomaly.id}
                    className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        anomaly.anomalyScore > 0.8 ? 'bg-[var(--danger-bg)] text-[var(--danger)]' : 'bg-[var(--warning-bg)] text-[var(--warning)]'
                      )}
                    >
                      <Activity className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm">{anomaly.sensorName}</h4>
                        <Badge variant="outline">{anomalyTypeConfig[anomaly.type]}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{anomaly.plantName}</p>
                      <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs">Anomaly Score:</span>
                        <span
                          className={cn(
                            'text-xs font-semibold',
                            anomaly.anomalyScore > 0.8 ? 'text-[var(--danger)]' : 'text-[var(--warning)]'
                          )}
                        >
                          {(anomaly.anomalyScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
