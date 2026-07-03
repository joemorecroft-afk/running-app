interface ColorStop {
  at: number; // 0-100
  rgb: [number, number, number];
}

// Low risk score (0) -> green, high risk score (100) -> red, per the brief's
// red<->amber<->yellow<->green gradient (bad = red, at the high-risk end).
const STOPS: ColorStop[] = [
  { at: 0, rgb: [34, 197, 94] }, // green-500
  { at: 33, rgb: [234, 179, 8] }, // yellow-500
  { at: 66, rgb: [249, 115, 22] }, // orange-500 ("amber")
  { at: 100, rgb: [239, 68, 68] }, // red-500
];

export function riskScoreToColor(score: number): string {
  const clamped = Math.max(0, Math.min(100, score));

  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (clamped >= a.at && clamped <= b.at) {
      const t = (clamped - a.at) / (b.at - a.at);
      const rgb = a.rgb.map((channel, idx) => Math.round(channel + t * (b.rgb[idx] - channel)));
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }
  }

  return `rgb(${STOPS[STOPS.length - 1].rgb.join(", ")})`;
}
