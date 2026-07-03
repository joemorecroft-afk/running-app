export interface TriangleMetrics {
  /** Weekly volume + LT1 pace, each expressed as current/target (1.0 = at target). */
  volumeScore: number;
  /** VO2max + LT2 composite, expressed as current/target (1.0 = at target). */
  intensityScore: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface TrianglePoints {
  apex: Point;
  baseLeft: Point;
  baseRight: Point;
}

// Reference size at score=1.0 (as a fraction of the viewport), and the clamp range so an
// extreme gap doesn't blow the triangle off-screen or collapse it to nothing.
const REFERENCE_BASE_FRACTION = 0.62;
const REFERENCE_HEIGHT_FRACTION = 0.55;
const MIN_SCALE = 0.3;
const MAX_SCALE = 1.6;
const BASE_Y_FRACTION = 0.82;

function clampScore(score: number): number {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, score));
}

/** The "at target" triangle for a viewport — used to render the ghost target shape. */
export function targetTriangleMetrics(): TriangleMetrics {
  return { volumeScore: 1, intensityScore: 1 };
}

export function computeTrianglePoints(
  metrics: TriangleMetrics,
  viewport: Viewport
): TrianglePoints {
  const baseWidth = viewport.width * REFERENCE_BASE_FRACTION * clampScore(metrics.volumeScore);
  const triHeight = viewport.height * REFERENCE_HEIGHT_FRACTION * clampScore(metrics.intensityScore);

  const centerX = viewport.width / 2;
  const baseY = viewport.height * BASE_Y_FRACTION;
  const apexY = baseY - triHeight;

  return {
    apex: { x: centerX, y: apexY },
    baseLeft: { x: centerX - baseWidth / 2, y: baseY },
    baseRight: { x: centerX + baseWidth / 2, y: baseY },
  };
}

export function pointsToPath(points: TrianglePoints): string {
  const { apex, baseLeft, baseRight } = points;
  return `M ${apex.x},${apex.y} L ${baseRight.x},${baseRight.y} L ${baseLeft.x},${baseLeft.y} Z`;
}
