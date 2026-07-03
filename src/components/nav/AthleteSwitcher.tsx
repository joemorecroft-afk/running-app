"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface AthleteSwitcherProps {
  athletes: { id: string; label: string }[];
  activeAthleteId: string;
}

export function AthleteSwitcher({ athletes, activeAthleteId }: AthleteSwitcherProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function switchTo(athleteId: string) {
    if (athleteId === activeAthleteId || pending) return;
    setPending(true);
    await fetch("/api/active-athlete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteId }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1 rounded-full bg-neutral-100 p-1">
      {athletes.map((athlete) => (
        <button
          key={athlete.id}
          onClick={() => switchTo(athlete.id)}
          disabled={pending}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            athlete.id === activeAthleteId
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          {athlete.label}
        </button>
      ))}
    </div>
  );
}
