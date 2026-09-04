import { TriangleAlert } from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { Button } from "~/components/ui/button";
import type { Route } from "./+types/auth.google.permissions";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Google-permissies | Nijmegen Startup Rooms" },
    {
      name: "description",
      content: "Zo geef je Nijmegen Startup Rooms toegang tot de benodigde Google-agenda's.",
    },
  ];
}

export default function GooglePermissionsRoute() {
  const [searchParams] = useSearchParams();
  const hasMissingPermissions = searchParams.get("missing") === "1";

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
            Nijmegen Startup Rooms
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950 md:text-4xl">
            Google-permissies nodig
          </h1>

          {hasMissingPermissions ? (
            <div
              className="mt-6 flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950"
              role="alert"
            >
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <div className="text-sm leading-6">
                <p className="font-semibold">Niet alle benodigde permissies zijn aangevinkt.</p>
                <p className="mt-1">
                  Probeer het opnieuw en vink in het Google-scherm ‘Alles selecteren’ aan.
                </p>
              </div>
            </div>
          ) : null}

          <p className="mt-6 text-base leading-7 text-stone-700">
            Om meeting ruimtes te boeken heeft de app permissies nodig om je kalenders te lezen. In
            de connectie met Google moet je die permissies handmatig aanvinken. Dat scherm ziet er
            zo uit:
          </p>

          <figure className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
            <img
              alt="Google-toestemmingsscherm met een pijl naar de optie Alles selecteren"
              className="h-auto w-full"
              height="1170"
              src="/google-calendar-permissions.png"
              width="1044"
            />
          </figure>

          <Button asChild className="mt-6 h-11 w-full rounded-full" size="lg">
            <Link to="/auth/google">
              {hasMissingPermissions ? "Opnieuw verbinden met Google" : "Verbinden met Google"}
            </Link>
          </Button>

          <div className="mt-5 flex gap-4 border-t border-stone-100 pt-4 text-xs text-stone-500">
            <Link className="underline underline-offset-3 hover:text-stone-900" to="/privacy">
              Privacybeleid
            </Link>
            <Link className="underline underline-offset-3 hover:text-stone-900" to="/voorwaarden">
              Algemene voorwaarden
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
