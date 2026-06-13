import { PROCEDURES } from "./procedures";
import { Provider, ProcedureInfo, ReviewFlag } from "./types";

// ── Base national-average sticker prices per procedure ──
const BASE_PRICE: Record<string, number> = {
  "mri-knee":           1400,
  "mri-brain":          1800,
  "mri-spine":          1600,
  "ct-chest":           1100,
  "ct-abdomen":         1300,
  "xray-chest":         250,
  "xray-knee":          200,
  "ultrasound-abdomen": 650,
  "ultrasound-thyroid": 480,
  "blood-cbc":          80,
  "blood-bmp":          150,
  "blood-cmp":          200,
  "blood-lipid":        130,
  "blood-a1c":          110,
  "blood-tsh":          140,
  "blood-vitd":         120,
  "blood-psa":          145,
  "ecg":                190,
  "echo":               1800,
  "mammogram":          400,
  "dexa":               300,
  "colonoscopy":        2500,
  "urinalysis":         55,
  "pap-smear":          160,
  "er-visit":           2800,
};

const BASE_WAIT: Record<string, number> = {
  "mri-knee": 14, "mri-brain": 14, "mri-spine": 14,
  "ct-chest": 7,  "ct-abdomen": 7,
  "xray-chest": 2, "xray-knee": 2,
  "ultrasound-abdomen": 5, "ultrasound-thyroid": 5,
  "blood-cbc": 1, "blood-bmp": 1, "blood-cmp": 1,
  "blood-lipid": 1, "blood-a1c": 1, "blood-tsh": 1,
  "blood-vitd": 1, "blood-psa": 1,
  "ecg": 2, "echo": 10,
  "mammogram": 7, "dexa": 5, "colonoscopy": 21,
  "urinalysis": 1, "pap-smear": 5, "er-visit": 0,
};

const REVIEW_NOTES: Record<string, string[]> = {
  ok: [
    "Patients report transparent billing with no surprise charges.",
    "Known for clear upfront cost estimates and billing communication.",
    "Strong reputation for billing transparency in this area.",
    "Reviews highlight straightforward pricing and quick billing support.",
    "Mostly positive feedback — no major billing surprises reported.",
  ],
  warning: [
    "Some reviews mention unexpected charges from out-of-network specialists.",
    "Mixed billing reviews — confirm all providers are in-network before your visit.",
    "A few patients report billing errors that were resolved after appeals.",
    "Recommend calling ahead to verify in-network status of all staff.",
    "Some reports of longer-than-expected billing resolution times.",
  ],
  danger: [
    "Multiple reviews flag surprise out-of-network fees averaging $200–400.",
    "Several patients report unexpected anesthesiologist charges not covered by insurance.",
    "Known for facility fees that aren't always disclosed upfront.",
    "Significant number of billing dispute reports on patient review sites.",
    "Reviews warn of out-of-network lab or radiology reads even for in-network visits.",
  ],
};

// ── Demo insurance plans ──
export const DEMO_PLANS = [
  {
    key:           "blue-shield",
    name:          "Blue Shield PPO 1500",
    deductible:    1500,
    coinsurance:   0.20,
    outOfPocketMax: 6000,
    networkPct:    0.68,
  },
  {
    key:           "aetna",
    name:          "Aetna Choice Plus HMO",
    deductible:    750,
    coinsurance:   0.15,
    outOfPocketMax: 4500,
    networkPct:    0.58,
  },
];

// ── Deterministic hash (FNV-1a 32-bit) ──
function fnv32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

// ── Seeded LCG pseudo-random ──
function mkRand(seed: number) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// Returns in-network status for each demo plan, deterministic per provider id
export function getNetworkStatus(id: string | number): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const plan of DEMO_PLANS) {
    const rand = mkRand(fnv32(`${id}-${plan.key}`));
    out[plan.key] = rand() < plan.networkPct;
  }
  return out;
}

