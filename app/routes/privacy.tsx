import type { Route } from "./+types/privacy";
import { LegalPage } from "~/components/legal-page";
import { CONTACT_EMAIL } from "~/data/legal";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Privacybeleid | Nijmegen Startup Rooms" },
    {
      name: "description",
      content: "In gewone taal uitgelegd welke gegevens Nijmegen Startup Rooms verwerkt.",
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
        <h2 className="text-lg font-semibold text-stone-950">Wie we zijn</h2>
        <p className="mt-2">
          Dit privacybeleid geldt voor Nijmegen Startup Rooms, een applicatie die wordt
          geëxploiteerd door 24letters (KvK 89299868). Vragen of verzoeken over privacy kun je
          sturen naar{" "}
          <a
            className="font-semibold text-stone-900 underline decoration-stone-300 underline-offset-4"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
          . Laatst bijgewerkt: 3 september 2026.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-950">Wat we niet doen</h2>
        <p className="mt-2">
          We hebben geen eigen accountdatabase, geen nieuwsbrief, geen advertentietrackers en geen
          analytics om je gedrag op de site te volgen.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-950">
          Welke gegevens we verwerken en waarvoor
        </h2>
        <p className="mt-2">
          Als je alleen de site opent zonder Google te koppelen, verwerken we in de app zelf in
          principe geen persoonlijke gegevens behalve wat technisch nodig is om de website te tonen.
        </p>
        <p className="mt-2">
          Wanneer je met Google koppelt, verwerkt Nijmegen Startup Rooms je e-mailadres,
          OAuth-toegangstoken en OAuth-vernieuwingstoken. De app leest van de zes gedeelde
          vergaderruimteagenda&apos;s de evenement-ID, titel, begin- en eindtijd en de naam en het
          e-mailadres van de maker. We gebruiken deze gegevens uitsluitend om je te identificeren,
          de kamerplanning te tonen, te bepalen welke boekingen van jou zijn en om op jouw verzoek
          boekingen in Google Calendar aan te maken, te wijzigen, te verplaatsen of te verwijderen.
          Zolang de huidige scopes blijven, ontvangen we ook je Google-naam en profielfoto en lezen
          we tijdelijk metadata van alle agenda&apos;s waarop je bent geabonneerd, zoals agenda-ID,
          naam en toegangsrol, uitsluitend om de zes kameragenda&apos;s te vinden; overige
          agenda&apos;s en hun evenementen worden niet gebruikt. We hebben geen eigen account- of
          boekingendatabase.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-950">Google Calendar</h2>
        <p className="mt-2">
          De agenda-gegevens komen uit Google Calendar. Zodra je Google koppelt, geldt daarnaast ook
          het privacybeleid van Google. Wij slaan die agenda-afspraken niet op in een eigen
          database. Boekingen die je via de app maakt, wijzigt, verplaatst of verwijdert, worden
          rechtstreeks in de betreffende gedeelde Google-agenda verwerkt.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-950">
          Met wie we Google-gebruikersgegevens delen
        </h2>
        <p className="mt-2">
          Wij verkopen, verhuren of gebruiken Google-gebruikersgegevens niet voor advertenties,
          profilering, kredietbeoordeling of gegevenshandel. Gegevens worden alleen verwerkt of
          doorgegeven: (1) aan Google Calendar om op jouw verzoek de zichtbare plannings- en
          boekingsfuncties te leveren; (2) aan Vercel, onze hostingverwerker, voor zover dit
          technisch nodig is om de app veilig te hosten en verzoeken uit te voeren; en (3) wanneer
          jij een boeking in een gedeelde kameragenda maakt of wijzigt, aan de andere personen die
          via Google Calendar al toegang tot die gedeelde agenda hebben. We delen
          Google-gebruikersgegevens niet met andere derden, behalve als jij daar vooraf
          uitdrukkelijk toestemming voor geeft, als dit noodzakelijk is voor beveiliging, of als de
          wet ons daartoe verplicht. Medewerkers of opdrachtnemers lezen deze gegevens niet, behalve
          met jouw uitdrukkelijke toestemming voor specifieke ondersteuning of wanneer dit
          noodzakelijk is voor beveiliging of een wettelijke verplichting.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-950">
          Hoe we gevoelige gegevens beveiligen
        </h2>
        <p className="mt-2">
          We verzenden gegevens uitsluitend via HTTPS/TLS. OAuth-tokens en profielgegevens worden in
          rust versleuteld en opgeslagen in een sessiecookie die ook is beveiligd met HttpOnly,
          Secure en SameSite; integriteitscontrole voorkomt ongemerkte wijziging. Alleen servercode
          gebruikt de tokens om Google API-verzoeken namens jou uit te voeren. OAuth-clientgeheimen
          en encryptiesleutels zijn afgeschermd, beperkt toegankelijk en worden niet naar de browser
          of broncode gestuurd. We slaan geen agenda-afspraken op in een eigen database en loggen
          geen OAuth-tokens of agenda-inhoud. Hoewel geen beveiligingsmaatregel ieder risico
          uitsluit, beperken we toegang en gegevensverwerking tot wat voor de app noodzakelijk is.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-950">
          Bewaartermijnen, uitloggen en verwijderen
        </h2>
        <p className="mt-2">
          Je e-mailadres en OAuth-tokens worden alleen in de versleutelde sessie bewaard, maximaal
          30 dagen na je laatste geldige sessie. De browser bewaart opgehaalde planningsgegevens
          alleen tijdelijk in het geheugen, maximaal vijf minuten; deze kopie verdwijnt ook bij
          vernieuwen/sluiten van de pagina of bij uitloggen. Boekingen zelf staan in Google Calendar
          en blijven daar bestaan totdat een bevoegde gebruiker ze verwijdert volgens het beleid van
          de betreffende agenda. Met “Uitloggen en Google-koppeling verwijderen” trekken we de
          Google-toegang in en verwijderen we direct de sessiegegevens en tijdelijke cache van dit
          apparaat. Je kunt toegang ook intrekken via de{" "}
          <a
            className="font-semibold text-stone-900 underline decoration-stone-300 underline-offset-4"
            href="https://myaccount.google.com/connections"
            rel="noreferrer"
            target="_blank"
          >
            pagina met verbindingen met derden van je Google-account
          </a>
          . Voor een inzage- of verwijderverzoek kun je mailen naar{" "}
          <a
            className="font-semibold text-stone-900 underline decoration-stone-300 underline-offset-4"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
          ; gegevens die wij niet bewaren kunnen we niet verwijderen uit Google Calendar, maar we
          helpen je bepalen waar je dit kunt doen. Technische hostinglogs bevatten geen OAuth-tokens
          of agenda-inhoud en worden niet langer bewaard dan nodig voor beveiliging en
          storingsanalyse.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-950">Google Limited Use</h2>
        <p className="mt-2">
          Het gebruik van informatie die Nijmegen Startup Rooms ontvangt via Google Workspace-scopes
          zal voldoen aan het{" "}
          <a
            className="font-semibold text-stone-900 underline decoration-stone-300 underline-offset-4"
            href="https://developers.google.com/terms/api-services-user-data-policy"
            rel="noreferrer"
            target="_blank"
          >
            Google User Data Policy
          </a>
          , inclusief de{" "}
          <a
            className="font-semibold text-stone-900 underline decoration-stone-300 underline-offset-4"
            href="https://developers.google.com/workspace/workspace-api-user-data-developer-policy#limited_use_of_user_data"
            rel="noreferrer"
            target="_blank"
          >
            Limited Use requirements
          </a>
          .
        </p>
        <p className="mt-2" lang="en">
          The use of information received from Google Workspace scopes will adhere to the Google
          User Data Policy, including the Limited Use requirements.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-950">Geen AI/ML-training</h2>
        <p className="mt-2">
          Nijmegen Startup Rooms gebruikt, deelt, verkoopt of draagt geen ruwe, geaggregeerde,
          geanonimiseerde of afgeleide Google Workspace-gebruikersgegevens over om algemene of
          niet-gepersonaliseerde machinelearning- of kunstmatige-intelligentiemodellen te
          ontwikkelen, te verbeteren of te trainen. De app gebruikt Google
          Workspace-gebruikersgegevens helemaal niet voor AI- of ML-training, ook niet voor een
          gepersonaliseerd model.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-950">Cookies</h2>
        <p className="mt-2">
          We gebruiken alleen een functionele, versleutelde sessiecookie om de Google-koppeling en
          je sessie te laten werken. We gebruiken geen marketingcookies.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-950">Hosting via Vercel</h2>
        <p className="mt-2">
          De app wordt gehost op Vercel. Daardoor kan Vercel technische serverlogs verwerken, zoals
          verzoekgegevens en IP-adressen, voor hosting, beveiliging en storingsanalyse. Deze logs
          bevatten geen OAuth-tokens of agenda-inhoud.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-950">Vragen en contact</h2>
        <p className="mt-2">
          Heb je een vraag, zie je iets in dit beleid dat niet klopt of wil je een privacyverzoek
          doen? Mail dan naar{" "}
          <a
            className="font-semibold text-stone-900 underline decoration-stone-300 underline-offset-4"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
