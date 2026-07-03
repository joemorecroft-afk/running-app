export type Confidence = "low" | "med" | "high";
export type MetricSource = "manual" | "derived" | "unavailable";

export interface SourcedValue<T> {
  value: T | null;
  confidence: Confidence;
  source: MetricSource;
}

const CONFIDENCE_RANK: Record<Confidence, number> = { low: 0, med: 1, high: 2 };

export function higherConfidence(a: Confidence, b: Confidence): Confidence {
  return CONFIDENCE_RANK[a] >= CONFIDENCE_RANK[b] ? a : b;
}

/**
 * Manual overrides always win and are always high-confidence. Otherwise fall back to a
 * derived value with whatever confidence it carries. Centralized here since the same rule
 * applies independently to VO2max, LT1, and LT2 and will likely be retuned as a unit.
 */
export function resolveValue<T>(
  manual: { value: T; confidence?: Confidence } | null | undefined,
  derived: { value: T; confidence: Confidence } | null | undefined
): SourcedValue<T> {
  if (manual) {
    return { value: manual.value, confidence: "high", source: "manual" };
  }
  if (derived) {
    return { value: derived.value, confidence: derived.confidence, source: "derived" };
  }
  return { value: null, confidence: "low", source: "unavailable" };
}
