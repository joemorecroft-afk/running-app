import { FitnessTriangle } from "@/components/triangle/FitnessTriangle";

// Temporary, un-authed route for visually verifying the triangle component before
// Supabase exists. Safe to delete once /home is wired to real data and verified.
export default function DevPreviewPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-neutral-50 p-8">
      <div className="flex flex-col items-center gap-4">
        <p className="text-xs uppercase tracking-wide text-neutral-400">Low risk</p>
        <FitnessTriangle volumeScore={0.9} intensityScore={1.1} injuryRiskScore={12} />
      </div>
      <div className="flex flex-col items-center gap-4">
        <p className="text-xs uppercase tracking-wide text-neutral-400">Mid risk (volume limiter)</p>
        <FitnessTriangle volumeScore={0.72} intensityScore={1.05} injuryRiskScore={62} />
      </div>
      <div className="flex flex-col items-center gap-4">
        <p className="text-xs uppercase tracking-wide text-neutral-400">High risk (short + narrow)</p>
        <FitnessTriangle volumeScore={0.5} intensityScore={0.6} injuryRiskScore={88} />
      </div>
    </main>
  );
}
