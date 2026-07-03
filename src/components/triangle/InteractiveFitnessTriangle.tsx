"use client";

import { useRouter } from "next/navigation";
import { FitnessTriangle, type FitnessTriangleProps } from "./FitnessTriangle";

/** Wraps FitnessTriangle with tap-to-drill-down navigation — a client component so it can
 * hold a router, since Server Components can't pass function props across the boundary. */
export function InteractiveFitnessTriangle(
  props: Omit<FitnessTriangleProps, "onVertexTap">
) {
  const router = useRouter();
  return (
    <FitnessTriangle {...props} onVertexTap={(metric) => router.push(`/gaps/${metric}`)} />
  );
}
