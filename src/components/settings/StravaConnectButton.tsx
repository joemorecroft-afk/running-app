export function StravaConnectButton({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <div className="flex w-full max-w-sm items-center justify-between rounded border border-neutral-200 px-3 py-2">
        <span className="text-sm text-neutral-700">Strava connected</span>
        <form action="/api/strava/disconnect" method="POST">
          <button type="submit" className="text-xs text-neutral-400 underline">
            Disconnect
          </button>
        </form>
      </div>
    );
  }

  return (
    <a
      href="/api/strava/oauth/start"
      className="flex w-full max-w-sm items-center justify-center rounded bg-[#fc4c02] px-4 py-2 text-sm font-medium text-white"
    >
      Connect Strava
    </a>
  );
}
