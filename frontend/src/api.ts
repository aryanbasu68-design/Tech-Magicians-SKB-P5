"const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || \"\";

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { \"Content-Type\": \"application/json\" },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export type Region = {
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  bounds: { min_lat: number; max_lat: number; min_lng: number; max_lng: number };
};

export type Detection = {
  id: string;
  lat: number;
  lng: number;
  fdi: number;
  confidence: number;
  biofouling: number;
  area_m2: number;
  severity: \"low\" | \"moderate\" | \"high\" | \"critical\";
  detected_at: string;
  region_name?: string;
};

export type ScanResult = {
  id: string;
  region_id: string;
  region_name: string;
  satellite: string;
  scanned_at: string;
  pixels_analyzed: number;
  detections: Detection[];
  hotspot_count: number;
  avg_fdi: number;
  avg_confidence: number;
  coverage_km2: number;
};

export type TrajectoryPoint = {
  hours_ahead: number;
  lat: number;
  lng: number;
  drift_km: number;
};

export type TrajectoryResult = {
  detection_id: string;
  origin_lat: number;
  origin_lng: number;
  current_speed_knots: number;
  wind_bearing_deg: number;
  points: TrajectoryPoint[];
};

export type Alert = {
  id: string;
  title: string;
  message: string;
  severity: \"low\" | \"moderate\" | \"high\" | \"critical\";
  region_name: string;
  lat: number;
  lng: number;
  created_at: string;
  acknowledged: boolean;
};

export type DashboardStats = {
  total_scans: number;
  total_detections: number;
  avg_fdi: number;
  avg_confidence: number;
  coverage_km2: number;
  active_alerts: number;
  active_hotspots: number;
  trend_7d: { date: string; detections: number }[];
};

export const api = {
  stats: () => request<DashboardStats>(\"/dashboard/stats\"),
  regions: () => request<Region[]>(\"/regions\"),
  scans: () => request<ScanResult[]>(\"/scans\"),
  hotspots: () => request<Detection[]>(\"/hotspots\"),
  alerts: (only_active = false) =>
    request<Alert[]>(`/alerts?only_active=${only_active}`),
  scan: (region_id: string, satellite = \"Sentinel-2\") =>
    request<ScanResult>(\"/scan\", {
      method: \"POST\",
      body: JSON.stringify({ region_id, satellite }),
    }),
  trajectory: (lat: number, lng: number, detection_id?: string) =>
    request<TrajectoryResult>(\"/trajectory\", {
      method: \"POST\",
      body: JSON.stringify({ lat, lng, detection_id }),
    }),
  acknowledgeAlert: (id: string) =>
    request<{ ok: boolean }>(`/alerts/${id}/acknowledge`, { method: \"POST\" }),
  seed: () => request<{ seeded_scans: number }>(\"/seed\", { method: \"POST\" }),
};
"
