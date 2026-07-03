import { redirect } from "next/navigation";
import { getSessionToken, isValidToken } from "@/lib/auth/token";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getSessionToken();
  if (!(await isValidToken(token))) {
    redirect("/no-access");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>
    </div>
  );
}
