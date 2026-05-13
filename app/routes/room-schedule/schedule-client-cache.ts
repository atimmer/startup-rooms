import type { loadScheduleData } from "./schedule-server";

const MODAL_SEARCH_PARAM_KEYS = ["bookingId", "modal", "roomId"] as const;
const CLIENT_CACHE_TIME_MS = 5 * 60_000;

type ScheduleLoaderData = Awaited<ReturnType<typeof loadScheduleData>>;

interface ClientCacheEntry {
  cachedAt: number;
  data: ScheduleLoaderData;
}

const clientScheduleCache = new Map<string, ClientCacheEntry>();

function stripModalSearchParams(url: URL) {
  const params = new URLSearchParams(url.search);

  for (const key of MODAL_SEARCH_PARAM_KEYS) {
    params.delete(key);
  }

  return params.toString();
}

export function getClientScheduleCacheKey(requestOrUrl: Request | string | URL) {
  const url =
    requestOrUrl instanceof Request
      ? new URL(requestOrUrl.url)
      : requestOrUrl instanceof URL
        ? requestOrUrl
        : new URL(requestOrUrl);

  return `${url.pathname}?${stripModalSearchParams(url)}`;
}

function pruneExpiredClientScheduleCache(now: number) {
  for (const [cacheKey, entry] of clientScheduleCache) {
    if (now - entry.cachedAt >= CLIENT_CACHE_TIME_MS) {
      clientScheduleCache.delete(cacheKey);
    }
  }
}

export function readClientScheduleCache(request: Request, now = Date.now()) {
  pruneExpiredClientScheduleCache(now);

  const entry = clientScheduleCache.get(getClientScheduleCacheKey(request));

  if (!entry) {
    return undefined;
  }

  return entry.data;
}

export function writeClientScheduleCache(
  request: Request,
  data: ScheduleLoaderData,
  now = Date.now(),
) {
  pruneExpiredClientScheduleCache(now);

  clientScheduleCache.set(getClientScheduleCacheKey(request), {
    cachedAt: now,
    data,
  });
}

export function clearClientScheduleCache() {
  clientScheduleCache.clear();
}

export function clearClientScheduleCacheForUrl(url: string | URL) {
  clientScheduleCache.delete(getClientScheduleCacheKey(url));
}
