export default function NoAccessPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-lg font-medium">Link not recognized</h1>
      <p className="text-sm text-neutral-500">
        This link isn&apos;t valid. Double check you copied the whole URL.
      </p>
    </main>
  );
}
