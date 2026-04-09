import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  // 今日の予報 + 昨日の実測を1リクエストで取得
  const url =
    `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,apparent_temperature` +
    `&daily=temperature_2m_max,temperature_2m_min` +
    `&past_days=1` +
    `&forecast_days=1` +
    `&timezone=Asia%2FTokyo` +
    `&start_date=${fmt(yesterday)}&end_date=${fmt(today)}`;

  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) {
    return NextResponse.json({ error: "weather API error" }, { status: 502 });
  }

  const data = await res.json();

  // hourlyデータを昨日・今日に分割
  const todayStr = fmt(today);
  const yesterdayStr = fmt(yesterday);

  const hours = data.hourly.time as string[];
  const temps = data.hourly.temperature_2m as number[];
  const feelsLike = data.hourly.apparent_temperature as number[];

  const todayData: { hour: string; temp: number; feels: number }[] = [];
  const yesterdayData: { hour: string; temp: number; feels: number }[] = [];

  hours.forEach((t, i) => {
    const hour = t.slice(11, 16); // "HH:MM"
    if (t.startsWith(todayStr)) {
      todayData.push({ hour, temp: temps[i], feels: feelsLike[i] });
    } else if (t.startsWith(yesterdayStr)) {
      yesterdayData.push({ hour, temp: temps[i], feels: feelsLike[i] });
    }
  });

  return NextResponse.json({ today: todayData, yesterday: yesterdayData });
}
