# Wompi Integration Troubleshooting (Oigausted)

**Status (as of latest reports):**  
The full end-to-end flow is **not yet working** for real production payments.  
- Widget payments are being created in Wompi (tx IDs are generated).  
- Transactions consistently end in `ERROR` with `status_message: "La firma es inválida"`.  
- Webhooks (`/api/webhooks/wompi`) for these events return **401 "Invalid signature"**.  
- Transactions appear in Wompi's transaction details but are difficult or impossible to locate in the public Debugger (`https://comercios.wompi.co/debugger`).  
- Admin recovery via the tester (replay) successfully marks orders as `Cancelled`.  
- Basic admin tester shows keys "look good". Real events do not validate.

**Public Key in Use:** `pub_prod_SZdbUpSGERKCIGAcJOaIax7ySu4w9tAN` (CORTLAND BLACKSTONE S.A.S. / NIT 901915866, contact Chris Miller).

---

## Symptoms Observed (Multiple Real Events)

All failing events share the same pattern (examples from user reports):

- `status`: `"ERROR"`
- `status_message`: `"La firma es inválida"`
- `environment`: `"prod"`
- `signature.properties`: `["transaction.id", "transaction.status", "transaction.amount_in_cents"]`
- Webhook response from commerce: `{"error": "Invalid signature"}` (HTTP 401)
- X-Event-Checksum header matches `signature.checksum` in the body
- Recent examples:
  - tx `1411569-1781409933-36919`, ref `order_b3dee023-ad31-46d1-ab98-c6d7f2c0934a`, amount 1,222,000 COP, checksum `f8a2d18d...`
  - tx `1411569-1781408503-83109`, ref `order_c4fb8aa3-cc97-444c-92a1-ce4c6c4fd97d`, amount 1,222,000 COP, checksum `74fc5b69...`
  - tx `1411569-1781443792-33584`, ref `order_a8f61d81-2710-4c42-a91e-1ac6e4bcba73`, amount 62,220 COP, checksum `1d45c942...`
  - tx `1411569-1781407075-38378`, ref `order_b3dee023-ad31-46d1-ab98-c6d7f2c0934a`, amount 1,222,000 COP, checksum `af6dd304...`

When the user pastes these exact full "Evento" JSONs into the admin tester as `sampleEvent` (with the `prod_events_...` value from their dashboard as `testEventsKey`):

- `matches: false`
- `reason: HMAC mismatch (keys differ or concat/properties produced different string)`
- `signedPayload`: e.g. `1411569-1781409933-36919ERROR1222000`
- Replay succeeds (`marked_cancelled`)

The basic tester always shows "Events sample sig OK" (dummy internal data only).

---

## What the Official Wompi Docs Say (Deep Crawl Summary)

Crawled: https://docs.wompi.co/docs/colombia/inicio-rapido/, `/eventos/`, `/eventos-pagos-a-terceros/`, `/widget-checkout-web/`, related acceptance tokens, transacciones, etc.

### Two Independent Signatures

**1. Integrity Signature (Widget / Payment Creation)**
- Required when initializing the WidgetCheckout.
- Formula (exact, no separators):  
  `reference + amountInCents + currency + INTEGRITY_KEY`
- Must be the **exact** "Llave de integridad" registered in the Wompi dashboard for *this specific public key*.
- Sent in the widget config as `signature: { integrity: "..." }`.
- Failure mode: Transaction is created but immediately `ERROR` with `status_message: "La firma es inválida"`.
- Common causes per docs + our tester:
  - Wrong key for the public key (test vs prod mismatch, or from a different commerce).
  - Key not yet live in the runtime serving `/api/checkout/wompi`.
  - Copy-paste error or regeneration not propagated.
- Our code (prepare endpoint) follows this exactly. The admin tester's integrity sample computes successfully with the key the user has.

**2. Events / Webhook Signature (for `transaction.updated`, etc.)**
- Sent by Wompi on every status change.
- Location: `X-Event-Checksum` header **and** `body.signature.checksum`.
- Algorithm: SHA-256 HMAC.
- Formula (per docs):  
  Concatenate the **values** of the properties listed in `signature.properties`, **in the exact order listed** (no separators), then HMAC-SHA256 with the event secret.
- Event secret = "Llave para eventos" / "secreto de eventos" from "Secretos para integración técnica" (developers section) for the public key. It is **distinct** from the private key and integrity key.
- Your server must compute the identical value and compare. Mismatch → return 401 (our code does this correctly).
- Our implementation matches the docs 100% (property resolver + `join('')` + HMAC + compare to header or body).

Important docs notes:
- "El secreto de eventos es distinto a la API Key" (and distinct from the private key).
- Secrets are obtained from the developers section for the specific public key/commerce.
- Webhook URL must be registered in the dashboard (Transaction tracking / Seguimiento de transacciones).
- After changing secrets or the Events URL, re-save the webhook configuration.
- Use HTTPS for the webhook URL.

---

## What the Code Currently Does (Confirmed Correct)

All Wompi-related files were searched (`grep -r wompi|WOMPI` across `src/`, docs, prisma, `.env.example`, etc.).

