"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

const data = [
  { name: "営業部", value: 4500000, color: "#1a56db" },
  { name: "開発部", value: 3800000, color: "#0891b2" },
  { name: "総務部", value: 2200000, color: "#6366f1" },
  { name: "経理部", value: 1950000, color: "#0d7a3e" },
];

export function DeptDonutChart() {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full">
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="space-y-2 mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-ink-sub">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-muted">
                {((item.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
