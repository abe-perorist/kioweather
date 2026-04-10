"use client";

import {
  ComposedChart,
  Area,
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
};

export default function TempChart({ today, yesterday }: Props) {
  const data = today.map((t, i) => ({
    hour: t.hour,
    今日気温: t.temp,
    今日体感: t.feels,
    昨日気温: yesterday[i]?.temp ?? null,
    昨日体感: yesterday[i]?.feels ?? null,
  }));

  const allTemps = [...today, ...yesterday].flatMap((d) => [d.temp, d.feels]);
  const minTemp = Math.floor(Math.min(...allTemps)) - 2;
  const maxTemp = Math.ceil(Math.max(...allTemps)) + 2;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="todayFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0.03} />
          </linearGradient>
          <linearGradient id="yesterdayFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.03} />
          </linearGradient>
        </defs>
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
        {/* 気温を帯として背景に表示 */}
        <Area
          type="monotone"
          dataKey="昨日気温"
          stroke="#94a3b8"
          strokeWidth={1}
          strokeDasharray="3 3"
          fill="url(#yesterdayFill)"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="今日気温"
          stroke="#f97316"
          strokeWidth={1}
          strokeDasharray="3 3"
          fill="url(#todayFill)"
          dot={false}
        />
        {/* 体感温度を前面に線で表示 */}
        <Line
          type="monotone"
          dataKey="昨日体感"
          stroke="#94a3b8"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="今日体感"
          stroke="#f97316"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
