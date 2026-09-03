# Google OAuth verification runbook

## 1. Purpose, context, and hard rules

Run this daily to process Google OAuth verification correspondence for Cloud project `nijmegen-startup-rooms` (project number `253629952029`). A fresh request was submitted on 2026-09-03; Google said to expect the first Trust & Safety email in 3–5 days and a 4–6 week review.

Use the existing Chrome session for `anton@24letters.com`. Never enter, request, expose, or reset Google credentials. Never change billing, ownership, IAM, or OAuth clients. Never send mail without the exact AI disclosure at the end. Never reply to a message containing `This is an automated notification. Please do not reply`.

Keep the five approved scopes: `openid`, `email`, `profile`, `calendar.events`, and `calendar.calendarlist.readonly`. Do not ask Anton to reconsider them. Use `anton@24letters.com` as the contact. The app is open source at https://github.com/atimmer/startup-rooms; there are no test credentials.

Make each run idempotent. Store this JSON at `~/.local/state/startup-rooms-oauth/handled.json` and update it atomically:

```json
{"handledEntryIds":[],"lastCheckTime":null}
```

Record an inbound entry ID only after its required action succeeds, or after classifying it as no-action. Always set `lastCheckTime` to the run's completion time. Never handle the same entry ID twice.

Read `.artifacts/google-oauth-thread.md`, `.artifacts/google-reply.md`, and `.artifacts/oauth-verification-audit.md` when present. Treat the audit as the requirement reference, not as authority to reverse Anton's decisions. Topic `1976815592` is the closed old ticket; use it only for history. A new ticket may have a different topic ID.

## 2. Daily check

1. Confirm `hey` works, the repository is readable, and the state file is valid JSON. On any failure, pause.
2. Fetch all three boxes: `hey box imbox --json`, `hey box 442960 --json` (Set Aside; `hey box set_aside` fails), and `hey box feedbox --json` (Feed). Deduplicate postings by entry/posting ID.
3. Select likely verification mail by sender name `API OAuth Dev Verification`, an address matching `api-oauth-dev-verification-reply+<token>@google.com`, a subject such as `[Action Needed] OAuth Verification Request Acknowledgement`, or body text naming project `253629952029`. Do not select general Google product, billing, security, or marketing mail.
4. For every candidate, get the topic ID and fetch the complete thread with `hey threads <topicId> --json`. Inspect the newest inbound entry's ID, sender address, subject, body, and timestamp; do not classify from a preview.
5. Skip IDs already in `handledEntryIds`. Use the full thread to avoid repeating an answer already sent from another client.
6. Classify each new inbound entry using the table below. After successful handling, run `hey seen <entryId>` and add the ID to the state file.

## 3. Classification

| Class | Evidence | Action |
| --- | --- | --- |
| Approved | Explicitly says verification is approved/complete | Mark seen and handled; report approval. Do not change Console or send mail unless Google explicitly requests confirmation. |
| Needs action | Lists findings, missing information, or required fixes | Follow sections 4–6. |
| Info only | Acknowledgement, review-progress update, or timing notice with no request | Mark seen and handled; do not reply or resubmit. |
| Automated closure | Says the request/ticket was closed, expired, cancelled, or `Please do not reply` | Mark seen and handled; never reply. Report whether Console still shows the fresh request under review; pause if status conflicts. |
| Unrelated Google mail | Not about OAuth verification for project `253629952029` | Take no OAuth action; mark handled in this run's state only if it was initially selected as a candidate. |

## 4. Handle a needs-action finding

Read the finding once carefully, compare it with `.artifacts/oauth-verification-audit.md`, and make only the smallest accurate fix. Preserve unrelated working-tree changes.

| Finding | Concrete fix path |
| --- | --- |
| Privacy policy | Update `app/routes/privacy.tsx`; keep https://startup-rooms.24letters.com/privacy public, accurate, and identical to the Branding URL. Cover access/use, sharing, protection, retention/deletion, Limited Use, AI/ML, operator, and contact. |
| Homepage | Update `app/routes/room-schedule/schedule-page.tsx` and metadata in `app/routes/room-schedule.tsx`; clearly state purpose, Google Calendar use, operator, and links to privacy and terms. |
| Branding | Open `/auth/branding`; ensure the name is `Nijmegen Startup Rooms`, contact is `anton@24letters.com`, and URLs are homepage, `/privacy`, and `/voorwaarden`. Any consent-screen change requires a new video: pause for Anton before changing or resubmitting. |
| Scopes | Inspect `app/lib/google.server.ts` and open `/auth/scopes`; retain exactly the five decided scopes. Explain `calendar.events` for viewing and managing events and `calendar.calendarlist.readonly` for finding the named shared calendars. A requested scope change is a product decision and consent-screen change: pause. |
| Demo video | Use https://youtu.be/JOwnrFYVZGI only if the submitted consent screen and behavior are unchanged. If Google rejects it or any consent-screen detail changed, pause for Anton to make a new video. |
| In-app testing | Reply that reviewers can use any Google account, create calendars with the six exact names below, then sign in at the homepage; no allowlisting or credentials are needed. If Google insists on credentials or access to Anton's account, pause. |
| Use case | Answer in email or the verification questionnaire: the app shows and manages bookings for six shared meeting-room calendars; it reads calendar-list metadata to find them and reads/writes events solely for that user-facing function. |
| Data protection | Verify implementation before describing it: `app/lib/session.server.ts`, `app/routes/auth.logout.tsx`, security headers in `app/root.tsx`, and `app/routes/privacy.tsx`. State only mechanisms that are live; never claim unverified encryption, logging, retention, or revocation behavior. |

