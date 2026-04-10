"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const TempChart = dynamic(() => import("./components/TempChart"), {
  ssr: false,
});

type HourData = { hour: string; temp: number; feels: number };
type WeatherData = { today: HourData[]; yesterday: HourData[] };
type Times = { morning: string; evening: string };

const DEFAULT_TIMES: Times = { morning: "08:00", evening: "19:00" };

// 今日が昨日より暖かいかを朝の体感温度で判定
const TODAY_WARM_COLOR = "#f97316";  // orange-500
const TODAY_COOL_COLOR = "#3b82f6";  // blue-500
const TODAY_NEUTRAL_COLOR = "#f97316";

function getTodayColor(diff: number): string {
  if (diff > 0) return TODAY_WARM_COLOR;
  if (diff < 0) return TODAY_COOL_COLOR;
  return TODAY_NEUTRAL_COLOR;
}

function loadTimes(): Times {
  try {
    const raw = localStorage.getItem("kioweather_times");
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_TIMES;
}

function saveTimes(times: Times) {
  localStorage.setItem("kioweather_times", JSON.stringify(times));
}

function getTempAt(data: HourData[], time: string): number | null {
  const entry = data.find((d) => d.hour === time);
  return entry ? entry.feels : null;
}

function MorningCard({
  times,
  today,
  yesterday,
  todayColor,
}: {
  times: Times;
  today: HourData[];
  yesterday: HourData[];
  todayColor: string;
}) {
  const todayTemp = getTempAt(today, times.morning);
  const yestTemp = getTempAt(yesterday, times.morning);

  if (todayTemp === null || yestTemp === null) return null;

  const diff = Math.round((todayTemp - yestTemp) * 10) / 10;

  let advice: string;

  if (diff <= -5) {
    advice = "昨日よりかなり寒い。しっかり厚着を";
  } else if (diff <= -2) {
    advice = "昨日より寒い。1枚追加して";
  } else if (diff >= 5) {
    advice = "昨日よりかなり暖かい。薄めでOK";
  } else if (diff >= 2) {
    advice = "昨日より暖かい。少し薄めでもいいかも";
  } else {
    advice = "昨日とほぼ同じ。昨日の服装でOK";
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-0.5">朝の外出</p>
        <p className="text-sm font-medium text-gray-700">{times.morning}</p>
      </div>
      <div className="flex items-end gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">今日</p>
          <p className="text-3xl font-bold" style={{ color: todayColor }}>{todayTemp}°</p>
        </div>
        <div className="pb-1 text-gray-200 text-2xl">/</div>
        <div>
          <p className="text-xs text-gray-400 mb-1">昨日</p>
          <p className="text-3xl font-bold text-slate-300">{yestTemp}°</p>
        </div>
        <p className={`pb-1 text-base font-semibold ${diff < 0 ? "text-blue-500" : diff > 0 ? "text-orange-500" : "text-gray-400"}`}>
          {diff > 0 ? `+${diff}°` : `${diff}°`}
        </p>
      </div>
      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-2.5">
        {advice}
      </p>
    </div>
  );
}

function EveningCard({
  times,
  today,
  yesterday,
  todayColor,
}: {
  times: Times;
  today: HourData[];
  yesterday: HourData[];
  todayColor: string;
}) {
  const todayTemp = getTempAt(today, times.evening);
  const yestTemp = getTempAt(yesterday, times.evening);

  if (todayTemp === null || yestTemp === null) return null;

  const diff = Math.round((todayTemp - yestTemp) * 10) / 10;

  let advice: string;

  if (diff <= -5) {
    advice = "昨日の夜よりかなり寒い。しっかり厚着を";
  } else if (diff <= -2) {
    advice = "昨日の夜より寒い。1枚追加して";
  } else if (diff >= 5) {
    advice = "昨日の夜よりかなり暖かい。薄めでOK";
  } else if (diff >= 2) {
    advice = "昨日の夜より暖かい。少し薄めでもいいかも";
  } else {
    advice = "昨日の夜とほぼ同じ。昨日の服装でOK";
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-0.5">夜の帰宅</p>
        <p className="text-sm font-medium text-gray-700">{times.evening}</p>
      </div>
      <div className="flex items-end gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">今日</p>
          <p className="text-3xl font-bold" style={{ color: todayColor }}>{todayTemp}°</p>
        </div>
        <div className="pb-1 text-gray-200 text-2xl">/</div>
        <div>
          <p className="text-xs text-gray-400 mb-1">昨日</p>
          <p className="text-3xl font-bold text-slate-300">{yestTemp}°</p>
        </div>
        <p className={`pb-1 text-base font-semibold ${diff < 0 ? "text-blue-500" : diff > 0 ? "text-orange-500" : "text-gray-400"}`}>
          {diff > 0 ? `+${diff}°` : `${diff}°`}
        </p>
      </div>
      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-2.5">
        {advice}
      </p>
    </div>
  );
}

function TimeEditor({
  times,
  onChange,
  onClose,
}: {
  times: Times;
  onChange: (t: Times) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Times>(times);

  const save = () => {
    onChange(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
      <div className="bg-white w-full max-w-xl rounded-t-2xl p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-6">時間帯の設定</h2>
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">朝の外出</p>
              <p className="text-xs text-gray-400 mt-0.5">昨日と比べて何を着るかの判断に使います</p>
            </div>
            <input
              type="time"
              value={draft.morning}
              onChange={(e) => setDraft((p) => ({ ...p, morning: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800"
            />
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">夜の帰宅</p>
              <p className="text-xs text-gray-400 mt-0.5">朝と比べて羽織りが必要かの判断に使います</p>
            </div>
            <input
              type="time"
              value={draft.evening}
              onChange={(e) => setDraft((p) => ({ ...p, evening: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800"
            />
          </div>
        </div>
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

export default function Page() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [times, setTimes] = useState<Times>(DEFAULT_TIMES);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    setTimes(loadTimes());
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
        setError("位置情報を取得できませんでした。ブラウザの許可設定を確認してください。");
        setLoading(false);
      }
    );
  }, []);

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const fmt = (d: Date) =>
    `${d.getMonth() + 1}/${d.getDate()}(${["日", "月", "火", "水", "木", "金", "土"][d.getDay()]})`;

  // 朝の体感温度差で今日のテーマカラーを決定
  const morningDiff = data
    ? (() => {
        const t = data.today.find((d) => d.hour === times.morning)?.feels ?? null;
        const y = data.yesterday.find((d) => d.hour === times.morning)?.feels ?? null;
        return t !== null && y !== null ? t - y : 0;
      })()
    : 0;
  const todayColor = getTodayColor(morningDiff);

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
            <svg className="animate-spin h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
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
            <div className="space-y-3 mb-6">
              <MorningCard times={times} today={data.today} yesterday={data.yesterday} todayColor={todayColor} />
              <EveningCard times={times} today={data.today} yesterday={data.yesterday} todayColor={todayColor} />
            </div>

            <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-4 h-0.5 rounded" style={{ backgroundColor: todayColor }} />
                今日 {fmt(today)}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-4 h-0.5 bg-slate-400 rounded" />
                昨日 {fmt(yesterday)}
              </span>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <TempChart today={data.today} yesterday={data.yesterday} todayColor={todayColor} times={times} />
              <p className="text-xs text-gray-400 mt-2 text-center">
                体感温度の時間変化
              </p>
            </div>
          </>
        )}
      </div>

      {showEditor && (
        <TimeEditor
          times={times}
          onChange={(t) => { setTimes(t); saveTimes(t); }}
          onClose={() => setShowEditor(false)}
        />
      )}

      <footer className="w-full max-w-xl mt-10 pb-4 flex gap-4 justify-center text-xs text-gray-400">
        <Link href="/terms" className="hover:text-gray-600">利用規約</Link>
        <Link href="/privacy" className="hover:text-gray-600">プライバシーポリシー</Link>
      </footer>
    </main>
  );
}
