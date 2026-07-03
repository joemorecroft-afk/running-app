// Seeds two synthetic athlete profiles (Joe, Partner) with ~10 weeks of training history,
// so the app can be built and demoed end-to-end before Strava is wired up.
// Usage: node --env-file=.env.local scripts/seed-fake-activities.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

const WEEKS = 10;
const HR_MAX = 190;
const RESTING_HR = 50;

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// Simplified TRIMP-style load — mirrors src/lib/running/acwr.ts's computeSessionLoad.
// Duplicated (not imported) since this is a plain Node script with no TS build step;
// only needs to be "realistic enough" for seed data, not bit-for-bit identical.
function sessionLoad({ movingTimeS, avgHr }) {
  const durationMin = movingTimeS / 60;
  const hrReserve = Math.max(0, Math.min(1, (avgHr - RESTING_HR) / (HR_MAX - RESTING_HR)));
  const weighting = 0.64 * Math.exp(1.92 * hrReserve);
  return durationMin * hrReserve * weighting;
}

function jitter(base, pct) {
  return base * (1 + (Math.random() * 2 - 1) * pct);
}

async function upsertAthlete(label, goalMarathonTimeSec, raceDate) {
  const { data: existing } = await supabase
    .from("athletes")
    .select("id")
    .eq("label", label)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("athletes")
    .insert({
      label,
      hr_max: HR_MAX,
      resting_hr: RESTING_HR,
      goal_marathon_time_seconds: goalMarathonTimeSec,
      race_date: raceDate,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

function buildWeekActivities(athleteId, weekStartDate, weekIndex, totalWeeks) {
  // Ramp long-run distance up through the build, then taper in the final week.
  const isTaperWeek = weekIndex === totalWeeks - 1;
  const longRunKm = isTaperWeek ? 12 : 14 + weekIndex * 1.2;

  const days = [
    { offset: 1, distanceKm: jitter(8, 0.1), avgHr: 140, tag: "easy" },
    { offset: 2, distanceKm: jitter(7, 0.05), avgHr: 168, tag: "hard" }, // tempo/threshold
    { offset: 3, distanceKm: jitter(6, 0.1), avgHr: 138, tag: "easy" },
    { offset: 5, distanceKm: jitter(longRunKm, 0.05), avgHr: 150, tag: "long" },
    { offset: 6, distanceKm: jitter(5, 0.15), avgHr: 132, tag: "recovery" },
  ];

  return days.map(({ offset, distanceKm, avgHr, tag }) => {
    const distanceM = Math.round(distanceKm * 1000);
    const paceSecPerKm = tag === "hard" ? 255 : tag === "long" ? 320 : 300;
    const movingTimeS = Math.round(distanceKm * paceSecPerKm);
    const startDate = addDays(weekStartDate, offset);

    return {
      athlete_id: athleteId,
      name: `${tag[0].toUpperCase()}${tag.slice(1)} run`,
      start_date: startDate.toISOString(),
      distance_m: distanceM,
      moving_time_s: movingTimeS,
      elapsed_time_s: movingTimeS + 30,
      avg_hr: avgHr,
      max_hr: avgHr + 12,
      avg_cadence: 172,
      avg_pace_sec_per_km: paceSecPerKm,
      session_load: sessionLoad({ movingTimeS, avgHr }),
      is_hard_effort: tag === "hard",
      hard_effort_reason: tag === "hard" ? "Seeded tempo/threshold session" : null,
      note: null,
    };
  });
}

async function seedActivitiesForAthlete(athleteId) {
  const { count } = await supabase
    .from("activities")
    .select("id", { count: "exact", head: true })
    .eq("athlete_id", athleteId);

  if (count && count > 0) {
    console.log(`  Athlete ${athleteId} already has ${count} activities, skipping.`);
    return;
  }

  const today = new Date();
  const mostRecentMonday = addDays(today, -((today.getUTCDay() + 6) % 7));

  const rows = [];
  for (let w = 0; w < WEEKS; w++) {
    const weekStart = addDays(mostRecentMonday, -7 * (WEEKS - 1 - w));
    rows.push(...buildWeekActivities(athleteId, weekStart, w, WEEKS));
  }

  const { error } = await supabase.from("activities").insert(rows);
  if (error) throw error;
  console.log(`  Inserted ${rows.length} activities.`);
}

async function main() {
  const raceDate = isoDate(addDays(new Date(), 84));

  console.log("Seeding athlete: Joe");
  const joeId = await upsertAthlete("Joe", 3.5 * 3600, raceDate);
  await seedActivitiesForAthlete(joeId);

  console.log("Seeding athlete: Partner");
  const partnerId = await upsertAthlete("Partner", 4 * 3600, raceDate);
  await seedActivitiesForAthlete(partnerId);

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
