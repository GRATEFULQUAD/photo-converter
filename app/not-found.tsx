import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black text-center px-4">
      <h1 className="font-display text-3xl font-black uppercase neon-text-cyan">
        404 // Not Found
      </h1>
      <p className="text-muted-foreground text-sm max-w-md">
        This page doesn&apos;t exist. Head back to the converter.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-2 rounded-md bg-[rgb(0,255,240)] px-4 py-2 text-sm font-semibold text-black hover:bg-[rgb(0,220,210)]"
      >
        Back to Home
      </Link>
    </div>
  );
}
