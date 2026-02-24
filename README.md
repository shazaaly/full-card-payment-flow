# Full Card Payment Flow

End-to-end card payment processing system built with NestJS + PostgreSQL + Redis.

---

## Architecture

Uses **Hexagonal Architecture** (Ports & Adapters) with four layers:

```mermaid
flowchart TD
    A[interface/\nHTTP Controllers · DTOs · Interceptors]
    B[app/\nApplication Services · Orchestration]
    C[domain/\nEntities · State Machine · Business Rules]
    D[infrastructure/\nRepos · Prisma · Redis]

    A --> B --> C
    B --> D
```

Each layer only talks to the one below it through **port interfaces** (`src/app/port/`). The domain never imports Prisma or Redis — the repos implement the ports and get injected.

---

## Architecture Decisions & Trade-offs

| Decision | Why | Trade-off |
|---|---|---|
| **Hexagonal architecture** | Swap DB/cache without touching domain logic | More files, more boilerplate |
| **State machine** for payment status | Enforces valid transitions, handles out-of-order webhooks safely | Requires explicit transition map upfront |
| **Outbox pattern** for receipt emails | Async event survives crashes — created in same DB transaction as capture | Needs a separate worker to drain the outbox table |
| **Idempotency key** on payment creation | Client can safely retry without double-charging | Key must be stored and indexed |
| **Redis cache** for webhook dedup | Fast O(1) first-pass check before hitting the DB | Cache can expire (24h TTL), falls back to DB check |
| **Mock gateway** | No real payment provider needed to develop/test | Not production-ready |
| **GraphQL + REST together** | REST for payments/webhooks, GraphQL available for querying | Added complexity of two API layers |

---

## Payment Status Flow

State machine is in `payment-transition.policy.ts`. PENDING can go to AUTHORIZED, CAPTURED, or FAILED; AUTHORIZED to CAPTURED or FAILED; CAPTURED only to REFUNDED.

```mermaid
stateDiagram-v2
    [*] --> CREATED
    CREATED --> PENDING
    PENDING --> AUTHORIZED
    PENDING --> CAPTURED
    PENDING --> FAILED
    AUTHORIZED --> CAPTURED
    AUTHORIZED --> FAILED
    CAPTURED --> REFUNDED
```

---

## Payment Creation Flow

`ApplicationService.createPayment`: validate idempotency key → find user → check existing payment by idempotency key → mock gateway checkout → create payment entity (CREATED → apply CHECKOUT_CREATED → PENDING) → save. Response is only `checkoutUrl` and `gatewayPaymentId` (no `paymentId` in response).

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB as PostgreSQL
    participant GW as Mock Gateway

    Client->>API: POST /payments (idempotency-key header)
    API->>API: validate Idempotency-Key present
    API->>DB: findPaymentByIdempotencyKey
    alt key already used
        DB-->>API: existing payment
        API-->>Client: { checkoutUrl, gatewayPaymentId }
    else new payment
        API->>DB: findUserById(userId)
        API->>GW: checkout(checkoutData, idempotencyKey)
        GW-->>API: { checkoutUrl, gatewayPaymentId }
        API->>DB: createPayment (status PENDING)
        API-->>Client: { checkoutUrl, gatewayPaymentId }
    end
```

---

## Webhook Processing Flow

Payload must include `id` (gateway event id), `type` (e.g. PAYMENT_CAPTURED), and `paymentId` (internal payment UUID). Payment is looked up by `gatewayEventData.paymentId || gatewayEventData.id`. Redis key is `webhook_event:${payload.id}`, TTL 86400s. Transaction order in `TransactionRepo.runEventTransaction`: insert WebhookEvent, update Payment, upsert LedgerEntry (`paymentId_type_unique_constraint`), insert Outbox. Redis set runs after commit.

```mermaid
sequenceDiagram
    participant Sender
    participant API
    participant Redis
    participant DB as PostgreSQL

    Sender->>API: POST /webhooks/mock (x-signature, body: id, type, paymentId)
    API->>API: validate signature (HMAC-SHA256 of JSON body, hex)
    API->>Redis: eventExists(payload.id) → key webhook_event:${id}
    alt cached
        Redis-->>API: true
        API-->>Sender: 200 (no-op)
    else not cached
        API->>DB: findWebhookEventByGatewayEventId(payload.id)
        alt found
            DB-->>API: event
            API->>Redis: setEvent(payload.id)
            API-->>Sender: 200 (no-op)
        else new event
            API->>DB: findPaymentById(paymentId || id)
            API->>API: applyPaymentStatusUpdate(type) on Payment entity
            API->>DB: runEventTransaction (single Prisma $transaction)
            Note over DB: 1. webhookEvent.create<br>2. payment.update<br>3. ledgerEntry.upsert<br>4. outbox.create
            DB-->>API: success
            API->>Redis: setEvent(id, eventData, 86400)
            API-->>Sender: 200
        end
    end
