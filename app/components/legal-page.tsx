import { Link } from "react-router";

interface LegalPageProps {
  children: React.ReactNode;
  description: string;
  title: string;
}

export function LegalPage({ children, description, title }: LegalPageProps) {
  return (
    <main lang="nl" className="min-h-screen bg-stone-50 px-4 py-8 text-stone-900 md:px-6 md:py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 transition hover:text-stone-900"
        >
          <span aria-hidden="true">←</span>
          <span>Terug naar de planner</span>
        </Link>

        <section className="mt-6 rounded-[28px] border border-stone-200 bg-white px-6 py-8 shadow-[0_24px_80px_-48px_rgba(28,25,23,0.45)] md:px-10 md:py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
            Startup Rooms
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950 md:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600 md:text-base">
            {description}
          </p>
          <div className="mt-8 space-y-6 text-sm leading-7 text-stone-700 md:text-base">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