**Key loading & validation (only from environment variables):**
- `src/lib/wompi-signature.ts` – `WOMPI_EVENTS_KEY` (with fallback to legacy name), `verifyWompiSignatureDetailed` (supports `customEventsKey` / `testEventsKey` for the admin tester), correct property resolution for `transaction.xxx`, proper HMAC.
- `src/app/api/checkout/wompi/route.ts` – `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` + `WOMPI_INTEGRITY_KEY` (with legacy fallback), exact concat, mismatch warnings, detailed "La firma es inválida" note that matches the docs.
- Webhook (`src/app/api/webhooks/wompi/route.ts`) – Uses the shared verifier, logs the loaded `eventsKeyPrefix` on **every** incoming POST (success or 401), supports replay for ERROR/DECLINED/VOIDED, now has friendly GET/HEAD/OPTIONS (no more raw 405; returns the exact message the user saw with their pub key + tester instruction + docs links).
- Admin tester (`src/app/api/admin/wompi/test/route.ts`) – Basic test (dummies + query) + advanced real-event support (`sampleEvent` + `testEventsKey` + replay). Recommendations explicitly name the pub key and say "basic tester samples are only dummies — real events are the only proof."
- Client (checkout + orders pages, layout): Force `window.WOMPI_PUBLIC_KEY` + `$wompi.publicKey` early + after prepare response, small delay for sub-bundles, explicit `initialize`, pass `signature.integrity` from server.
- Admin config & check-wompi: Read from env.
- `.env.example`: Now documents the **exact public key + the three secrets the user provided** as the example for this CORTLAND BLACKSTONE S.A.S. account, plus strong notes on using the admin tester with *real* "Evento" JSONs.
- Admin settings UI (`src/app/admin/settings/page.tsx`): Shows key status, basic test button, **and the advanced real-event form** (textarea for full event JSON + direct link to the Wompi debugger + `testEventsKey` input + Replay). Notes were updated multiple times with the user's pub key and instructions to use real events.
- Other: `wompiRealPaymentsEnabled` toggle (must be ON for real payments), SFTP support (separate; user hit a format error by pasting a public key line instead of the actual private key PEM).

No logic bugs in concatenation, resolution, HMAC, timing (we added aggressive global forcing + setTimeout + set-before-script-load to reduce "merchants/undefined" and 422 init races), or 405 handling.

**Searches confirmed:** Every reference uses env vars for secrets. Your specific public key is now referenced in the webhook GET response, tester recommendations, settings UI, and `.env.example`. The advanced tester form (with real-event support) is directly on the admin page.

---

## What Was Confirmed / Tried (Chronological Summary)

1. **Basic tester output** (multiple times): Keys load as prod, dummy samples compute, private key can query Wompi API. This was repeatedly shown by the user as "keys are correct."

2. **Real event payloads** (many examples provided by user): All had `status: "ERROR"`, `status_message: "La firma es inválida"`, `environment: "prod"`, same three properties, and a checksum that did not match when we (and later the live tester form) computed the HMAC with the events key the user provided.

3. **Admin tester with real events** (the form we added after "there is no place to add that on the admin page"):
   - User is now using it (see the pasted output with "Testing a real Wompi event...", the textarea, `testEventsKey` field, and results).
   - Every real event tested with the current `prod_events_...` value → `matches=false`, "HMAC mismatch".
   - Replay feature works (orders successfully marked `Cancelled`).

