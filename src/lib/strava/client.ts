import type { StravaActivitySummary, StravaStreamSet } from "./types";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const RATE_LIMIT_WARNING_FRACTION = 0.95;

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

/** Thin fetch wrapper around the Strava API, rate-limit aware (100/15min, 1000/day per athlete). */
export class StravaClient {
  constructor(private accessToken: string) {}

  private async request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${STRAVA_API_BASE}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (res.status === 429) {
      throw new RateLimitError("Strava rate limit exceeded (429)");
    }

    const usage = res.headers.get("x-ratelimit-usage");
    const limit = res.headers.get("x-ratelimit-limit");
    if (usage && limit) {
      const [shortUsage, dailyUsage] = usage.split(",").map(Number);
      const [shortLimit, dailyLimit] = limit.split(",").map(Number);
      if (
        shortUsage >= shortLimit * RATE_LIMIT_WARNING_FRACTION ||
        dailyUsage >= dailyLimit * RATE_LIMIT_WARNING_FRACTION
      ) {
        throw new RateLimitError(`Approaching Strava rate limit (usage ${usage} of ${limit})`);
      }
    }

    if (!res.ok) {
      throw new Error(`Strava API error ${res.status}: ${await res.text()}`);
    }

    return res.json();
  }

  async listActivities(params: {
    after?: number;
    page?: number;
    perPage?: number;
  }): Promise<StravaActivitySummary[]> {
    return this.request<StravaActivitySummary[]>("/athlete/activities", {
      ...(params.after ? { after: String(params.after) } : {}),
      page: String(params.page ?? 1),
      per_page: String(params.perPage ?? 100),
    });
  }

  async getActivityStreams(activityId: number, keys: string[]): Promise<StravaStreamSet> {
    return this.request<StravaStreamSet>(`/activities/${activityId}/streams`, {
      keys: keys.join(","),
      key_by_type: "true",
    });
  }
}
