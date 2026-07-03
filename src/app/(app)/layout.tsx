import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionToken, isValidToken } from "@/lib/auth/token";
import { resolveActiveAthleteId } from "@/lib/auth/activeAthlete";
import { listAthletes } from "@/lib/running/snapshot";
import { AthleteSwitcher } from "@/components/nav/AthleteSwitcher";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getSessionToken();
  if (!(await isValidToken(token))) {
    redirect("/no-access");
  }

  const [athletes, activeAthleteId] = await Promise.all([
    listAthletes(),
    resolveActiveAthleteId(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <span className="text-sm font-medium text-neutral-900">Running</span>
        {athletes.length > 0 && activeAthleteId && (
          <AthleteSwitcher athletes={athletes} activeAthleteId={activeAthleteId} />
        )}
      </header>

      <div className="flex-1">{children}</div>

      <nav className="flex justify-around border-t border-neutral-100 py-2 text-xs text-neutral-500">
        <Link href="/home" className="px-4 py-1">
          Home
        </Link>
        <Link href="/week" className="px-4 py-1">
          Week
        </Link>
        <Link href="/settings" className="px-4 py-1">
          Settings
        </Link>
      </nav>
    </div>
  );
}
