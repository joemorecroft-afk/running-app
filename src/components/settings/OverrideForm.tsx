"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  formatPaceSecPerKm,
  formatSecondsAsHMS,
  parseHMSToSeconds,
  parsePaceToSecPerKm,
} from "@/lib/running/format";

export interface OverrideFormAthlete {
  id: string;
  label: string;
  hr_max: number | null;
  resting_hr: number | null;
  goal_marathon_time_seconds: number | null;
  race_date: string | null;
  vo2max_manual: number | null;
  lt1_manual_pace_sec_per_km: number | null;
  lt2_manual_pace_sec_per_km: number | null;
}

export function OverrideForm({ athlete }: { athlete: OverrideFormAthlete }) {
  const router = useRouter();
  const [goalTime, setGoalTime] = useState(
    athlete.goal_marathon_time_seconds ? formatSecondsAsHMS(athlete.goal_marathon_time_seconds) : ""
  );
  const [raceDate, setRaceDate] = useState(athlete.race_date ?? "");
  const [hrMax, setHrMax] = useState(athlete.hr_max?.toString() ?? "");
  const [restingHr, setRestingHr] = useState(athlete.resting_hr?.toString() ?? "");
  const [vo2max, setVo2max] = useState(athlete.vo2max_manual?.toString() ?? "");
  const [lt1Pace, setLt1Pace] = useState(
    athlete.lt1_manual_pace_sec_per_km
      ? formatPaceSecPerKm(athlete.lt1_manual_pace_sec_per_km).replace(" /km", "")
      : ""
  );
  const [lt2Pace, setLt2Pace] = useState(
    athlete.lt2_manual_pace_sec_per_km
      ? formatPaceSecPerKm(athlete.lt2_manual_pace_sec_per_km).replace(" /km", "")
      : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const goalTimeSec = goalTime ? parseHMSToSeconds(goalTime) : null;
    const lt1Sec = lt1Pace ? parsePaceToSecPerKm(lt1Pace) : null;
    const lt2Sec = lt2Pace ? parsePaceToSecPerKm(lt2Pace) : null;

    if (goalTime && goalTimeSec === null) {
      setError('Goal time should look like "3:30:00"');
      setSaving(false);
      return;
    }
    if ((lt1Pace && lt1Sec === null) || (lt2Pace && lt2Sec === null)) {
      setError('Paces should look like "4:15"');
      setSaving(false);
      return;
    }

    const body: Record<string, unknown> = {
      goal_marathon_time_seconds: goalTimeSec,
      race_date: raceDate || null,
      hr_max: hrMax ? Number(hrMax) : null,
      resting_hr: restingHr ? Number(restingHr) : null,
      vo2max_manual: vo2max ? Number(vo2max) : null,
      vo2max_manual_confidence: vo2max ? "high" : null,
      lt1_manual_pace_sec_per_km: lt1Sec,
      lt1_manual_confidence: lt1Sec ? "high" : null,
      lt2_manual_pace_sec_per_km: lt2Sec,
      lt2_manual_confidence: lt2Sec ? "high" : null,
    };

    const res = await fetch(`/api/athlete/${athlete.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (!res.ok) {
      setError("Failed to save — try again.");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <h2 className="text-sm font-medium text-neutral-900">{athlete.label}</h2>

      <label className="flex flex-col gap-1 text-xs text-neutral-500">
        Goal marathon time (H:MM:SS)
        <input
          name="goal-time"
          className="rounded border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
          placeholder="3:30:00"
          value={goalTime}
          onChange={(e) => setGoalTime(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-neutral-500">
        Race date
        <input
          name="race-date"
          type="date"
          className="rounded border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
          value={raceDate}
          onChange={(e) => setRaceDate(e.target.value)}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-neutral-500">
          HR max
          <input
            name="hr-max"
            type="number"
            className="rounded border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
            value={hrMax}
            onChange={(e) => setHrMax(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-neutral-500">
          Resting HR
          <input
            name="resting-hr"
            type="number"
            className="rounded border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
            value={restingHr}
            onChange={(e) => setRestingHr(e.target.value)}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs text-neutral-500">
        VO2max override (leave blank to use Strava-derived estimate)
        <input
          name="vo2max"
          type="number"
          className="rounded border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
          value={vo2max}
          onChange={(e) => setVo2max(e.target.value)}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-neutral-500">
          LT1 pace override (M:SS/km)
          <input
            name="lt1-pace"
            className="rounded border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
            placeholder="5:10"
            value={lt1Pace}
            onChange={(e) => setLt1Pace(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-neutral-500">
          LT2 pace override (M:SS/km)
          <input
            name="lt2-pace"
            className="rounded border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
            placeholder="4:15"
            value={lt2Pace}
            onChange={(e) => setLt2Pace(e.target.value)}
          />
        </label>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
