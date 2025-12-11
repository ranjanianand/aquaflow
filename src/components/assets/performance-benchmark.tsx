'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  Medal,
  Award,
  Star,
  ArrowRight,
} from 'lucide-react';

interface BenchmarkData {
  plantId: string;
  plantName: string;
  shortName: string;
  efficiency: number;
  industryAvg: number;
  topPerformer: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  percentile: number;
}

const benchmarkData: BenchmarkData[] = [
  {
    plantId: 'plant-4',
    plantName: 'Bangalore WTP-04',
    shortName: 'BLR-04',
    efficiency: 96,
    industryAvg: 88,
    topPerformer: 98,
    rank: 1,
    trend: 'up',
    percentile: 95,
  },
  {
    plantId: 'plant-1',
    plantName: 'Chennai WTP-01',
    shortName: 'CHN-01',
    efficiency: 94,
    industryAvg: 88,
    topPerformer: 98,
    rank: 2,
    trend: 'up',
    percentile: 90,
  },
  {
    plantId: 'plant-5',
    plantName: 'Hyderabad WTP-05',
    shortName: 'HYD-05',
    efficiency: 92,
    industryAvg: 88,
    topPerformer: 98,
    rank: 3,
    trend: 'stable',
    percentile: 82,
  },
  {
    plantId: 'plant-2',
    plantName: 'Mumbai WTP-02',
    shortName: 'MUM-02',
    efficiency: 91,
    industryAvg: 88,
    topPerformer: 98,
    rank: 4,
    trend: 'down',
    percentile: 78,
  },
  {
    plantId: 'plant-6',
    plantName: 'Pune ETP-01',
    shortName: 'PUN-01',
    efficiency: 89,
    industryAvg: 88,
    topPerformer: 98,
    rank: 5,
    trend: 'up',
    percentile: 65,
  },
  {
    plantId: 'plant-3',
    plantName: 'Delhi WTP-03',
    shortName: 'DEL-03',
    efficiency: 88,
    industryAvg: 88,
    topPerformer: 98,
    rank: 6,
    trend: 'down',
    percentile: 52,
  },
];

const INDUSTRY_AVG = 88;
const TOP_PERFORMER = 98;

export function PerformanceBenchmark() {
  const avgEfficiency = benchmarkData.reduce((acc, d) => acc + d.efficiency, 0) / benchmarkData.length;
  const aboveAvgCount = benchmarkData.filter((d) => d.efficiency > INDUSTRY_AVG).length;
  const topPerformers = benchmarkData.filter((d) => d.percentile >= 90).length;

  const getBarColor = (efficiency: number) => {
    if (efficiency >= 95) return '#10b981'; // emerald
    if (efficiency >= 90) return '#0ea5e9'; // sky
    if (efficiency >= INDUSTRY_AVG) return '#f59e0b'; // amber
    return '#ef4444'; // rose
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
      case 'down':
        return <TrendingDown className="h-3.5 w-3.5 text-rose-500" />;
      default:
        return <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30">
          <Trophy className="h-3 w-3 text-amber-600" />
          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">Top</span>
        </div>
      );
    }
    if (rank <= 3) {
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
          <Medal className="h-3 w-3 text-blue-600" />
          <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400">#{rank}</span>
        </div>
      );
    }
    return (
      <div className="px-2 py-0.5 rounded-full bg-muted">
        <span className="text-[10px] font-medium text-muted-foreground">#{rank}</span>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border px-5 py-4 bg-muted/50">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-[14px] font-semibold">Performance Benchmarking</h3>
        </div>
      </div>

      <div className="p-5">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-xl font-bold tabular-nums">{avgEfficiency.toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground">Fleet Average</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Award className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-xl font-bold tabular-nums text-emerald-600">{aboveAvgCount}</p>
            <p className="text-[10px] text-muted-foreground">Above Industry Avg</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-xl font-bold tabular-nums text-amber-600">{topPerformers}</p>
            <p className="text-[10px] text-muted-foreground">Top 10 Percentile</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-xl font-bold tabular-nums text-purple-600">
              +{(avgEfficiency - INDUSTRY_AVG).toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground">vs Industry</p>
          </div>
        </div>

        {/* Benchmark Chart */}
        <div className="h-[250px] mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={benchmarkData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis
                type="number"
                domain={[80, 100]}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="shortName"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                width={50}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string, props: { payload?: BenchmarkData }) => [
                  `${value}% (${props.payload?.percentile ?? 0}th percentile)`,
                  props.payload?.plantName ?? '',
                ]}
              />
              <ReferenceLine
                x={INDUSTRY_AVG}
                stroke="#94a3b8"
                strokeDasharray="5 5"
                label={{
                  value: `Industry Avg (${INDUSTRY_AVG}%)`,
                  position: 'top',
                  fill: '#94a3b8',
                  fontSize: 9,
                }}
              />
              <ReferenceLine
                x={TOP_PERFORMER}
                stroke="#10b981"
                strokeDasharray="5 5"
                label={{
                  value: 'Top Performer',
                  position: 'top',
                  fill: '#10b981',
                  fontSize: 9,
                }}
              />
              <Bar dataKey="efficiency" radius={[0, 4, 4, 0]} barSize={20}>
                {benchmarkData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.efficiency)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ranking Table */}
        <div>
          <h4 className="text-[13px] font-semibold mb-3">Plant Rankings</h4>
          <div className="space-y-2">
            {benchmarkData.map((plant) => (
              <div
                key={plant.plantId}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border',
                  plant.rank === 1
                    ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20'
                    : 'border-border bg-muted/30'
                )}
              >
                <div className="flex items-center gap-3">
                  {getRankBadge(plant.rank)}
                  <div>
                    <p className="text-[12px] font-semibold">{plant.plantName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {plant.percentile}th percentile
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[14px] font-bold tabular-nums">{plant.efficiency}%</p>
                    <div className="flex items-center gap-1 justify-end">
                      {getTrendIcon(plant.trend)}
                      <span
                        className={cn(
                          'text-[10px]',
                          plant.trend === 'up' && 'text-emerald-600',
                          plant.trend === 'down' && 'text-rose-600',
                          plant.trend === 'stable' && 'text-muted-foreground'
                        )}
                      >
                        {plant.trend === 'up' ? 'Improving' : plant.trend === 'down' ? 'Declining' : 'Stable'}
                      </span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'w-2 h-10 rounded-full',
                      plant.efficiency >= 95
                        ? 'bg-emerald-500'
                        : plant.efficiency >= 90
                        ? 'bg-blue-500'
                        : plant.efficiency >= INDUSTRY_AVG
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-muted-foreground">Excellent (95%+)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="text-[10px] text-muted-foreground">Good (90-94%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-[10px] text-muted-foreground">Average (88-89%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span className="text-[10px] text-muted-foreground">Below Avg (&lt;88%)</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
