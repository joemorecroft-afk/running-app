"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SyncButton() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  async function onSync() {
    setSyncing(true);
    setStatus(null);

    const res = await fetch("/api/strava/sync", { method: "POST" });
    const body = await res.json();

    if (!res.ok) {
      setStatus(body.error ?? "Sync failed");
    } else {
      setStatus(`Synced ${body.imported} activities (${body.streamsFetched} hard efforts analyzed)`);
      router.refresh();
    }
    setSyncing(false);
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-1">
      <button
        onClick={onSync}
        disabled={syncing}
        className="rounded border border-neutral-200 px-4 py-2 text-sm text-neutral-700 disabled:opacity-50"
      >
        {syncing ? "Syncing..." : "Sync now"}
      </button>
      {status && <p className="text-xs text-neutral-400">{status}</p>}
    </div>
  );
}
