import { riskScoreToColor } from "./colors";

export function gradientId(prefix: string, riskScore: number) {
  return `${prefix}-${Math.round(riskScore)}`;
}

interface GradientDefsProps {
  riskScore: number;
  idPrefix: string;
}

/** A subtle radial gradient (base risk color -> a lighter tint) so the live triangle has depth. */
export function GradientDefs({ riskScore, idPrefix }: GradientDefsProps) {
  const color = riskScoreToColor(riskScore);
  const id = gradientId(idPrefix, riskScore);

  return (
    <defs>
      <radialGradient id={id} cx="50%" cy="35%" r="75%">
        <stop offset="0%" stopColor={color} stopOpacity={0.85} />
        <stop offset="100%" stopColor={color} stopOpacity={0.55} />
      </radialGradient>
    </defs>
  );
}
