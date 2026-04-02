import type { Route } from "./+types/privacy";
import { LegalPage } from "~/components/legal-page";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Privacybeleid | Startup Rooms" },
    {
      name: "description",
      content: "In gewone taal uitgelegd welke gegevens Startup Rooms verwerkt.",
    },
  ];
}

export default function PrivacyRoute() {
  return (
    <LegalPage
      title="Privacybeleid"
      description="Kort en simpel: we proberen zo min mogelijk gegevens te verwerken. Deze app draait op Vercel en gebruikt Google Calendar alleen als jij daar zelf voor kiest."
    >
      <section>
        <h2 className="text-lg font-semibold text-stone-950">Wat we niet doen</h2>
        <p className="mt-2">
          We hebben geen eigen accountdatabase, geen nieuwsbrief, geen advertentietrackers en geen
          analytics om je gedrag op de site te volgen.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-950">Wat we wel verwerken</h2>
        <p className="mt-2">
          Als je alleen de site opent zonder Google te koppelen, verwerken we in de app zelf in
          principe geen persoonlijke gegevens behalve wat technisch nodig is om de website te tonen.
        </p>
        <p className="mt-2">
          Als je wel met Google inlogt, gebruikt de app je Google-profielgegevens zoals je naam en
          e-mailadres en bewaart de app een beveiligde sessiecookie. In die sessie staan ook
          Google-tokens, zodat de app namens jou agenda-informatie kan ophalen en boekingen kan
          aanmaken, wijzigen of verwijderen in Google Calendar.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-950">Google Calendar</h2>
        <p className="mt-2">
          De agenda-gegevens komen uit Google Calendar. Zodra je Google koppelt, geldt daarnaast ook
          het privacybeleid van Google. Wij slaan die agenda-afspraken niet op in een eigen
          database.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-950">Hosting via Vercel</h2>
        <p className="mt-2">
          De app wordt gehost op Vercel. Daardoor kan Vercel technische serverlogs verwerken, zoals
          verzoekgegevens en IP-adressen, voor hosting, beveiliging en storingsanalyse.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-950">Cookies</h2>
        <p className="mt-2">
          We gebruiken alleen een functionele sessiecookie om het inloggen met Google en je sessie
          te laten werken. We gebruiken geen marketingcookies.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-950">Bewaartermijn</h2>
        <p className="mt-2">
          De sessiecookie blijft maximaal 30 dagen geldig, tenzij je eerder uitlogt of je browser de
          cookie verwijdert.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-950">Vragen</h2>
        <p className="mt-2">
          Zie je iets in dit beleid dat niet klopt, open dan gerust een issue in de GitHub-repo van
          het project.
        </p>
      </section>
    </LegalPage>
  );
}
