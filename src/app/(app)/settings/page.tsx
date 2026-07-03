import { resolveActiveAthleteId } from "@/lib/auth/activeAthlete";
import { getAthlete } from "@/lib/running/snapshot";
import { OverrideForm } from "@/components/settings/OverrideForm";
import { AddAthleteForm } from "@/components/settings/AddAthleteForm";
import { StravaConnectButton } from "@/components/settings/StravaConnectButton";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ strava?: string }>;
}) {
  const { strava } = await searchParams;
  const athleteId = await resolveActiveAthleteId();
  if (!athleteId) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
        <p className="text-sm text-neutral-500">No athlete profiles yet.</p>
        <AddAthleteForm />
      </main>
    );
  }

  const athlete = await getAthlete(athleteId);

  return (
    <main className="flex flex-1 flex-col items-center gap-8 p-8">
      {strava === "connected" && (
        <p className="text-xs text-green-600">Strava connected — sync from the settings below.</p>
      )}
      {strava === "error" && (
        <p className="text-xs text-red-500">Couldn&apos;t connect to Strava — try again.</p>
      )}

      <StravaConnectButton connected={Boolean(athlete.strava_athlete_id)} />

      <OverrideForm athlete={athlete} />
      <div className="flex w-full max-w-sm flex-col gap-2 border-t border-neutral-100 pt-6">
        <p className="text-xs text-neutral-500">Add another person</p>
        <AddAthleteForm />
      </div>
    </main>
  );
}
