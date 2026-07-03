import { describe, expect, it } from "vitest";
import {
  computeTrianglePoints,
  pointsToPath,
  targetTriangleMetrics,
} from "../triangleGeometry";

const VIEWPORT = { width: 300, height: 300 };

describe("computeTrianglePoints", () => {
  it("centers the apex above the midpoint of the base", () => {
    const points = computeTrianglePoints({ volumeScore: 1, intensityScore: 1 }, VIEWPORT);
    const baseMidX = (points.baseLeft.x + points.baseRight.x) / 2;
    expect(points.apex.x).toBeCloseTo(baseMidX, 5);
    expect(points.apex.y).toBeLessThan(points.baseLeft.y);
  });

  it("widens the base as volumeScore increases", () => {
    const narrow = computeTrianglePoints({ volumeScore: 0.5, intensityScore: 1 }, VIEWPORT);
    const wide = computeTrianglePoints({ volumeScore: 1.2, intensityScore: 1 }, VIEWPORT);
    const narrowWidth = narrow.baseRight.x - narrow.baseLeft.x;
    const wideWidth = wide.baseRight.x - wide.baseLeft.x;
    expect(wideWidth).toBeGreaterThan(narrowWidth);
  });

  it("raises the apex (taller triangle) as intensityScore increases", () => {
    const short = computeTrianglePoints({ volumeScore: 1, intensityScore: 0.5 }, VIEWPORT);
    const tall = computeTrianglePoints({ volumeScore: 1, intensityScore: 1.2 }, VIEWPORT);
    expect(tall.apex.y).toBeLessThan(short.apex.y);
  });

  it("clamps extreme scores so the triangle never collapses or blows off-screen", () => {
    const extreme = computeTrianglePoints({ volumeScore: 100, intensityScore: 0.0001 }, VIEWPORT);
    expect(extreme.baseRight.x - extreme.baseLeft.x).toBeLessThan(VIEWPORT.width * 2);
    expect(extreme.apex.y).toBeGreaterThan(0);
  });

  it("targetTriangleMetrics represents the at-target shape", () => {
    expect(targetTriangleMetrics()).toEqual({ volumeScore: 1, intensityScore: 1 });
  });
});

describe("pointsToPath", () => {
  it("produces a closed 3-point SVG path", () => {
    const points = computeTrianglePoints({ volumeScore: 1, intensityScore: 1 }, VIEWPORT);
    const path = pointsToPath(points);
    expect(path.startsWith("M ")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
    expect(path.match(/L /g)?.length).toBe(2);
  });
});
