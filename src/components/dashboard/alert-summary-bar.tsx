'use client';

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

// Generate 24 hours of alert data
const generateHourlyData = (): HourlyAlertData[] => {
  const data: HourlyAlertData[] = [];
  const now = new Date();
  const currentHour = now.getHours();

  for (let i = 23; i >= 0; i--) {
    const hour = (currentHour - i + 24) % 24;
    const seed = hour * 17;

    // More alerts during working hours (6-22)
    const isWorkHours = hour >= 6 && hour <= 22;
    const baseMultiplier = isWorkHours ? 1.5 : 0.5;

    const high = Math.floor(seededRandom(seed) * 2 * baseMultiplier);
    const medium = Math.floor(seededRandom(seed + 1) * 4 * baseMultiplier);
    const low = Math.floor(seededRandom(seed + 2) * 3 * baseMultiplier);

    data.push({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      high,
      medium,
      low,
      total: high + medium + low,
    });
  }

  return data;
};

const hourlyData = generateHourlyData();

// Calculate totals
const totals = hourlyData.reduce(
  (acc, hour) => ({
    high: acc.high + hour.high,
    medium: acc.medium + hour.medium,
    low: acc.low + hour.low,
    total: acc.total + hour.total,
  }),
  { high: 0, medium: 0, low: 0, total: 0 }
);

// Find peak hour
const peakHour = hourlyData.reduce((max, hour) => (hour.total > max.total ? hour : max), hourlyData[0]);

export function AlertSummaryBar() {
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
            <p className="text-2xl font-bold tabular-nums">{(totals.total / 24).toFixed(1)}</p>
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
