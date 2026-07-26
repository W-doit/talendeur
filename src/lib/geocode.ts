import {
  COUNTRY_COORDINATES,
  normalizeLocation,
  type LatLng,
  type NormalizedLocation,
} from '@/lib/location-normalization';

const CACHE_KEY = 'talendeur:geocode:v1';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 90; // 90 days
const NEGATIVE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days for misses
const GEOCODE_MIN_INTERVAL_MS = 200; // be polite; Open-Meteo is generous

interface CacheEntry {
  result: NormalizedLocation | null;
  cachedAt: number;
}

type CacheStore = Record<string, CacheEntry>;

let memoryCache: CacheStore | null = null;
let lastGeocodeAt = 0;
let geocodeQueue: Promise<void> = Promise.resolve();

function cacheKey(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function loadCache(): CacheStore {
  if (memoryCache) return memoryCache;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    memoryCache = raw ? (JSON.parse(raw) as CacheStore) : {};
  } catch {
    memoryCache = {};
  }
  return memoryCache;
}

function saveCache(store: CacheStore): void {
  memoryCache = store;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    // Quota / private mode — keep in-memory only
  }
}

function readCache(raw: string): NormalizedLocation | null | undefined {
  const store = loadCache();
  const key = cacheKey(raw);
  const entry = store[key];
  if (!entry) return undefined;

  const ttl = entry.result ? CACHE_TTL_MS : NEGATIVE_TTL_MS;
  if (Date.now() - entry.cachedAt > ttl) {
    delete store[key];
    saveCache(store);
    return undefined;
  }
  return entry.result;
}

function writeCache(raw: string, result: NormalizedLocation | null): void {
  const store = loadCache();
  store[cacheKey(raw)] = { result, cachedAt: Date.now() };
  saveCache(store);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function enqueueGeocode<T>(fn: () => Promise<T>): Promise<T> {
  const run = geocodeQueue.then(async () => {
    const wait = Math.max(0, GEOCODE_MIN_INTERVAL_MS - (Date.now() - lastGeocodeAt));
    if (wait > 0) await sleep(wait);
    lastGeocodeAt = Date.now();
    return fn();
  });
  geocodeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

interface OpenMeteoResult {
  name?: string;
  latitude: number;
  longitude: number;
  country_code?: string;
  country?: string;
  admin1?: string;
}

interface OpenMeteoResponse {
  results?: OpenMeteoResult[];
}

/**
 * Resolve a free-text location:
 * 1) offline aliases / cities / ISO codes
 * 2) localStorage cache
 * 3) Open-Meteo geocoding API (free, CORS-friendly, no key)
 */
export async function resolveLocation(rawLocation: string): Promise<NormalizedLocation | null> {
  if (!rawLocation?.trim()) return null;

  const raw = rawLocation.trim();

  const offline = normalizeLocation(raw);
  if (offline) return offline;

  const cached = readCache(raw);
  if (cached !== undefined) return cached;

  try {
    const geocoded = await geocodeWithOpenMeteo(raw);
    writeCache(raw, geocoded);
    return geocoded;
  } catch (error) {
    // Don't cache transport failures — retry next load
    console.warn('Geocode API error:', error);
    return null;
  }
}

/** Resolve many locations; dedupes identical strings and geocodes sequentially. */
export async function resolveLocations(
  locations: string[],
): Promise<Map<string, NormalizedLocation | null>> {
  const unique = [...new Set(locations.map((l) => l.trim()).filter(Boolean))];
  const results = new Map<string, NormalizedLocation | null>();

  for (const loc of unique) {
    results.set(loc, await resolveLocation(loc));
  }

  return results;
}

async function geocodeWithOpenMeteo(raw: string): Promise<NormalizedLocation | null> {
  return enqueueGeocode(async () => {
    const params = new URLSearchParams({
      name: raw,
      count: '1',
      language: 'en',
      format: 'json',
    });

    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`,
      { headers: { Accept: 'application/json' } },
    );

    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP ${response.status}`);
    }

    const data = (await response.json()) as OpenMeteoResponse;
    const hit = data.results?.[0];
    if (!hit) return null;

    return openMeteoToNormalized(raw, hit);
  });
}

function openMeteoToNormalized(raw: string, hit: OpenMeteoResult): NormalizedLocation | null {
  const lat = Number(hit.latitude);
  const lon = Number(hit.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat === 0 && lon === 0) return null;

  const countryName = hit.country?.trim() || '';
  const countryCode = hit.country_code?.toUpperCase() || null;

  const country =
    (countryCode ? normalizeLocation(countryCode)?.country : null) ||
    (countryName ? normalizeLocation(countryName)?.country : null) ||
    countryName;

  if (!country) return null;

  const city = hit.name?.trim() || '';
  const coords: LatLng = [lat, lon];
  const countryCentroid = COUNTRY_COORDINATES[country];
  const useCentroid = !city && Boolean(countryCentroid);

  return {
    raw,
    city,
    country,
    countryCode: countryCode || normalizeLocation(country)?.countryCode || null,
    coords: useCentroid && countryCentroid ? countryCentroid : coords,
  };
}
