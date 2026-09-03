# Google OAuth verification audit — Nijmegen Startup Rooms

Audit date: 2026-09-03  
Project: `nijmegen-startup-rooms` · operator: 24letters (KvK 89299868)  
Live URLs: [homepage](https://startup-rooms.24letters.com/) · [privacy](https://startup-rooms.24letters.com/privacy) · [terms](https://startup-rooms.24letters.com/voorwaarden)

## Verdict and priority

Do **not** resubmit yet. The two 2026-08-27 findings are valid, and fixing only those two sentences leaves several likely next-round findings.

### P0 — blockers before resubmission

1. Replace the privacy policy with complete, explicit disclosures for access/use, sharing, protection, retention/deletion, Limited Use, and AI/ML (draft below).
2. Encrypt OAuth access/refresh tokens at rest before claiming that they are encrypted. The current React Router cookie is HMAC-signed/base64-encoded, not encrypted.
3. Add a visible “Uitloggen en Google-koppeling verwijderen” control that revokes the Google grant/token and destroys the local session; document both this and Google Account revocation.
4. Make the disclosure immediately above “Sign in with Google” accurate: the app currently reads the user's whole Calendar List metadata before filtering, and also requests/stores profile data. State access, use, and sharing there—not only in `/privacy`.
5. Minimize scopes: remove unused `profile`; preferably configure the six stable calendar IDs and remove `calendar.calendarlist.readonly`. If Calendar List discovery stays, disclose it and justify why fixed IDs cannot work.

### P1 — verification package / human checks

6. In Cloud Console confirm exact name and URLs, production status, declared scopes, support/developer emails, and that only `24letters.com` is an authorized domain where possible.
7. Confirm the Search Console **Domain property** for `24letters.com` is owned by a current project Owner/Editor. A public DNS verification TXT exists, but account/project linkage is not externally verifiable.
8. Give the reviewer account write access to test room calendars, or supply a no-2FA test account that has it, plus exact test steps. An arbitrary Google account will not see the six private/shared calendars.
9. If scopes or visible branding change, record a fresh demo showing the final app, English consent screen, expanded scope list, and read/create/update/delete behavior.

### P2 — hardening (remove avoidable ambiguity)

10. Change the document title `Meeting Rooms` and legal-page eyebrow `Startup Rooms` to the exact verified name `Nijmegen Startup Rooms`.
11. Use a Google-compliant authorization button (the current custom accent button says “Sign in with Google” but has no official Google treatment).
12. Identify 24letters, KvK number, contact email, and “last updated” date directly in both legal pages. The terms page exists and is reachable, but its substance is unusually thin.
13. Either self-host Source Sans 3 or disclose that Google Fonts receives normal web-request metadata such as IP address.

## Sources and policy baseline

- The old [OAuth verification FAQ URL (9110914)](https://support.google.com/cloud/answer/9110914) now redirects to the [OAuth App Verification Help Center (13463073)](https://support.google.com/cloud/answer/13463073).
- [Verification requirements (13464321)](https://support.google.com/cloud/answer/13464321): homepage, privacy/domain/branding, demo, appropriate use, Limited Use, and minimum scopes.
- [App Privacy Policy quick-reference](https://support.google.com/cloud/answer/13806988): specifically calls for data-sharing, security, retention/deletion, and non-personalized AI/ML disclosures.
- [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy): accurate identity/intent; comprehensive access/use/storage/sharing; minimum permissions; security; Limited Use.
- [Google Workspace user data and developer policy](https://developers.google.com/workspace/workspace-api-user-data-developer-policy) (updated 2026-07-22): in-context disclosure and consent, user deletion help, Limited Use wording, AI/ML restrictions, encryption in transit/at rest, and encrypted OAuth tokens.
- Supporting review guides: [Homepage](https://support.google.com/cloud/answer/13807376), [Identity & Branding](https://support.google.com/cloud/answer/13804963), [Domain Verification](https://support.google.com/cloud/answer/13804266), [Demo Video](https://support.google.com/cloud/answer/13804565), [In-app Testing](https://support.google.com/cloud/answer/13807382), [Application Use Cases](https://support.google.com/cloud/answer/13805798), and [Minimum Scopes](https://support.google.com/cloud/answer/13807380).
- [Calendar scope definitions](https://developers.google.com/workspace/calendar/api/auth).

## Requirement-by-requirement audit

### 1. App Homepage — PASS (with disclosure hardening under item 4)

**Google requires:** public without login, accurate app/brand identity, full functionality and purpose for requesting user data, on a verified owned domain, with the same privacy-policy link used in OAuth configuration ([Homepage guide](https://support.google.com/cloud/answer/13807376)).

**Current:** live `/` returns 200 without login and visibly says “Nijmegen Startup Rooms,” explains viewing/booking six Startup Nijmegen rooms, names Google Calendar and 24letters, and links `/privacy` and `/voorwaarden`. This addresses the April rejection. Privacy is one click away on the same host, which Google prefers/requires in its verification guidance.

**Fix:** keep this structure. Update the pre-consent paragraph because “uitsluitend de data van de 6 kalenders” is not accurate while the app reads all Calendar List metadata and profile data. Align the HTML title with the app name.

### 2. Domain Verification — CANNOT VERIFY FROM HERE

**Google requires:** every authorized domain verified in Search Console by an account that is also a project Owner/Editor; current guidance says use a DNS-level Domain property ([requirements](https://support.google.com/cloud/answer/13464321), [domain guide](https://support.google.com/cloud/answer/13804266)).

**Current:** site/privacy/terms are all HTTPS on `startup-rooms.24letters.com`; DNS for `24letters.com` contains a `google-site-verification` TXT. That does not prove the verifying account has the right Cloud role. The reviewers progressed past earlier rounds, so this is likely already accepted.

**Fix:** in Search Console verify the `24letters.com` Domain property using the same Google account that is a current Owner/Editor of project `nijmegen-startup-rooms`; remove unused authorized domains/redirect origins and confirm the submitted homepage does not redirect.

### 3. App Identity & Branding — CANNOT VERIFY FROM HERE (site mostly passes)

**Google requires:** app name/logo/identity must be unique, not impersonate Google, and match the homepage, consent screen, submission, and demo; Google-action buttons must follow branding ([requirements](https://support.google.com/cloud/answer/13464321), [identity guide](https://support.google.com/cloud/answer/13804963)).

**Current:** homepage visible name matches the thread's consent-screen name, and 24letters is named as operator. No Google trademark is in the app name. Cloud Console name/logo/support email cannot be inspected. The page `<title>` is only “Meeting Rooms”; legal pages say “Startup Rooms”; the OAuth link is a custom-colored “Sign in with Google” button.

**Fix:** use `Nijmegen Startup Rooms` consistently in metadata and legal chrome; confirm the same name/logo in Cloud Console and final video; use Google's approved sign-in/authorization button treatment.

### 4. Privacy Policy: access, use, storage, and sharing — GAP

**Google requires:** a dedicated, accessible HTML policy linked prominently in-product and from the homepage and consent screen; the homepage and consent URLs must be identical; it must comprehensively and accurately disclose how Google user data is accessed, used, stored, deleted, and shared ([requirements](https://support.google.com/cloud/answer/13464321), [privacy guide](https://support.google.com/cloud/answer/13806988), [User Data Policy](https://developers.google.com/terms/api-services-user-data-policy)). Workspace also requires a distinct in-context disclosure immediately before affirmative consent—not only a privacy policy.

**Current:** dedicated `/privacy` is public, responsive HTML, on the homepage domain, linked twice from `/`, and says profile data/tokens are in a 30-day cookie and events are not in an app database. But it omits the operator/contact; exact Calendar fields; whole Calendar List access; stored profile photo; five-minute browser-memory cache; disclosure to users of shared calendars; deletion/revocation; Limited Use; and AI/ML. The consent-screen URL match is Cloud-only. The latest reviewer explicitly rejected sharing and protection.

**Fix:** publish the drafted sections below, link the Google policy, add the consent-adjacent short disclosure, and verify Cloud Console points exactly to `https://startup-rooms.24letters.com/privacy`.

### 5. Data sharing / transfer / disclosure — GAP (explicit rejection)

**Google requires:** say whether and with whom Google data is shared/transferred/disclosed, including processors; transfers are allowed only for the visible user-facing feature with consent, security, law, or consented corporate transaction. Humans may not read it except the policy's narrow exceptions ([privacy guide](https://support.google.com/cloud/answer/13806988), [Limited Use](https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes)).

**Current:** Vercel server logs are mentioned, but the policy never plainly says who receives Google user data, that user-entered bookings go into a shared Google calendar, or that there are no sales/advertising/data-broker transfers.

**Fix:** add “Met wie we gegevens delen” below and ensure Vercel logging never records tokens or Calendar payloads. The app should not give 24letters staff routine human access to event data.

### 6. Data protection / security mechanisms — GAP (explicit rejection + implementation gap)

**Google requires:** reasonable protection against unauthorized access/use/loss/disclosure, secure modern transport, encryption at rest, and OAuth access/refresh tokens encrypted at rest ([User Data Policy](https://developers.google.com/terms/api-services-user-data-policy#maintain_a_secure_operating_environment), [Workspace policy](https://developers.google.com/workspace/workspace-api-user-data-developer-policy#maintain_a_secure_operating_environment)). The privacy guide asks for concrete mechanisms, not “we take security seriously.”

**Current:** live HTTPS has HSTS; OAuth uses a state value; the cookie is `HttpOnly`, `Secure` in production, `SameSite=Lax`, and HMAC-signed. However, `createCookieSessionStorage` base64-encodes and signs its contents—it does not encrypt them—while the cookie contains access/refresh tokens and profile data. There is no database, which reduces exposure.

**Fix:** simplest compatible design is authenticated encryption of the cookie payload (for example AES-256-GCM with separately managed/rotatable key material); alternatively store encrypted tokens server-side and put only a random session ID in the cookie. Keep TLS/HSTS and flags, prevent sensitive request/response logging, rotate/restrict secrets, and add the security paragraph only after deployment.

### 7. Retention and deletion — GAP

**Google requires:** disclose retention and deletion and honor deletion requests; Workspace requires user help explaining how users manage/delete app data ([privacy guide](https://support.google.com/cloud/answer/13806988), [Workspace notice/control](https://developers.google.com/workspace/workspace-api-user-data-developer-policy#transparent_and_accurate_notice_and_control)).

**Current:** policy says session cookie max 30 days or earlier logout/browser deletion. It does not cover the five-minute client memory cache, calendar-event lifetime, token revocation, deletion requests, or Vercel metadata. `/auth/logout` destroys the cookie, but no visible UI invokes it and it does not revoke the Google grant.

**Fix:** add visible disconnect/revoke, clear memory cache on disconnect, document Google Account → third-party connections as a second route, add monitored contact email, and publish the retention paragraph below. Confirm Vercel's configured log retention before stating a number for technical logs.

### 8. Limited Use disclosure — GAP

**Google requires:** an affirmative statement in the app/site. Google's current example is: “The use of information received from Google Workspace scopes will adhere to the Google User Data Policy, including the Limited Use requirements.” ([Workspace Limited Use section](https://developers.google.com/workspace/workspace-api-user-data-developer-policy#limited_use_of_user_data)).

**Current:** absent.

**Fix:** add the linked Dutch statement below; keeping Google's exact English sentence immediately beneath it is the lowest-risk reviewer experience.

### 9. AI/ML model-training disclosure — GAP

**Google requires:** the privacy policy must explicitly affirm that Workspace APIs are not used to develop, improve, or train non-personalized AI/ML models. Generalized/foundational model training from raw or derived Workspace data is prohibited; a personalized model has a narrow exception and requires explicit consent/demo evidence ([privacy guide](https://support.google.com/cloud/answer/13806988), [application-use guide](https://support.google.com/cloud/answer/13805798), [Workspace Limited Use](https://developers.google.com/workspace/workspace-api-user-data-developer-policy#limited_use_of_user_data)).

**Current:** no AI/ML feature in source and no disclosure.

**Fix:** add the unqualified no-AI/ML paragraph below and confirm the same in the reply to reviewers.

### 10. Demo Video — PASS based on review history; recheck if anything changes

**Google requires:** accessible video of the exact submitted app/branding; end-to-end OAuth grant; complete consent screen in English with every exact scope revealed; functionality using every scope ([demo guide](https://support.google.com/cloud/answer/13804565)).

**Current:** the April replacement is public at [JOwnrFYVZGI](https://youtu.be/JOwnrFYVZGI); reviewers then moved to homepage and privacy findings, so it appears accepted. Its frames cannot be fully audited from text here.

**Fix:** if scopes are reduced, record again after code and Cloud Console agree. Explicitly narrate Calendar List discovery if retained, profile use if retained, event read, create, edit/move, and delete. Show the client/app identity and click the consent screen's service/scopes expansion.

### 11. In-app Testing — CANNOT VERIFY FROM HERE

**Google requires:** login URL and step-by-step OAuth/test instructions; allowlist the reviewer account or give authorized no-2FA local credentials; supply every prerequisite/input needed to exercise the scopes ([in-app testing guide](https://support.google.com/cloud/answer/13807382)).

**Current:** any Google user can start OAuth, but calendars are discovered only when that Google account is already subscribed to the named private/shared calendars. No reviewer-access evidence is in the thread.

**Fix:** share six safe test calendars with the reviewer as writer (or provide a dedicated account and test deployment), seed an event, and give deterministic steps for sign-in → view → create → edit/move → delete → disconnect. Do not put credentials in public docs/video.

### 12. Application Use Cases — PASS on product; Cloud submission CANNOT VERIFY

**Google requires:** sensitive data only for an appropriate user-facing use; productivity features with identifiable benefit/efficiency are typical approved uses ([verification requirements](https://support.google.com/cloud/answer/13464321)).

**Current:** a visible productivity tool that makes six shared meeting-room calendars easier to view and manage. It reads/writes directly for the consenting user and has no ads, surveillance, brokerage, credit, or AI use. This is an appropriate use case.

**Fix:** Cloud justification should say exactly that; avoid describing it as accessing a user's general calendar. State that only six shared room calendars are used after discovery/configuration and that no data supports secondary purposes.

### 13. Requesting Minimum Scopes — GAP

**Google requires:** only scopes critical to implemented features, with a detailed reason narrower scopes fail; consent-screen, code, submission, and video scopes must match ([requirements](https://support.google.com/cloud/answer/13464321), [minimum-scope guide](https://support.google.com/cloud/answer/13807380)).

**Current:** code requests `openid`, `email`, `profile`, `calendar.events`, and `calendar.calendarlist.readonly`. `calendar.events` is justified: the app displays event titles/times/creators and creates/updates/deletes on shared calendars; read-only/free-busy cannot write/show needed fields, and `calendar.events.owned` fails for calendars the user can edit but does not own. `profile` is not justified: name/photo are stored but unused. Calendar List is used to match six summaries but stable configured calendar IDs could avoid access to the user's entire subscribed-calendar list.

**Fix (preferred):** retain `openid email calendar.events`; remove `profile`; configure calendar IDs and remove `calendar.calendarlist.readonly`. If dynamic discovery is operationally essential, keep Calendar List but explain why IDs cannot be configured and disclose that all subscribed-calendar metadata is transiently read and immediately filtered.

### 14. Cloud-only/general checks — CANNOT VERIFY FROM HERE

Confirm production/external audience, project contact and support email are current, all redirect URIs/origins belong to the app, declared scopes exactly match runtime, Cloud Abuse Project History has no finding, and homepage/privacy/terms URLs are exact. Calendar scopes here are sensitive, not restricted, so CASA is not normally required. `/voorwaarden` is public HTML and linked from `/`; confirm that exact URL is in Branding.

## Exact Dutch privacy-policy text to publish

Use only after the implementation matches it. Replace `[contactadres]` with a monitored address. If `profile` or Calendar List remains, retain the bracketed sentence; otherwise remove it.

### Identity and data access/use (needed for completeness)

> Dit privacybeleid geldt voor Nijmegen Startup Rooms, een applicatie die wordt geëxploiteerd door 24letters (KvK 89299868). Vragen of verzoeken over privacy kun je sturen naar [contactadres]. Laatst bijgewerkt: [publicatiedatum].
>
> Wanneer je met Google koppelt, verwerkt Nijmegen Startup Rooms je e-mailadres, OAuth-toegangstoken en OAuth-vernieuwingstoken. De app leest van de zes gedeelde vergaderruimteagenda's de evenement-ID, titel, begin- en eindtijd en de naam en het e-mailadres van de maker. We gebruiken deze gegevens uitsluitend om je te identificeren, de kamerplanning te tonen, te bepalen welke boekingen van jou zijn en om op jouw verzoek boekingen in Google Calendar aan te maken, te wijzigen, te verplaatsen of te verwijderen. [Zolang de huidige scopes blijven: we ontvangen ook je Google-naam en profielfoto en lezen tijdelijk metadata van alle agenda's waarop je bent geabonneerd, zoals agenda-ID, naam en toegangsrol, uitsluitend om de zes kameragenda's te vinden; overige agenda's en hun evenementen worden niet gebruikt.] We hebben geen eigen account- of boekingendatabase.

*English gloss: identifies 24letters/contact and exhaustively lists profile, token, Calendar List, event fields, purposes/actions, and lack of app database.*

### Met wie we Google-gebruikersgegevens delen

> Wij verkopen, verhuren of gebruiken Google-gebruikersgegevens niet voor advertenties, profilering, kredietbeoordeling of gegevenshandel. Gegevens worden alleen verwerkt of doorgegeven: (1) aan Google Calendar om op jouw verzoek de zichtbare plannings- en boekingsfuncties te leveren; (2) aan Vercel, onze hostingverwerker, voor zover dit technisch nodig is om de app veilig te hosten en verzoeken uit te voeren; en (3) wanneer jij een boeking in een gedeelde kameragenda maakt of wijzigt, aan de andere personen die via Google Calendar al toegang tot die gedeelde agenda hebben. We delen Google-gebruikersgegevens niet met andere derden, behalve als jij daar vooraf uitdrukkelijk toestemming voor geeft, als dit noodzakelijk is voor beveiliging, of als de wet ons daartoe verplicht. Medewerkers of opdrachtnemers lezen deze gegevens niet, behalve met jouw uitdrukkelijke toestemming voor specifieke ondersteuning of wanneer dit noodzakelijk is voor beveiliging of een wettelijke verplichting.

*English gloss: no sale/ads; only Google, Vercel, existing shared-calendar members, consented support/security, or law.*

### Hoe we gevoelige gegevens beveiligen

> We verzenden gegevens uitsluitend via HTTPS/TLS. OAuth-tokens en profielgegevens worden in rust versleuteld en opgeslagen in een sessiecookie die ook is beveiligd met `HttpOnly`, `Secure` en `SameSite`; integriteitscontrole voorkomt ongemerkte wijziging. Alleen servercode gebruikt de tokens om Google API-verzoeken namens jou uit te voeren. OAuth-clientgeheimen en encryptiesleutels zijn afgeschermd, beperkt toegankelijk en worden niet naar de browser of broncode gestuurd. We slaan geen agenda-afspraken op in een eigen database en loggen geen OAuth-tokens of agenda-inhoud. Hoewel geen beveiligingsmaatregel ieder risico uitsluit, beperken we toegang en gegevensverwerking tot wat voor de app noodzakelijk is.

*English gloss: TLS in transit; authenticated encryption and cookie controls at rest; server-only token use; restricted secrets; no sensitive logging/database.*

### Bewaartermijnen, uitloggen en verwijderen

> Je e-mailadres en OAuth-tokens worden alleen in de versleutelde sessie bewaard, maximaal 30 dagen na je laatste geldige sessie. De browser bewaart opgehaalde planningsgegevens alleen tijdelijk in het geheugen, maximaal vijf minuten; deze kopie verdwijnt ook bij vernieuwen/sluiten van de pagina of bij uitloggen. Boekingen zelf staan in Google Calendar en blijven daar bestaan totdat een bevoegde gebruiker ze verwijdert volgens het beleid van de betreffende agenda. Met “Uitloggen en Google-koppeling verwijderen” trekken we de Google-toegang in en verwijderen we direct de sessiegegevens en tijdelijke cache van dit apparaat. Je kunt toegang ook intrekken via de pagina met verbindingen met derden van je Google-account. Voor een inzage- of verwijderverzoek kun je mailen naar [contactadres]; gegevens die wij niet bewaren kunnen we niet verwijderen uit Google Calendar, maar we helpen je bepalen waar je dit kunt doen. Technische hostinglogs bevatten geen OAuth-tokens of agenda-inhoud en worden niet langer bewaard dan nodig voor beveiliging en storingsanalyse.

*English gloss: exact 30-day token/profile and five-minute cache periods; Calendar is system of record; revoke/delete paths and request contact.*

### Google Limited Use

> Het gebruik van informatie die Nijmegen Startup Rooms ontvangt via Google Workspace-scopes zal voldoen aan het [Google User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), inclusief de [Limited Use requirements](https://developers.google.com/workspace/workspace-api-user-data-developer-policy#limited_use_of_user_data).
>
> The use of information received from Google Workspace scopes will adhere to the Google User Data Policy, including the Limited Use requirements.

*English gloss: this is Google's current example wording, retained verbatim for reviewer recognition.*

### Geen AI/ML-training

> Nijmegen Startup Rooms gebruikt, deelt, verkoopt of draagt geen ruwe, geaggregeerde, geanonimiseerde of afgeleide Google Workspace-gebruikersgegevens over om algemene of niet-gepersonaliseerde machinelearning- of kunstmatige-intelligentiemodellen te ontwikkelen, te verbeteren of te trainen. De app gebruikt Google Workspace-gebruikersgegevens helemaal niet voor AI- of ML-training, ook niet voor een gepersonaliseerd model.

*English gloss: neither raw nor derived Workspace data is used or transferred for generalized, non-personalized, or personalized AI/ML training.*

## Consent-adjacent short disclosure

Immediately above the Google button, after preferred scope minimization:

> Als je doorgaat, ontvangt Nijmegen Startup Rooms je e-mailadres en toegang tot evenementen in de zes gedeelde vergaderruimteagenda's. De app gebruikt dit alleen om de planning te tonen en om op jouw verzoek boekingen in Google Calendar aan te maken, te wijzigen of te verwijderen. Een boeking in een gedeelde agenda is zichtbaar voor anderen die al toegang tot die agenda hebben. Vercel verwerkt gegevens alleen als hostingprovider. Lees het privacybeleid voor beveiliging, bewaartermijnen en verwijderen.

If Calendar List remains, add: “Om de zes agenda's te vinden leest de app eerst tijdelijk de namen, ID's en toegangsrollen van alle Google-agenda's waarop je bent geabonneerd; andere agenda's en hun evenementen worden niet gebruikt.”

## Suggested final scope justifications

- `openid` + `email`: authenticate the consenting user and obtain their email address so the app can identify their session and distinguish bookings created by that email. No broader profile data is needed.
- `calendar.events`: show event title, time, and creator for six shared room calendars and let the user create, update/move, and delete bookings. `freebusy` and read-only scopes cannot supply all displayed fields and writes; `calendar.events.owned` does not cover shared calendars the user may edit but does not own.
- `calendar.calendarlist.readonly` **only if retained**: transiently list subscribed calendar metadata and match exactly six configured room names for the current account. Explain concretely why stable calendar IDs cannot replace this; otherwise remove it.

## Human decisions before implementation/resubmission

1. Choose a monitored public privacy/support email (recommended: a role address such as `privacy@24letters.com`; use `anton@24letters.com` only if it is the intended public support channel).
2. Choose token storage: encrypted cookie (smallest change) or encrypted server-side store plus opaque session ID.
3. Choose room discovery: configured stable calendar IDs (recommended; removes one sensitive scope) or retain Calendar List and accept fuller disclosure/justification.
4. Choose reviewer access: actual shared calendars, cloned safe test calendars, or dedicated test account/deployment.
5. Decide whether to self-host the font or disclose Google Fonts.

## Lower-cost alternative (verification not chosen)

If every user belongs to one Google Workspace/Cloud Identity organization, set the app to **Internal**; otherwise a service account controlling dedicated room calendars plus separate app authorization could remove per-user OAuth. Merely removing Calendar List/profile does **not** avoid verification because `calendar.events` remains sensitive ([exceptions](https://support.google.com/cloud/answer/13464323)).