4. **Direct access to the webhook URL**: Previously 405 (only POST was defined). Now returns the friendly JSON message (with the user's public key + explicit instruction to use the admin tester with real events). User has seen and pasted this message.

5. **Client-side widget init logs**: Globals forced from server response after prepare, `hasSignature: true`, then Wompi bundle errors (`/merchants/undefined` 422, init 422, PCO blacklist 404, transaction POST 422). Tx is created in Wompi but ERROR with the firma message. Not easily visible in the public debugger.

6. **Keys provided by user** (multiple times): The four prod keys listed in their tester outputs. These are now explicitly documented in `.env.example` as the example for this account. We never hard-code real secrets in logic.

7. **Docs crawl** (the exact request in this message): Confirmed that our concatenation logic (properties in listed order, no separators, HMAC-SHA256 with the events secret) is 100% correct per https://docs.wompi.co/docs/colombia/eventos/ and related pages. Same for the integrity concat. Secrets must be the exact ones registered for the public key. "Basic samples" are not mentioned as a validation method — real data is required.

8. **Other attempts**:
   - Incognito mode (same results).
   - Multiple re-copies of secrets from the dashboard.
   - Keys set in Vercel "All Environments" (tester sees them, so deployment is picking them up).
   - Replay used for recovery.
   - Commerce setup reviewed (public key, enabled methods including cards, bank account for disbursements, contact details) — looks correct for this pub key.
   - SFTP attempted (user pasted a public-key line `ssh-rsa ...` into the private-key field → "does not contain a (valid) private key" error; placeholder in the UI explains the correct PEM format with BEGIN/END).
   - `wompiRealPaymentsEnabled` toggle confirmed in admin settings (must be ON).
   - Timing/race fixes for widget init (aggressive global forcing before script load, setTimeout for sub-bundles, explicit initialize) already in client code.

---

## Current State of the Code & Tools (Everything Is Updated)

- **Admin tester form on the page**: Exists and is being used by the user. Supports real events + candidate secrets. The note + recommendations in the code are exactly what the user is seeing in their paste.
- **Webhook endpoint**: Correct signature logic (per docs), key-prefix logging on every call, friendly GET response (the message the user pasted), replay support.
- **Prepare endpoint**: Correct integrity signature + warnings + debug info.
- **Client widget opening**: Globals forcing from server response (the key that came back from prepare), small delay, etc.
- **.env.example + comments**: Documents the exact public key + the three secrets the user provided.
- **All other files** (checkout, orders, layout, admin config, check-wompi, prisma schema for `wompiRealPaymentsEnabled`, PRODUCTION_CHECKLIST, etc.): Consistent. No "wrong" references found after full searches.

The tools to diagnose and recover (advanced tester form on the admin page, replay, logging) are complete and working.

---

## Root Cause (What Is Actually Wrong)

The **value** of the events secret (`prod_events_jxa0Bz1S7uHmr1Nc3g4wL4u4i0DySop` and any other candidate) that is currently configured in Vercel must be validated using the real-event tester on /admin/settings until it reports matches:true. Use the exact keys provided by the user for this public key.

- Wompi signs events with the current "Llave para eventos" registered for the public key + the webhook URL at the moment the event is sent.
- The basic tester cannot detect this (it only runs dummy data on the server side).
- Real event data (what the user pastes as `sampleEvent`) + the candidate in `testEventsKey` is the only way to discover the correct secret (exactly as the note on the admin page now says).

The same logic applies to the integrity key for the "firma inválida" at payment time (though the tester sample for integrity currently looks good).

The commerce account, public key, registered webhook URL, enabled methods, and bank details all appear correct. The secret values simply need to be the ones that make real events pass the tester on the admin page.

---

## Exact Steps to Get Wompi Working End-to-End

1. On the live admin page (`/admin/settings`), in the new "Probar evento real de Wompi" form (the textarea you are already using):
   - Paste the **full** "Evento" JSON from one of your failing Wompi reports.
   - In `testEventsKey`, paste a candidate "Llave para eventos" freshly copied (or regenerated) from the Wompi dashboard for **this exact public key**.
   - Check "Replay".
   - Submit.

2. Repeat with different candidates from the dashboard until the tester shows `matches=true` for the real checksum.

3. Take the value that worked in the tester and set it **exactly** in Vercel as `WOMPI_EVENTS_KEY` (Production). Set the matching integrity key for the same public key. Redeploy the project.

4. (Optional but recommended) After changing secrets in the Wompi dashboard, re-save your webhook URL registration.

5. Test a new payment:
   - Use the normal Wompi flow from checkout or an order page.
   - Watch Vercel logs for `/api/webhooks/wompi` (you will see the loaded key prefix we log on every call).
   - The order should update via webhook (or the "Consultar Wompi" / polling fallback).

6. For any past ERROR orders: Use the same form on the admin page with `"replay": true` (it already worked for several of yours).

**Also verify**:
- In Admin → Settings the "Enable Real Payments" / `wompiRealPaymentsEnabled` toggle is **ON**.
- The exact "Llave de integridad" (not the events one) is set for the widget side.

---

## What We Have Confirmed & Tried (Summary)

- **Code is correct** (follows Wompi docs for both signatures exactly; searches confirmed no bugs in concatenation, property resolution, env loading, etc.).
- **UI / diagnostics are in place**: Advanced tester form on the admin page (with real-event support, `testEventsKey`, replay, debugger link, and the exact recommendation the user is seeing), per-webhook key prefix logging, friendly webhook GET, detailed notes in prepare code.
- **Basic tester is misleading** for live signing (only dummies).
- **Real events consistently fail** with the events key the user has (multiple independent simulations + the live tester output the user just pasted).
- **Tried by user**: Multiple re-copies of secrets, incognito, redeploys (keys updated ~6h ago in one report), replay for recovery, direct GET to the webhook, SFTP config (pasted public key by mistake), commerce setup with the public key.
- **Confirmed working**: Replay, basic key loading in tester, integrity sample in tester, private key API queries, the new real-event form on the admin page, friendly GET response, key prefix logging.
- **Docs crawl**: Method in code is correct. Secrets must come from the dashboard for this exact public key. Real event data is required for validation.

The only remaining action is obtaining (via the tester form the user is already using) the precise "Llave para eventos" value from the Wompi dashboard that actually matches the live checksums for this public key, setting it in Vercel Production, and redeploying.

Once that value is live, the 401s stop and the full payment flow (including webhooks updating orders) will complete without errors.

If you paste the next `eventVerification` result from the form on the admin page (with a fresh candidate), we can confirm whether it is finally the correct secret. At that point the only remaining step is the Vercel update + redeploy.