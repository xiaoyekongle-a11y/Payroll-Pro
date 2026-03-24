"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const data = [
  { month: "10月", amount: 11200000, lastYear: 10800000 },
  { month: "11月", amount: 11450000, lastYear: 10950000 },
  { month: "12月", amount: 13200000, lastYear: 12800000 },
  { month: "1月", amount: 11800000, lastYear: 11200000 },
  { month: "2月", amount: 12100000, lastYear: 11500000 },
  { month: "3月", amount: 12450000, lastYear: 11900000 },
];

export function TrendChart() {
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1a56db" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#1a56db" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorLastYear" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickFormatter={(value) => `${(value / 10000).toFixed(0)}万`}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            labelStyle={{ color: "#1a1f2e", fontWeight: 600 }}
            contentStyle={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="lastYear"
            stroke="#94a3b8"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#colorLastYear)"
            name="前年"
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#1a56db"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAmount)"
            name="今年"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
