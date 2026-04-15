import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latRaw = searchParams.get("lat");
  const lonRaw = searchParams.get("lon");
  const daysAgoRaw = parseInt(searchParams.get("daysAgo") ?? "1", 10);

  if (!latRaw || !lonRaw) {
    return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
  }

  const lat = parseFloat(latRaw);
  const lon = parseFloat(lonRaw);

  if (isNaN(lat) || lat < -90 || lat > 90) {
    return NextResponse.json({ error: "Invalid lat" }, { status: 400 });
  }
  if (isNaN(lon) || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "Invalid lon" }, { status: 400 });
  }

  const daysAgo = isNaN(daysAgoRaw) ? 1 : Math.min(7, Math.max(1, daysAgoRaw));

  // open-meteo は timezone=Asia/Tokyo のとき JST タイムスタンプを返すので、
  // 日付計算も JST で行う（UTC+9 = +9*60*60*1000ms）
  const nowJST = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const compareDate = new Date(nowJST);
  compareDate.setDate(nowJST.getDate() - daysAgo);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const url =
    `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,apparent_temperature` +
    `&past_days=${daysAgo}` +
    `&forecast_days=1` +
    `&timezone=Asia%2FTokyo`;

  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) {
    return NextResponse.json({ error: "weather API error" }, { status: 502 });
  }

  const data = await res.json();

  const todayStr = fmt(nowJST);
  const compareDateStr = fmt(compareDate);

  const hours = data.hourly.time as string[];
  const temps = data.hourly.temperature_2m as number[];
  const feelsLike = data.hourly.apparent_temperature as number[];

  const todayData: { hour: string; temp: number; feels: number }[] = [];
  const compareData: { hour: string; temp: number; feels: number }[] = [];

  hours.forEach((t, i) => {
    const hour = t.slice(11, 16);
    if (t.startsWith(todayStr)) {
      todayData.push({ hour, temp: temps[i], feels: feelsLike[i] });
    } else if (t.startsWith(compareDateStr)) {
      compareData.push({ hour, temp: temps[i], feels: feelsLike[i] });
    }
  });

  return NextResponse.json({ today: todayData, yesterday: compareData, compareDate: compareDateStr });
}
