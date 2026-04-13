import { NextRequest, NextResponse } from "next/server";

const ISO_TO_PREF: Record<string, string> = {
  "JP-01": "北海道", "JP-02": "青森県", "JP-03": "岩手県", "JP-04": "宮城県",
  "JP-05": "秋田県", "JP-06": "山形県", "JP-07": "福島県", "JP-08": "茨城県",
  "JP-09": "栃木県", "JP-10": "群馬県", "JP-11": "埼玉県", "JP-12": "千葉県",
  "JP-13": "東京都", "JP-14": "神奈川県", "JP-15": "新潟県", "JP-16": "富山県",
  "JP-17": "石川県", "JP-18": "福井県", "JP-19": "山梨県", "JP-20": "長野県",
  "JP-21": "岐阜県", "JP-22": "静岡県", "JP-23": "愛知県", "JP-24": "三重県",
  "JP-25": "滋賀県", "JP-26": "京都府", "JP-27": "大阪府", "JP-28": "兵庫県",
  "JP-29": "奈良県", "JP-30": "和歌山県", "JP-31": "鳥取県", "JP-32": "島根県",
  "JP-33": "岡山県", "JP-34": "広島県", "JP-35": "山口県", "JP-36": "徳島県",
  "JP-37": "香川県", "JP-38": "愛媛県", "JP-39": "高知県", "JP-40": "福岡県",
  "JP-41": "佐賀県", "JP-42": "長崎県", "JP-43": "熊本県", "JP-44": "大分県",
  "JP-45": "宮崎県", "JP-46": "鹿児島県", "JP-47": "沖縄県",
};

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
    "ISO3166-2-lvl4"?: string;
  };
};

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q");
  if (!q || q.trim().length === 0) return NextResponse.json({ error: "q required" }, { status: 400 });
  if (q.length > 200) return NextResponse.json({ error: "q too long" }, { status: 400 });

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
    const pref =
      item.address.province ??
      item.address.state ??
      item.address.county ??
      ISO_TO_PREF[item.address["ISO3166-2-lvl4"] ?? ""] ??
      "";
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
