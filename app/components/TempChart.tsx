"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

type HourData = { hour: string; temp: number; feels: number };
type Times = { morning: string; evening: string };

type Props = {
  today: HourData[];
  yesterday: HourData[];
  todayColor: string;
  times: Times;
};

function EmojiLabel({ viewBox, emoji }: { viewBox?: { x: number; y: number }; emoji: string }) {
  if (!viewBox) return null;
  return (
    <text x={viewBox.x} y={viewBox.y - 4} textAnchor="middle" fontSize={16}>
      {emoji}
    </text>
  );
}

export default function TempChart({ today, yesterday, todayColor, times }: Props) {
  const data = today.map((t, i) => ({
    hour: t.hour,
    今日: t.feels,
    昨日: yesterday[i]?.feels ?? null,
  }));

  const allTemps = [...today, ...yesterday].map((d) => d.feels);
  const minTemp = Math.floor(Math.min(...allTemps)) - 2;
  const maxTemp = Math.ceil(Math.max(...allTemps)) + 2;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 12 }}
          interval={2}
          tickLine={false}
        />
        <YAxis
          domain={[minTemp, maxTemp]}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          unit="°"
        />
        <Tooltip
          formatter={(value, name) => [`${value}°C`, name as string]}
          labelFormatter={(label) => `${label}`}
        />
        <Legend />
        <ReferenceLine
          x={times.morning}
          stroke="#9ca3af"
          strokeDasharray="4 2"
          label={(props) => <EmojiLabel {...props} emoji="🌅" />}
        />
        <ReferenceLine
          x={times.evening}
          stroke="#9ca3af"
          strokeDasharray="4 2"
          label={(props) => <EmojiLabel {...props} emoji="🌙" />}
        />
        <Line
          type="monotone"
          dataKey="昨日"
          stroke="#94a3b8"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="今日"
          stroke={todayColor}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
