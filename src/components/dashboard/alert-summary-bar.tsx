'use client';

import { useAlertsHourly } from '@/lib/api/hooks';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface HourlyAlertData {
  hour: string;
  high: number;
  medium: number;
  low: number;
  total: number;
}

// Seeded random for deterministic data
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Hourly breach counts come from the API. What stood here generated 24 hours
// of seeded-random alerts — a distribution chart with no distribution behind
// it, sitting directly beneath a KPI tile showing the true count.

const peakHourOf = (hourlyData: HourlyAlertData[]) => hourlyData.reduce((max, hour) => (hour.total > max.total ? hour : max), hourlyData[0]);

export function AlertSummaryBar() {
  const { data, loading } = useAlertsHourly(24);
  const hourlyData: HourlyAlertData[] = data ?? [];
  const totals = hourlyData.reduce(
    (t, h) => ({
      high: t.high + h.high,
      medium: t.medium + h.medium,
      low: t.low + h.low,
      total: t.total + h.total,
    }),
    { high: 0, medium: 0, low: 0, total: 0 },
  );
  const peakHour = hourlyData.length ? peakHourOf(hourlyData) : { hour: '--' };
  // Averaged over buckets that exist, not a fixed 24. A partial day would
  // otherwise read as a quiet one.
  const perHour = hourlyData.length ? totals.total / hourlyData.length : 0;

  if (!loading && !hourlyData.length) {
    return (
      <div className="bg-card rounded-lg border border-border px-5 py-8 text-center">
        <p className="text-sm text-muted-foreground">No readings in the last 24 hours</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="text-sm font-semibold">24-Hour Alert Distribution</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose-400" />
            <span className="text-xs text-muted-foreground">{totals.high} High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
            <span className="text-xs text-muted-foreground">{totals.medium} Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-sky-400" />
            <span className="text-xs text-muted-foreground">{totals.low} Low</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums">{totals.total}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Alerts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums">{totals.high}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">High Priority</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums">{peakHour.hour}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Peak Hour</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums">{perHour.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg/Hour</p>
          </div>
        </div>

        {/* Stacked Bar Chart */}
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="hour"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                tickMargin={8}
                interval={2}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                tickMargin={4}
                width={25}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  padding: '8px 12px',
                }}
                labelStyle={{ color: '#0f172a', fontWeight: 600, fontSize: 12 }}
                itemStyle={{ color: '#475569', fontSize: 11 }}
                formatter={(value: number, name: string) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
              />
              <Bar dataKey="high" stackId="a" fill="#fb7185" radius={[0, 0, 0, 0]} />
              <Bar dataKey="medium" stackId="a" fill="#fbbf24" radius={[0, 0, 0, 0]} />
              <Bar dataKey="low" stackId="a" fill="#38bdf8" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
