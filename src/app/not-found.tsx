import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-zinc-950 p-6 text-zinc-100">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-sm text-zinc-400">The requested slide deck or page could not be found.</p>
        <Link
          href="/"
          className="rounded-lg bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
