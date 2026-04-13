"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const TempChart = dynamic(() => import("./components/TempChart"), {
  ssr: false,
});

type HourData = { hour: string; temp: number; feels: number };
type WeatherData = { today: HourData[]; yesterday: HourData[]; compareDate: string };
type Times = { morning: string; evening: string };
type Location = { name: string; lat: number; lon: number };

const DEFAULT_TIMES: Times = { morning: "08:00", evening: "19:00" };

function loadLocations(): Location[] {
  try {
    const raw = localStorage.getItem("kioweather_locations");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveLocations(locs: Location[]) {
  localStorage.setItem("kioweather_locations", JSON.stringify(locs));
}

function loadActiveLocation(): Location | null {
  try {
    const raw = localStorage.getItem("kioweather_active_location");
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveActiveLocation(loc: Location) {
  localStorage.setItem("kioweather_active_location", JSON.stringify(loc));
}

type GeoResult = { name: string; lat: number; lon: number };

async function searchLocations(query: string): Promise<GeoResult[]> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

function LocationPicker({
  saved,
  active,
  onSelect,
  onClose,
}: {
  saved: Location[];
  active: Location | null;
  onSelect: (loc: Location) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    const res = await searchLocations(query.trim());
    setResults(res);
    setSearching(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
      <div className="bg-white w-full max-w-xl rounded-t-2xl p-6 max-h-[80vh] flex flex-col">
        <h2 className="text-lg font-bold text-gray-800 mb-4">場所を選ぶ</h2>

        {/* 検索 */}
        <p className="text-xs text-gray-400 mb-2">駅名や区名など、大きめのキーワードで検索すると見つかりやすいです</p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="例: 渋谷、横浜、新宿"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-orange-400"
          />
          <button
            onClick={search}
            disabled={searching}
            className="bg-orange-500 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {searching ? "…" : "検索"}
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* 検索結果 */}
          {results.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">検索結果</p>
              <div className="space-y-1">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => onSelect({ name: r.name, lat: r.lat, lon: r.lon })}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-orange-50 text-sm text-gray-700"
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 保存済みの場所 */}
          {saved.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">保存済みの場所</p>
              <div className="space-y-1">
                {saved.map((loc, i) => (
                  <button
                    key={i}
                    onClick={() => onSelect(loc)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm ${active?.name === loc.name ? "bg-orange-50 text-orange-600 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    {active?.name === loc.name && <span className="mr-1.5">✓</span>}
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full border border-gray-200 rounded-xl py-2.5 text-sm text-gray-500"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

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
  compareLabel,
}: {
  times: Times;
  today: HourData[];
  yesterday: HourData[];
  todayColor: string;
  compareLabel: string;
}) {
  const todayTemp = getTempAt(today, times.morning);
  const yestTemp = getTempAt(yesterday, times.morning);

  if (todayTemp === null || yestTemp === null) return null;

  const diff = Math.round((todayTemp - yestTemp) * 10) / 10;

  let advice: string;

  if (diff <= -5) {
    advice = `${compareLabel}よりかなり寒い。しっかり厚着を`;
  } else if (diff <= -2) {
    advice = `${compareLabel}より寒い。1枚追加して`;
  } else if (diff >= 5) {
    advice = `${compareLabel}よりかなり暖かい。薄めでOK`;
  } else if (diff >= 2) {
    advice = `${compareLabel}より暖かい。少し薄めでもいいかも`;
  } else {
    advice = `${compareLabel}とほぼ同じ。${compareLabel}の服装でOK`;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-0.5">🌅 朝の外出</p>
        <p className="text-sm font-medium text-gray-700">{times.morning}</p>
      </div>
      <div className="flex items-end gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">今日</p>
          <p className="text-3xl font-bold" style={{ color: todayColor }}>{todayTemp}°</p>
        </div>
        <div className="pb-1 text-gray-200 text-2xl">/</div>
        <div>
          <p className="text-xs text-gray-400 mb-1">{compareLabel}</p>
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
  compareLabel,
}: {
  times: Times;
  today: HourData[];
  yesterday: HourData[];
  todayColor: string;
  compareLabel: string;
}) {
  const todayTemp = getTempAt(today, times.evening);
  const yestTemp = getTempAt(yesterday, times.evening);

  if (todayTemp === null || yestTemp === null) return null;

  const diff = Math.round((todayTemp - yestTemp) * 10) / 10;

  let advice: string;

  if (diff <= -5) {
    advice = `${compareLabel}の夜よりかなり寒い。しっかり厚着を`;
  } else if (diff <= -2) {
    advice = `${compareLabel}の夜より寒い。1枚追加して`;
  } else if (diff >= 5) {
    advice = `${compareLabel}の夜よりかなり暖かい。薄めでOK`;
  } else if (diff >= 2) {
    advice = `${compareLabel}の夜より暖かい。少し薄めでもいいかも`;
  } else {
    advice = `${compareLabel}の夜とほぼ同じ。${compareLabel}の服装でOK`;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-0.5">🌙 夜の帰宅</p>
        <p className="text-sm font-medium text-gray-700">{times.evening}</p>
      </div>
      <div className="flex items-end gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">今日</p>
          <p className="text-3xl font-bold" style={{ color: todayColor }}>{todayTemp}°</p>
        </div>
        <div className="pb-1 text-gray-200 text-2xl">/</div>
        <div>
          <p className="text-xs text-gray-400 mb-1">{compareLabel}</p>
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
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [savedLocations, setSavedLocations] = useState<Location[]>([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [compareDaysAgo, setCompareDaysAgo] = useState(1);

  useEffect(() => {
    setTimes(loadTimes());
    const locs = loadLocations();
    setSavedLocations(locs);
    const active = loadActiveLocation();
    if (active) {
      setActiveLocation(active);
    } else {
      // 初回: 場所選択を促す
      setShowLocationPicker(true);
    }
  }, []);

  useEffect(() => {
    if (!activeLocation) return;
    setLoading(true);
    setData(null);
    setError(null);
    const { lat, lon } = activeLocation;
    fetch(`/api/weather?lat=${lat}&lon=${lon}&daysAgo=${compareDaysAgo}`)
      .then(async (res) => {
        if (!res.ok) { setError("気象データの取得に失敗しました"); return; }
        setData(await res.json());
      })
      .catch(() => setError("気象データの取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [activeLocation, compareDaysAgo]);

  const handleSelectLocation = (loc: Location) => {
    setActiveLocation(loc);
    saveActiveLocation(loc);
    // 保存済みリストに追加（重複除外）
    const updated = [loc, ...savedLocations.filter((l) => l.name !== loc.name)].slice(0, 10);
    setSavedLocations(updated);
    saveLocations(updated);
    setShowLocationPicker(false);
  };

  const today = new Date();
  const DOW = ["日", "月", "火", "水", "木", "金", "土"];
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}(${DOW[d.getDay()]})`;
  const fmtCompare = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}(${DOW[d.getDay()]})`;
  };

  // 過去7日分のボタンデータ
  const pastDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (i + 1));
    return { daysAgo: i + 1, label: DOW[d.getDay()], date: `${d.getMonth() + 1}/${d.getDate()}` };
  });

  const compareDate = new Date(today);
  compareDate.setDate(today.getDate() - compareDaysAgo);
  const compareLabel = compareDaysAgo === 1 ? "昨日" : `${DOW[compareDate.getDay()]}曜`;

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
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            今日と{compareLabel}の気温を比べて、服を決めよう
          </p>
          <button
            onClick={() => setShowLocationPicker(true)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <span>📍</span>
            <span>{activeLocation ? activeLocation.name : "場所を選ぶ"}</span>
          </button>
        </div>

        {!activeLocation && !showLocationPicker && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-gray-500 text-sm">場所を選んでスタート</p>
            <button
              onClick={() => setShowLocationPicker(true)}
              className="bg-orange-500 text-white rounded-xl px-6 py-3 text-sm font-medium"
            >
              場所を選ぶ
            </button>
          </div>
        )}

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

        {activeLocation && (
          <div className="mb-5">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <div className="flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium bg-orange-500 text-white">
                <span className="font-bold">今日</span>
                <span className="opacity-75 mt-0.5">{`${today.getMonth() + 1}/${today.getDate()}`}</span>
              </div>
              <div className="flex-shrink-0 self-center text-gray-300 text-sm px-0.5">|</div>
              {pastDays.map(({ daysAgo: d, label, date }) => (
                <button
                  key={d}
                  onClick={() => setCompareDaysAgo(d)}
                  className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    compareDaysAgo === d
                      ? "bg-orange-100 text-orange-600 border border-orange-300"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-orange-300"
                  }`}
                >
                  <span className="font-bold">{label}</span>
                  <span className="opacity-75 mt-0.5">{date}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {data && (
          <>
            <div className="space-y-3 mb-6">
              <MorningCard times={times} today={data.today} yesterday={data.yesterday} todayColor={todayColor} compareLabel={compareLabel} />
              <EveningCard times={times} today={data.today} yesterday={data.yesterday} todayColor={todayColor} compareLabel={compareLabel} />
            </div>

            <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-4 h-0.5 rounded" style={{ backgroundColor: todayColor }} />
                今日 {fmt(today)}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-4 h-0.5 bg-slate-400 rounded" />
                {fmtCompare(data.compareDate)}
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

      {showLocationPicker && (
        <LocationPicker
          saved={savedLocations}
          active={activeLocation}
          onSelect={handleSelectLocation}
          onClose={() => {
            if (activeLocation) setShowLocationPicker(false);
          }}
        />
      )}

      <footer className="w-full max-w-xl mt-10 pb-4 flex gap-4 justify-center text-xs text-gray-400">
        <Link href="/terms" className="hover:text-gray-600">利用規約</Link>
        <Link href="/privacy" className="hover:text-gray-600">プライバシーポリシー</Link>
      </footer>
    </main>
  );
}
