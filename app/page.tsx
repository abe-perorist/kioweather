"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const TempChart = dynamic(() => import("./components/TempChart"), {
  ssr: false,
});

type HourData = { hour: string; temp: number; feels: number };
type WeatherData = { today: HourData[]; yesterday: HourData[] };
type Schedule = { label: string; time: string }; // time: "HH:00"

const DEFAULT_SCHEDULES: Schedule[] = [
  { label: "朝の外出", time: "08:00" },
  { label: "夜の帰宅", time: "19:00" },
];

function loadSchedules(): Schedule[] {
  try {
    const raw = localStorage.getItem("kioweather_schedules");
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_SCHEDULES;
}

function saveSchedules(schedules: Schedule[]) {
  localStorage.setItem("kioweather_schedules", JSON.stringify(schedules));
}

function getTempAt(data: HourData[], time: string): number | null {
  const entry = data.find((d) => d.hour === time);
  return entry ? entry.feels : null;
}

function getDiffAdvice(diff: number): string {
  if (diff <= -5) return "かなり寒い。しっかり厚着を";
  if (diff <= -2) return "昨日より寒い。1枚追加を";
  if (diff >= 5) return "かなり暖かい。1枚減らして";
  if (diff >= 2) return "昨日より暖かい。少し薄めでOK";
  return "昨日と同じ服装でOK";
}

function TimeSlotCard({
  schedule,
  today,
  yesterday,
}: {
  schedule: Schedule;
  today: HourData[];
  yesterday: HourData[];
}) {
  const todayTemp = getTempAt(today, schedule.time);
  const yestTemp = getTempAt(yesterday, schedule.time);

  if (todayTemp === null || yestTemp === null) return null;

  const diff = Math.round((todayTemp - yestTemp) * 10) / 10;
  const advice = getDiffAdvice(diff);

  const diffColor =
    diff <= -2
      ? "text-blue-600"
      : diff >= 2
        ? "text-orange-500"
        : "text-gray-500";

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{schedule.label}</span>
        <span className="text-xs text-gray-400">{schedule.time}</span>
      </div>
      <div className="flex items-end gap-3 mb-2">
        <div>
          <p className="text-xs text-gray-400">今日</p>
          <p className="text-2xl font-bold text-orange-500">{todayTemp}°</p>
        </div>
        <div className="pb-1 text-gray-300">/</div>
        <div>
          <p className="text-xs text-gray-400">昨日</p>
          <p className="text-2xl font-bold text-slate-400">{yestTemp}°</p>
        </div>
        <div className={`pb-1 text-sm font-medium ${diffColor}`}>
          {diff > 0 ? `+${diff}°` : `${diff}°`}
        </div>
      </div>
      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
        {advice}
      </p>
    </div>
  );
}

function ScheduleEditor({
  schedules,
  onChange,
  onClose,
}: {
  schedules: Schedule[];
  onChange: (s: Schedule[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Schedule[]>(schedules);

  const update = (i: number, field: keyof Schedule, value: string) => {
    setDraft((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s))
    );
  };

  const add = () =>
    setDraft((prev) => [...prev, { label: "外出", time: "12:00" }]);

  const remove = (i: number) =>
    setDraft((prev) => prev.filter((_, idx) => idx !== i));

  const save = () => {
    onChange(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
      <div className="bg-white w-full max-w-xl rounded-t-2xl p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">外出時間帯の設定</h2>
        <div className="space-y-3 mb-4">
          {draft.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={s.label}
                onChange={(e) => update(i, "label", e.target.value)}
                placeholder="ラベル"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="time"
                value={s.time}
                onChange={(e) => update(i, "time", e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={() => remove(i)}
                className="text-gray-400 hover:text-red-400 text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={add}
          className="text-sm text-gray-400 hover:text-gray-600 mb-6 block"
        >
          + 追加
        </button>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-500"
          >
            キャンセル
          </button>
          <button
            onClick={save}
            className="flex-1 bg-orange-500 text-white rounded-xl py-2.5 text-sm font-medium"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

function getTempDiff(today: HourData[], yesterday: HourData[]): number | null {
  const todayAvg = today.reduce((s, d) => s + d.temp, 0) / (today.length || 1);
  const yestAvg =
    yesterday.reduce((s, d) => s + d.temp, 0) / (yesterday.length || 1);
  return Math.round((todayAvg - yestAvg) * 10) / 10;
}

export default function Page() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>(DEFAULT_SCHEDULES);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    setSchedules(loadSchedules());
  }, []);

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

  const handleSaveSchedules = (s: Schedule[]) => {
    setSchedules(s);
    saveSchedules(s);
  };

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const fmt = (d: Date) =>
    `${d.getMonth() + 1}/${d.getDate()}(${["日", "月", "火", "水", "木", "金", "土"][d.getDay()]})`;

  const diff = data ? getTempDiff(data.today, data.yesterday) : null;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-gray-800">きおてん</h1>
          <button
            onClick={() => setShowEditor(true)}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            時間帯を設定
          </button>
        </div>
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
            {/* 外出時間帯サマリー */}
            <div className="space-y-3 mb-6">
              {schedules.map((s, i) => (
                <TimeSlotCard
                  key={i}
                  schedule={s}
                  today={data.today}
                  yesterday={data.yesterday}
                />
              ))}
            </div>

            {/* グラフ */}
            <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-4 h-0.5 bg-orange-400 rounded" />
                今日 {fmt(today)}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-4 h-0.5 bg-slate-400 rounded" />
                昨日 {fmt(yesterday)}
              </span>
              {diff !== null && (
                <span
                  className={`ml-auto text-xs font-medium ${diff <= -1 ? "text-blue-500" : diff >= 1 ? "text-orange-500" : "text-gray-400"}`}
                >
                  日平均 {diff > 0 ? `+${diff}` : diff}°C
                </span>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <TempChart today={data.today} yesterday={data.yesterday} />
              <p className="text-xs text-gray-400 mt-2 text-center">
                破線 = 体感温度 / 実線 = 気温
              </p>
            </div>
          </>
        )}
      </div>

      {showEditor && (
        <ScheduleEditor
          schedules={schedules}
          onChange={handleSaveSchedules}
          onClose={() => setShowEditor(false)}
        />
      )}
    </main>
  );
}
