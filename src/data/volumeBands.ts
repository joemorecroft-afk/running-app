// Versioned config: weekly volume anchors by goal marathon time. Sources: Marathon Handbook,
// Runna, Hansons/Luke Humphrey Running, Strava London Marathon analysis, Noakes' Lore of
// Running. Treat as bands, not exact numbers — bump the version string when retuning.
export const VOLUME_BANDS_VERSION = "2026-07-mvp-1";

export interface VolumeBand {
  goalMarathonTimeSec: number;
  weeklyVolumeKm: number;
}

export const VOLUME_BANDS: VolumeBand[] = [
  { goalMarathonTimeSec: 3 * 3600, weeklyVolumeKm: 105 }, // sub-3:00 (~90-120km band midpoint)
  { goalMarathonTimeSec: 3.5 * 3600, weeklyVolumeKm: 77.5 }, // sub-3:30 (~65-90km)
  { goalMarathonTimeSec: 4 * 3600, weeklyVolumeKm: 60 }, // sub-4:00 (~48-72km)
  { goalMarathonTimeSec: 4.5 * 3600, weeklyVolumeKm: 45 }, // finish/4:30+ (~35-55km)
];

/** Interpolates between the anchor bands above; clamps outside the anchor range. */
export function interpolateVolumeBand(goalMarathonTimeSec: number): number {
  const bands = VOLUME_BANDS;
  const first = bands[0];
  const last = bands[bands.length - 1];

  if (goalMarathonTimeSec <= first.goalMarathonTimeSec) return first.weeklyVolumeKm;
  if (goalMarathonTimeSec >= last.goalMarathonTimeSec) return last.weeklyVolumeKm;

  for (let i = 0; i < bands.length - 1; i++) {
    const a = bands[i];
    const b = bands[i + 1];
    if (goalMarathonTimeSec >= a.goalMarathonTimeSec && goalMarathonTimeSec <= b.goalMarathonTimeSec) {
      const t =
        (goalMarathonTimeSec - a.goalMarathonTimeSec) /
        (b.goalMarathonTimeSec - a.goalMarathonTimeSec);
      return a.weeklyVolumeKm + t * (b.weeklyVolumeKm - a.weeklyVolumeKm);
    }
  }

  return last.weeklyVolumeKm;
}
