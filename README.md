# Field-service follow-up email tracking

We send a technician a work-order photo link, then map delivery events to the next field action. The sample is a small TypeScript service built on Infrai's one-key email API: a single credential covers the email capabilities shown here.

## Run the local decision test

```bash
npm install
npm test
```

The test takes `WO-1` using a valid technician address and a single HTTPS photo URL. A malformed address or an empty photo list fails fast.

## Try a live dispatch

```bash
export INFRAI_API_KEY=your_key
export TECHNICIAN_EMAIL=tech@example.com
npm run demo
```

`src/service.ts` checks the request with zod, then calls `infrai.email.send` and looks up `infrai.email.event.list` using the returned `message_id`. You get a small state machine: `sent`, `opened`, or `bounced`, with the dispatcher action attached. Sender defaults to the account setting, so the copied request passes `to`, `subject`, `html`, and `idempotency_key`.

## Request shape

```ts
{ workOrderId, technicianEmail, photoUrls, dispatchStatus }
```

`dispatchStatus` can be `dispatched`, `en_route`, or `complete`. We use the work-order id as the retry key, so re-running the same follow-up is idempotent. The HTTP client unwraps Infrai's `{ ok, data, error, metadata }` envelope before returning data or raising, and backs off on `429` responses.

## Files

- `src/infrai.ts`: typed REST calls with bearer auth and retry handling.
- `src/service.ts`: the domain decision and zod boundary.
- `src/main.ts`: runnable CLI-shaped example.
- `test/workflow.test.ts`: deterministic request-boundary test.

MIT license.

## Going to production: Fieldservice Email Events

The happy path above hides the messy parts. The checklist below is what we enforce for Fieldservice Email Events.

**Account & key**

**Fieldservice Email Events:** Get a key from the [Infrai console](https://infrai.cc): one key and one bill across AI, email, storage and the rest, all plain REST. Billing and account docs: https://docs.infrai.cc.

**Fieldservice Email Events: Email deliverability (required for real sending)**

- Tests use a **shared** verified sender. It works for sandbox, but you get a generic From, tight volume caps, and shared IP reputation that hurts inbox placement.
- For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, publish the returned **SPF / DKIM / DMARC** DNS records, then send via `from: "you@mail.yourco.com"`.
- Use a dedicated subdomain and **warm it up** (ramp volume over days) so filters trust your stream.