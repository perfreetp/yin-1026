import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface HealthTrendChartProps {
  data: { name: string; value: number; isAbnormal: boolean }[];
  indicatorName: string;
  unit: string;
  color?: string;
}

export function HealthTrendChart({
  data,
  indicatorName,
  unit,
  color = "#0A6EBD",
}: HealthTrendChartProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">
        {indicatorName} 趋势
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#868E96" />
          <YAxis tick={{ fontSize: 12 }} stroke="#868E96" />
          <Tooltip
            formatter={(value: number) => [`${value} ${unit}`, indicatorName]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #f0f0f0",
              fontSize: "12px",
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={(props: Record<string, unknown>) => {
              const { cx, cy, payload } = props as {
                cx: number;
                cy: number;
                payload: { isAbnormal: boolean };
              };
              return (
                <circle
                  key={`dot-${cx}-${cy}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={payload.isAbnormal ? "#FA5252" : color}
                  stroke={payload.isAbnormal ? "#FA5252" : color}
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
