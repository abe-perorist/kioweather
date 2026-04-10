"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type HourData = { hour: string; temp: number; feels: number };

type Props = {
  today: HourData[];
  yesterday: HourData[];
  todayColor: string;
};

export default function TempChart({ today, yesterday, todayColor }: Props) {
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