function buildProcedures(osmId: number): Record<string, ProcedureInfo> {
  const rand = mkRand(fnv32(String(osmId)));
  const tier  = rand();                       // 0 = budget, 1 = premium
  const pMul  = 0.35 + tier * 1.65;          // price ×0.35 – ×2.0
  const wMul  = 0.4  + rand() * 1.6;         // wait ×0.4 – ×2.0
  const highFee = tier > 0.60 && rand() > 0.55;

  const out: Record<string, ProcedureInfo> = {};
  for (const proc of PROCEDURES) {
    const base      = BASE_PRICE[proc.id] ?? 500;
    const baseWait  = BASE_WAIT[proc.id]  ?? 7;
    const price     = Math.round((base * pMul) / 10) * 10;
    const wait      = proc.id === "er-visit" ? 0 : Math.max(0, Math.round(baseWait * wMul));
    const surprise  = highFee && rand() > 0.55
      ? Math.round((rand() * 175 + 75) / 25) * 25
      : 0;
    out[proc.id] = {
      name:         proc.label,
      cptCode:      proc.cptCode,
      stickerPrice: price,
      waitDays:     wait,
      surpriseCost: surprise,
    };
  }
  return out;
}

function buildReviewFlag(osmId: number): ReviewFlag {
  const rand  = mkRand(fnv32(`${osmId}-review`));
  const r     = rand();
  const type: "ok" | "warning" | "danger" = r < 0.55 ? "ok" : r < 0.82 ? "warning" : "danger";
  const notes = REVIEW_NOTES[type];
  return {
    type,
    summary:     notes[Math.floor(rand() * notes.length)],
    sourceCount: Math.floor(rand() * 22 + 4),
  };
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const CACHE_KEY = "hl-hospitals-v2";

export async function fetchNearbyHospitals(
  lat: number,
  lng: number,
  radiusKm = 60
): Promise<Provider[]> {
  // Session-level cache so we don't hit Overpass on every navigation
  if (typeof window !== "undefined") {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try { return JSON.parse(cached) as Provider[]; } catch { /* corrupt */ }
    }
  }

  const r     = radiusKm * 1000;
  const query = [
    "[out:json][timeout:30];",
    "(",
    `node["amenity"="hospital"](around:${r},${lat},${lng});`,
    `way["amenity"="hospital"](around:${r},${lat},${lng});`,
    ");",
    "out center;",
  ].join("");

  // Public Overpass servers are frequently rate-limited (HTTP 429/406/504).
  // Try several mirrors in turn so a single overloaded server doesn't force
  // us back to the tiny seed list.
  const ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
  ];

  let data: { elements: OverpassElement[] } | null = null;
  let lastErr: unknown = null;

  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body:    `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) { lastErr = new Error(`Overpass ${res.status} @ ${endpoint}`); continue; }
      data = (await res.json()) as { elements: OverpassElement[] };
      break;
    } catch (err) {
      lastErr = err;
      continue;
    }
  }

  if (!data) throw lastErr ?? new Error("All Overpass endpoints failed");

  const providers: Provider[] = data.elements
    .filter((el) => {
      const name = el.tags?.name ?? "";
      if (!name) return false;
      // require a real coordinate
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      return elLat !== undefined && elLng !== undefined;
    })
    .map((el): Provider => {
      const elLat    = (el.lat ?? el.center?.lat)!;
      const elLng    = (el.lon ?? el.center?.lon)!;
      const name     = el.tags!.name!;
      const street   = el.tags?.["addr:street"] ?? "";
      const city     = el.tags?.["addr:city"]   ?? "";
      const addr     = [street, city].filter(Boolean).join(", ") || "Address on file";
      return {
        id:            `osm-${el.id}`,
        name,
        lat:           elLat,
        lng:           elLng,
        address:       addr,
        procedures:    buildProcedures(el.id),
        reviewFlag:    buildReviewFlag(el.id),
        networkStatus: getNetworkStatus(el.id),
      };
    });

  if (typeof window !== "undefined" && providers.length > 0) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(providers)); } catch { /* quota */ }
  }

  return providers;
}