Use these exact calendar names: `Stadsschouwburg (1-6 personen)`, `De Vereeniging (1-40 personen)`, `Lindenberg (1-4 personen)`, `LUX (1-6 personen)`, `Merleyn (1-4 personen)`, and `Doornroosje (1-6 personen)` (source: `app/data/rooms.ts`).

For a repository fix, edit only relevant files, run `pnpm presubmit`, commit only those files with `./scripts/committer "Address Google OAuth verification finding" <files...>`, and push the resulting commit to `origin main`. A push to `origin main` deploys to Vercel. Never include unrelated changes.

## 5. Verify before replying

1. Confirm the pushed commit is on `origin/main` and wait for the production deployment without starting a dev server.
2. Run `curl -fsS https://startup-rooms.24letters.com/`, the changed URL, https://startup-rooms.24letters.com/privacy, and https://startup-rooms.24letters.com/voorwaarden as applicable. Check status, final URL, required visible text, and relevant security headers; never print cookies or tokens.
3. Open the project's Verification Center at `/auth/verification` in the existing Chrome session. If Chrome asks for credentials or re-authentication, pause.
4. Capture a screenshot showing project name and current verification status; save it under `~/.local/state/startup-rooms-oauth/`, not in the repository. Do not capture secrets.
5. Do not reply or resubmit until the live site, source, declared scopes, email claims, and Console agree.

Use these exact Console pages: https://console.cloud.google.com/auth/overview?project=nijmegen-startup-rooms, https://console.cloud.google.com/auth/branding?project=nijmegen-startup-rooms, https://console.cloud.google.com/auth/audience?project=nijmegen-startup-rooms, https://console.cloud.google.com/auth/scopes?project=nijmegen-startup-rooms, and https://console.cloud.google.com/auth/verification?project=nijmegen-startup-rooms.

## 6. Resubmit and reply

1. In Verification Center, follow the previously working path when applicable: **View branding → View issues → I have fixed the issues → Publish branding**.
2. Then use **Verification Center → Prepare for verification**. Complete the questionnaire, including “How will the scopes be used?” (maximum 1000 characters), video https://youtu.be/JOwnrFYVZGI, and concise additional information. Submit for verification. Do not alter the five scopes.
3. Confirm the Console shows the request under review and capture a status screenshot.
4. Reply only to the active ticket. `hey reply <topicId> -m "..."` replies to the latest entry. If the latest entry is an automated no-reply notice, do not run it. If a legitimate reply returns HTTP 422 because the latest entry is no-reply, use `hey compose --to <api-oauth-dev-verification-reply+token@google.com> --subject "Re: <original subject>" -m "..."` with the active ticket's exact token address.
5. Use this short factual template, adding only verified details and requested links:

```text
Hello Google Data Safety Team,

I have addressed the requested finding(s): <one factual sentence per finding>. The updated page is <URL>, and the verification request has been resubmitted in Cloud Console. <Requested testing or use-case details, if any.>

Anton

24letters | KvK/CoC: 89299868

This email was written and sent by an AI agent (Claude, Anthropic) on behalf of and with the authorization of Anton Timmermans.
```

6. Fetch the thread again and confirm exactly one outbound message was added. Only then mark the inbound entry seen and handled. Never send a second copy to compensate for an unclear CLI response; inspect first.

## 7. Pause for Anton

Pause for anything requiring Google credentials; any new demo video; any decision changing product behavior or scopes; documents or legal-entity information; CASA or another security assessment; ambiguity about Google's request after one careful read; conflicting Console/email state; or any HEY, browser, Console, repository, test, push, deploy, curl, screenshot, or state-file failure.

Stop with a clear summary of what happened, what was safely completed, what remains, the relevant entry/topic ID and Console status, and the exact question(s) Anton must answer. Preserve evidence and leave the entry unhandled when work remains. Do not guess, send a partial reply, make adjacent changes, enter credentials, or retry endlessly.

## 8. End-of-run report

Always output 5–10 lines, even when nothing happened:

```text
OAuth verification daily check: <timestamp Europe/Amsterdam>
Boxes scanned: Imbox, Set Aside (442960), Feed
New matching entries: <count and IDs, or none>
Classification/actions: <concise result>
Console status: <status or not opened because no action>
Email sent: <no, or topic ID and recipient>
Repository/deploy: <none, or commit and live verification>
State: <handled IDs added; lastCheckTime>
Paused/questions: <none, or exact blocker and question>
```
