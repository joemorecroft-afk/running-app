import type { Targets } from "./benchmarks";
import type { Confidence, MetricSource, SourcedValue } from "./confidence";

export type MetricName = "vo2max" | "lt1" | "lt2" | "volume";

export interface MetricGap {
  metric: MetricName;
  current: number | null;
  target: number;
  absoluteDelta: number | null;
  percentDelta: number | null;
  confidence: Confidence;
  source: MetricSource;
  read: string;
}

export interface CurrentMetrics {
  vo2max: SourcedValue<number>;
  lt1PaceSecPerKm: SourcedValue<number>;
  lt2PaceSecPerKm: SourcedValue<number>;
  weeklyVolumeKm: SourcedValue<number>;
}

function higherIsBetterRead(label: string, current: number, target: number): string {
  const percentDelta = ((current - target) / target) * 100;
  if (Math.abs(percentDelta) < 2) return `${label} is on target.`;
  if (percentDelta > 0) {
    return `${label} is ${percentDelta.toFixed(0)}% above target — don't over-focus here.`;
  }
  return `${label} is ${Math.abs(percentDelta).toFixed(0)}% below target — a limiter.`;
}

function lowerIsBetterRead(label: string, current: number, target: number): string {
  const percentDelta = ((current - target) / target) * 100;
  if (Math.abs(percentDelta) < 2) return `${label} pace is on target.`;
  if (percentDelta > 0) {
    return `${label} pace is ${percentDelta.toFixed(0)}% slower than target — this is a limiter.`;
  }
  return `${label} pace is ${Math.abs(percentDelta).toFixed(0)}% faster than target — ahead here.`;
}

function volumeRead(current: number, target: number): string {
  const percentDelta = ((current - target) / target) * 100;
  if (percentDelta <= -10) {
    return `Weekly volume is ${Math.abs(percentDelta).toFixed(0)}% below target — this is likely your biggest lever.`;
  }
  return higherIsBetterRead("Weekly volume", current, target);
}

function buildGap(
  metric: MetricName,
  label: string,
  current: SourcedValue<number>,
  target: number,
  readFn: (current: number, target: number) => string,
  noDataRead: string
): MetricGap {
  if (current.value === null) {
    return {
      metric,
      current: null,
      target,
      absoluteDelta: null,
      percentDelta: null,
      confidence: current.confidence,
      source: current.source,
      read: noDataRead,
    };
  }

  const absoluteDelta = current.value - target;
  const percentDelta = (absoluteDelta / target) * 100;

  return {
    metric,
    current: current.value,
    target,
    absoluteDelta,
    percentDelta,
    confidence: current.confidence,
    source: current.source,
    read: readFn(current.value, target),
  };
}

export function computeGaps(current: CurrentMetrics, targets: Targets): MetricGap[] {
  return [
    buildGap(
      "vo2max",
      "VO2max",
      current.vo2max,
      targets.vdotTarget,
      (c, t) => higherIsBetterRead("VO2max", c, t),
      "No VO2max estimate yet — connect Strava or enter a manual value."
    ),
    buildGap(
      "lt2",
      "LT2",
      current.lt2PaceSecPerKm,
      targets.lt2PaceSecPerKmTarget,
      (c, t) => lowerIsBetterRead("LT2", c, t),
      "No LT2 estimate yet."
    ),
    buildGap(
      "lt1",
      "LT1",
      current.lt1PaceSecPerKm,
      targets.lt1PaceSecPerKmTarget,
      (c, t) => lowerIsBetterRead("LT1", c, t),
      "No LT1 estimate yet."
    ),
    buildGap(
      "volume",
      "Weekly volume",
      current.weeklyVolumeKm,
      targets.weeklyVolumeTargetKm,
      volumeRead,
      "No volume data yet — connect Strava."
    ),
  ];
}
