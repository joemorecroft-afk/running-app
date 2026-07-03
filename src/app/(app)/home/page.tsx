import { FitnessTriangle } from "@/components/triangle/FitnessTriangle";

// Hard-coded fake data for now — real data wiring lands once Supabase + Strava sync exist.
const FAKE_VOLUME_SCORE = 0.72;
const FAKE_INTENSITY_SCORE = 1.05;
const FAKE_INJURY_RISK_SCORE = 62;

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <FitnessTriangle
        volumeScore={FAKE_VOLUME_SCORE}
        intensityScore={FAKE_INTENSITY_SCORE}
        injuryRiskScore={FAKE_INJURY_RISK_SCORE}
      />
      <div className="text-center">
        <p className="text-sm font-medium text-neutral-700">Injury risk: 62 / 100</p>
        <p className="text-xs text-neutral-400">
          Volume is the limiter this week — ceiling (VO2max/LT2) is ahead of target.
        </p>
      </div>
    </main>
  );
}
