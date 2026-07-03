"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AddAthleteForm() {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);

    const res = await fetch("/api/athletes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim() }),
    });

    setSaving(false);
    if (res.ok) {
      setLabel("");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm items-center gap-2">
      <input
        className="flex-1 rounded border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
        placeholder="Add a person (e.g. Partner)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded border border-neutral-200 px-3 py-2 text-sm text-neutral-700 disabled:opacity-50"
      >
        Add
      </button>
    </form>
  );
}
