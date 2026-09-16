"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const AXIS_COLOR = "#6b7268";
const GRID_COLOR = "#e4e1d8";
const BAR_COLOR = "#16332c";
const LINE_COLOR = "#a9824c";

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-md">
      <div className="font-medium">{label}</div>
      <div className="text-muted-foreground">{payload[0].value} requests</div>
    </div>
  );
}

export function HorizontalBarChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke={GRID_COLOR} />
        <XAxis type="number" tick={{ fontSize: 11, fill: AXIS_COLOR }} allowDecimals={false} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
        <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12, fill: AXIS_COLOR }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(22,51,44,0.06)" }} />
        <Bar dataKey="value" fill={BAR_COLOR} radius={[0, 4, 4, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendLineChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke={GRID_COLOR} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: AXIS_COLOR }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} allowDecimals={false} axisLine={false} tickLine={false} width={28} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: GRID_COLOR }} />
        <Line type="monotone" dataKey="value" stroke={LINE_COLOR} strokeWidth={2} dot={{ r: 3, fill: LINE_COLOR }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
