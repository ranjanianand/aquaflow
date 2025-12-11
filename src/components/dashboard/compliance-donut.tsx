'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// Mild multi-color palette - soft tones
const complianceData = [
  { name: 'In Spec', value: 87, color: '#34d399' },     // Emerald 400
  { name: 'Warning', value: 9, color: '#fbbf24' },      // Amber 400
  { name: 'Out of Spec', value: 4, color: '#fb7185' },  // Rose 400
];

export function ComplianceDonut() {
  const totalInSpec = complianceData[0].value;

  return (
    <div className="bg-card rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="text-[13px] font-semibold">Compliance Overview</h3>
        <span className="text-[11px] text-muted-foreground">Last 24 hours</span>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-5">
          {/* Donut Chart */}
          <div className="relative w-[100px] h-[100px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={complianceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={32}
                  outerRadius={46}
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {complianceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold">{totalInSpec}%</span>
              <span className="text-[9px] text-muted-foreground">In Spec</span>
            </div>
          </div>

          {/* Legend & Stats */}
          <div className="flex-1 space-y-2">
            {complianceData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[11px] text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-[12px] font-semibold tabular-nums">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