```

---

## Data Consistency Guarantees

### 1. Webhook processing is atomic
In `TransactionRepo.runEventTransaction` a single `Prisma.$transaction` does, in order:
1. `webhookEvent.create` (id, gateway, gatewayEventId, eventType, processingState `"RECEIVED"`, payload, receivedAt)
2. `payment.update` (status, gatewayPaymentId, checkoutUrl)
3. `ledgerEntry.upsert` (where `paymentId_type_unique_constraint`)
4. `outbox.create` (id, type, payload, createdAt)

Redis `setEvent` is called after the transaction commits. If any step fails, the transaction rolls back.

### 2. Duplicate webhooks rejected at two levels
1. **Redis** — `CachingService.eventExists(payload.id)` checks key `webhook_event:${id}` first (TTL 86400s).
2. **DB** — `findWebhookEventByGatewayEventId(payload.id)`; then in the transaction, `WebhookEvent` has `@@unique([gateway, gatewayEventId])` so a second insert with same gateway + gatewayEventId would fail.

### 3. Out-of-order webhooks handled by the state machine
`Payment.applyPaymentStatusUpdate()` calls `decidePaymentTransition()` in `payment-transition.policy.ts`. The entity only updates its `status` when outcome is `APPLIED`. Outcomes:
- `APPLIED` — valid transition; entity status updated, then transaction runs (WebhookEvent + Payment + Ledger + Outbox).
- `IGNORED` — duplicate or out-of-order (e.g. already CAPTURED); entity status unchanged; transaction still runs (so event is stored, payment row unchanged by update, ledger upsert no-op for same key, outbox row created).
- `REJECTED` — invalid transition; entity status unchanged; transaction still runs.
Duplicate events are avoided by Redis + `findWebhookEventByGatewayEventId` before we build the transaction.

### 4. Idempotent payment creation
If the same `Idempotency-Key` header is sent twice, the API returns the same `{ checkoutUrl, gatewayPaymentId }` from the existing payment (no new charge, no error). The API does not return `paymentId` in the create response.

### 5. Ledger entry is upserted, not inserted
`LedgerEntry` has a unique constraint on `(paymentId, type)`. Ensures you can't create two credit entries for the same capture even if the handler is called twice.

---

## How to Run

### Prerequisites
- Docker + Docker Compose
- Node.js 20+

### 1. Create `.env`
```env
DATABASE_URL=postgresql://user:pass@localhost:5422/payments
POSTGRES_USER=user
POSTGRES_PASSWORD=pass
POSTGRES_DB=payments
SERVER_PORT=7000
REDIS_URL=redis://localhost:6379
WEBHOOK_SECRET=your-secret
```

### 2. Start infrastructure
```bash
npm run docker:up       # starts PostgreSQL on port 5422
npm run docker:redis    # starts Redis on port 6379
```

### 3. Run migrations & start
```bash
npm run prisma:migrate
npm run start:dev
```

App runs at `http://localhost:7000`.

To run the full stack in Docker (`docker compose up`), ensure the api service has `REDIS_URL=redis://redis:6379` (and `DATABASE_URL` pointing at the postgres service). The compose file currently sets only `DATABASE_URL` and `SERVER_PORT` for the api; add `REDIS_URL` to the api `environment` if you run the API in Docker.

---

## Demo Steps

You need a valid `userId` (existing in the `User` table). The mock gateway does not send webhooks; you call `POST /webhooks/mock` yourself.

### Step 1 — Create a payment
```bash
curl -X POST http://localhost:7000/payments \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-key-001" \
  -d '{ "amount": 5000, "currency": "USD", "userId": "<valid-user-uuid>" }'
```
**Returns:** `{ "checkoutUrl": "https://mock-gateway.local/checkout?gatewayPaymentId=...", "gatewayPaymentId": "..." }` — no `paymentId` in the response.

### Step 2 — Get the internal payment id
The webhook handler looks up payment by `paymentId` (internal UUID). Since create does not return it, get it from the DB:
```bash
# Example: using psql or any Postgres client
# SELECT id FROM payment WHERE idempotency_key = 'unique-key-001';
```

### Step 3 — Simulate a webhook (payment captured)
Signature = HMAC-SHA256 of the **exact JSON body** (as string), with `WEBHOOK_SECRET`, output hex. Header name is `x-signature`.

Body must include: `id` (unique event id for dedup), `type` (e.g. `PAYMENT_CAPTURED`), `paymentId` (internal payment UUID from step 2).

```bash
# Replace <PAYMENT_UUID> and <SIGNATURE> (compute with same body + WEBHOOK_SECRET).
curl -X POST http://localhost:7000/webhooks/mock \
  -H "Content-Type: application/json" \
  -H "x-signature: <SIGNATURE>" \
  -d '{
    "id": "evt_001",
    "type": "PAYMENT_CAPTURED",
    "paymentId": "<PAYMENT_UUID>"
  }'
```

### Step 4 — Check payment status
```bash
curl http://localhost:7000/payments/<PAYMENT_UUID>
```
Returns the payment (with `status: "CAPTURED"`) and `ledger_type` when a ledger entry exists.

### Step 5 — Test idempotency
Repeat Step 1 with the same `Idempotency-Key`. Response is the same `{ checkoutUrl, gatewayPaymentId }`; no second payment is created.

### Step 6 — Test duplicate webhook
Repeat Step 3 with the same `id`. Redis `eventExists(payload.id)` returns true; handler returns 200 without processing.

---

## Stack

- **Framework:** NestJS 11
- **Database:** PostgreSQL via Prisma ORM
- **Cache:** Redis (ioredis)
- **API:** REST + GraphQL (Apollo)
- **Containers:** Docker + Docker Compose
- **Runtime:** Node.js 20
