/** Formats seconds as "H:MM:SS" (e.g. 12600 -> "3:30:00"). */
export function formatSecondsAsHMS(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Parses "H:MM:SS" or "H:MM" into seconds. Returns null if the string doesn't parse. */
export function parseHMSToSeconds(input: string): number | null {
  const parts = input.trim().split(":");
  if (parts.length < 2 || parts.length > 3) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => Number.isNaN(n))) return null;

  if (nums.length === 3) {
    const [h, m, s] = nums;
    return h * 3600 + m * 60 + s;
  }
  const [h, m] = nums;
  return h * 3600 + m * 60;
}

/** Formats a pace in seconds/km as "M:SS /km" (e.g. 258 -> "4:18 /km"). */
export function formatPaceSecPerKm(secPerKm: number): string {
  const s = Math.round(secPerKm);
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")} /km`;
}

/** Parses "M:SS" (per km) into seconds. Returns null if the string doesn't parse. */
export function parsePaceToSecPerKm(input: string): number | null {
  const parts = input.trim().split(":");
  if (parts.length !== 2) return null;
  const [m, s] = parts.map(Number);
  if (Number.isNaN(m) || Number.isNaN(s)) return null;
  return m * 60 + s;
}
