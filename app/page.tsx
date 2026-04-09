"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const TempChart = dynamic(() => import("./components/TempChart"), {
  ssr: false,
});

type HourData = { hour: string; temp: number; feels: number };
type WeatherData = { today: HourData[]; yesterday: HourData[] };

function getTempDiff(today: HourData[], yesterday: HourData[]): number | null {
  const todayAvg =
    today.reduce((s, d) => s + d.temp, 0) / (today.length || 1);
  const yestAvg =
    yesterday.reduce((s, d) => s + d.temp, 0) / (yesterday.length || 1);
  return Math.round((todayAvg - yestAvg) * 10) / 10;
}

function DiffBadge({ diff }: { diff: number }) {
  if (Math.abs(diff) < 1) {
    return (
      <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
        昨日とほぼ同じ気温
      </span>
    );
  }
  if (diff > 0) {
    return (
      <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
        昨日より {diff}°C 暖かい
      </span>
    );
  }
  return (
    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
      昨日より {Math.abs(diff)}°C 寒い
    </span>
  );
}

export default function Page() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
        if (!res.ok) {
          setError("気象データの取得に失敗しました");
          setLoading(false);
          return;
        }
        setData(await res.json());
        setLoading(false);
      },
      () => {
        setError(
          "位置情報を取得できませんでした。ブラウザの許可設定を確認してください。"
        );
        setLoading(false);
      }
    );
  }, []);

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const fmt = (d: Date) =>
    `${d.getMonth() + 1}/${d.getDate()}(${["日", "月", "火", "水", "木", "金", "土"][d.getDay()]})`;

  const diff = data ? getTempDiff(data.today, data.yesterday) : null;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">きおてん</h1>
        <p className="text-sm text-gray-500 mb-6">
          今日と昨日の気温を比べて、服を決めよう
        </p>

        {loading && (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <svg
              className="animate-spin h-6 w-6 mr-2"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            気象データを取得中...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            {error}
          </div>
        )}

        {data && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-4 h-0.5 bg-orange-400 rounded" />
                  今日 {fmt(today)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-4 h-0.5 bg-slate-400 rounded" />
                  昨日 {fmt(yesterday)}
                </span>
              </div>
            </div>

            {diff !== null && (
              <div className="mb-4">
                <DiffBadge diff={diff} />
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <TempChart today={data.today} yesterday={data.yesterday} />
              <p className="text-xs text-gray-400 mt-2 text-center">
                破線 = 体感温度 / 実線 = 気温
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatCard
                label="今日の最高気温"
                value={`${Math.max(...data.today.map((d) => d.temp))}°C`}
                color="orange"
              />
              <StatCard
                label="昨日の最高気温"
                value={`${Math.max(...data.yesterday.map((d) => d.temp))}°C`}
                color="slate"
              />
              <StatCard
                label="今日の最低気温"
                value={`${Math.min(...data.today.map((d) => d.temp))}°C`}
                color="orange"
              />
              <StatCard
                label="昨日の最低気温"
                value={`${Math.min(...data.yesterday.map((d) => d.temp))}°C`}
                color="slate"
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "orange" | "slate";
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p
        className={`text-xl font-bold mt-0.5 ${
          color === "orange" ? "text-orange-500" : "text-slate-500"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
