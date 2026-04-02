import type { Route } from "./+types/voorwaarden";
import { LegalPage } from "~/components/legal-page";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Algemene voorwaarden | Startup Rooms" },
    {
      name: "description",
      content: "Korte gebruiksvoorwaarden voor Startup Rooms.",
    },
  ];
}

export default function TermsRoute() {
  return (
    <LegalPage
      title="Algemene voorwaarden"
      description="Deze app is een handig hulpmiddel, geen gegarandeerde dienst. Door de app te gebruiken ga je ermee akkoord dat gebruik volledig op eigen risico is."
    >
      <section>
        <h2 className="text-lg font-semibold text-stone-950">Gebruik op eigen risico</h2>
        <p className="mt-2">
          Startup Rooms wordt aangeboden zonder garanties. We doen ons best om de app bruikbaar en
          actueel te houden, maar we kunnen niet beloven dat alles altijd klopt, beschikbaar is of
          zonder fouten werkt.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-950">Geen aansprakelijkheid</h2>
        <p className="mt-2">
          Gebruik van deze app is volledig op eigen risico. De makers zijn niet aansprakelijk voor
          schade, gemiste boekingen, dubbele reserveringen, dataverlies of andere gevolgen van het
          gebruik van de app.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-950">Afhankelijk van derden</h2>
        <p className="mt-2">
          De app gebruikt onder meer Google Calendar en draait op Vercel. Als een van die diensten
          niet werkt of verandert, kan dat invloed hebben op Startup Rooms.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-950">Open source</h2>
        <p className="mt-2">
          De code is open source en staat op{" "}
          <a
            href="https://github.com/atimmer/startup-rooms"
            className="font-semibold text-stone-900 underline decoration-stone-300 underline-offset-4"
          >
            github.com/atimmer/startup-rooms
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-950">Niet mee eens?</h2>
        <p className="mt-2">Gebruik de app dan niet.</p>
      </section>
    </LegalPage>
  );
}
