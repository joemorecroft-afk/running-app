import { redirect } from "next/navigation";
import { isValidToken, setSessionToken, getSessionToken } from "@/lib/auth/token";

export default async function EntryPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token: paramToken } = await searchParams;

  if (paramToken) {
    if (await isValidToken(paramToken)) {
      await setSessionToken(paramToken);
      redirect("/home");
    }
    redirect("/no-access");
  }

  const sessionToken = await getSessionToken();
  if (sessionToken && (await isValidToken(sessionToken))) {
    redirect("/home");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-lg font-medium">Running</h1>
      <p className="text-sm text-neutral-500">
        Open this app using your personal link.
      </p>
    </main>
  );
}
