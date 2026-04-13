import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const daysAgo = Math.min(7, Math.max(1, parseInt(searchParams.get("daysAgo") ?? "1", 10)));

  if (!lat || !lon) {
    return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
  }

  const today = new Date();
  const compareDate = new Date(today);
  compareDate.setDate(today.getDate() - daysAgo);

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

  const todayStr = fmt(today);
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
