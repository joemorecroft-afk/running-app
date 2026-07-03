"use client";

import {
  computeTrianglePoints,
  pointsToPath,
  targetTriangleMetrics,
  type Point,
} from "./triangleGeometry";
import { GradientDefs, gradientId } from "./GradientDefs";
import { riskScoreToColor } from "./colors";

export type GapMetric = "vo2max" | "lt1" | "lt2" | "volume";

export interface FitnessTriangleProps {
  volumeScore: number;
  intensityScore: number;
  injuryRiskScore: number;
  onVertexTap?: (metric: GapMetric) => void;
  animated?: boolean;
}

const VIEWPORT = { width: 320, height: 320 };
const VERTEX_HIT_RADIUS = 28;

export function FitnessTriangle({
  volumeScore,
  intensityScore,
  injuryRiskScore,
  onVertexTap,
  animated = true,
}: FitnessTriangleProps) {
  const ghostPoints = computeTrianglePoints(targetTriangleMetrics(), VIEWPORT);
  const livePoints = computeTrianglePoints({ volumeScore, intensityScore }, VIEWPORT);
  const fillId = gradientId("fitness-triangle-fill", injuryRiskScore);
  const strokeColor = riskScoreToColor(injuryRiskScore);

  const transitionStyle = animated
    ? { transition: "d 400ms ease, fill 400ms ease, stroke 400ms ease" }
    : undefined;

  const vertexTargets: { metric: GapMetric; point: Point }[] = [
    { metric: "volume", point: livePoints.baseLeft },
    { metric: "lt1", point: livePoints.baseRight },
    // The apex represents the VO2max+LT2 "ceiling" composite; routes to VO2max detail for now.
    { metric: "vo2max", point: livePoints.apex },
  ];

  return (
    <svg
      viewBox={`0 0 ${VIEWPORT.width} ${VIEWPORT.height}`}
      className="w-full max-w-sm"
      role="img"
      aria-label="Fitness shape vs. target, colored by injury risk"
    >
      <GradientDefs riskScore={injuryRiskScore} idPrefix="fitness-triangle-fill" />

      {/* Ghost target triangle */}
      <path
        d={pointsToPath(ghostPoints)}
        fill="currentColor"
        className="text-neutral-300"
        fillOpacity={0.18}
        stroke="currentColor"
        strokeOpacity={0.35}
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />

      {/* Live triangle */}
      <path
        d={pointsToPath(livePoints)}
        fill={`url(#${fillId})`}
        stroke={strokeColor}
        strokeWidth={2}
        style={transitionStyle}
      />

      {onVertexTap &&
        vertexTargets.map(({ metric, point }) => (
          <circle
            key={metric}
            cx={point.x}
            cy={point.y}
            r={VERTEX_HIT_RADIUS}
            fill="transparent"
            className="cursor-pointer"
            onClick={() => onVertexTap(metric)}
          >
            <title>{metric}</title>
          </circle>
        ))}
    </svg>
  );
}
