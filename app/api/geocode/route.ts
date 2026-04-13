import { NextRequest, NextResponse } from "next/server";

type NominatimResult = {
  lat: string;
  lon: string;
  name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    province?: string;
    state?: string;
    county?: string;
  };
};

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q");
  if (!q) return NextResponse.json({ error: "q required" }, { status: 400 });

  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(q)}` +
    `&format=json&addressdetails=1&limit=20&countrycodes=jp&accept-language=ja`;

  const res = await fetch(url, {
    headers: { "User-Agent": "kioweather/1.0 (https://github.com/abe-perorist/kioweather)" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) return NextResponse.json({ error: "geocode error" }, { status: 502 });

  const items: NominatimResult[] = await res.json();

  // 市区町村＋都道府県でまとめて重複除外
  const seen = new Set<string>();
  const results: { name: string; lat: number; lon: number }[] = [];

  for (const item of items) {
    const area = item.address.city ?? item.address.town ?? item.address.village ?? item.name;
    const pref = item.address.province ?? item.address.state ?? item.address.county ?? "";
    if (!area) continue;

    const key = `${area}|${pref}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const displayName = pref ? `${area}（${pref}）` : area;
    results.push({ name: displayName, lat: parseFloat(item.lat), lon: parseFloat(item.lon) });

    if (results.length >= 6) break;
  }

  return NextResponse.json({ results });
}
