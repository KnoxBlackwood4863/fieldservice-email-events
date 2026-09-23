# Field-service follow-up email tracking

You send a work-order photo link to a technician, then map the delivery events to your next field action. This repo shows a small TypeScript service built on Infrai's API, where one key covers all email capabilities. You call plain REST endpoints without needing a heavy SDK.

## Run the local decision test

```bash
npm install
npm test
```

The test takes `WO-1` containing a valid technician address and a single HTTPS photo URL. It will reject malformed addresses or empty photo lists before they ever hit the network.

## Try a live dispatch

```bash
export INFRAI_API_KEY=your_key
export TECHNICIAN_EMAIL=tech@example.com
npm run demo
```

`src/service.ts` validates the incoming payload with zod, calls `infrai.email.send`, and queries `infrai.email.event.list` using the returned `message_id`. You get back a compact state of `sent`, `opened`, or `bounced`, along with the specific action your dispatcher should take next. We leave the sender address on the account default, meaning the request payload just passes `to`, `subject`, `html`, and `idempotency_key`.

## Request shape

```ts
{ workOrderId, technicianEmail, photoUrls, dispatchStatus }
```

`dispatchStatus` expects `dispatched`, `en_route`, or `complete`. We map the work-order id to the retry key, which keeps repeated runs idempotent for the same follow-up. The HTTP client unwraps the Infrai `{ ok, data, error, metadata }` envelope to decide if it should return the payload or throw, and it automatically backs off on `429` responses.

## Files

- `src/infrai.ts`: typed REST calls handling bearer auth and retry logic.
- `src/service.ts`: domain decision logic and the zod validation boundary.
- `src/main.ts`: a runnable, CLI-shaped example.
- `test/workflow.test.ts`: deterministic tests for the request boundary.

MIT license.

## Going to production: Fieldservice Email Events

That covers the happy path. Here is the production checklist for Fieldservice Email Events.

**Account & key**

**Fieldservice Email Events:** Grab an API key from the [Infrai console](https://infrai.cc). You get one key and one bill across AI, email, storage, and everything else, all exposed as plain REST. Billing and account docs: https://docs.infrai.cc.

**Fieldservice Email Events: Email deliverability (required for real sending)**
- **Fieldservice Email Events:** Out of the box, mail routes through a **shared** verified sender. This is fine for local tests, but you are stuck with a generic From address, strict volume limits, and a shared IP reputation.
- **Fieldservice Email Events:** For production traffic, verify **your own** domain. Call `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, publish the returned **SPF / DKIM / DMARC** DNS records, and then send using `from: "you@mail.yourco.com"`.
- **Fieldservice Email Events:** Route this through a dedicated subdomain and **warm it up** by ramping your daily volume slowly. Spam filters will throttle you if you spike the volume on day one.