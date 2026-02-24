# Full Card Payment Flow

End-to-end card payment processing system built with NestJS + PostgreSQL + Redis.

---

## Architecture

Uses **Hexagonal Architecture** (Ports & Adapters) with four layers:

```
interface/       → HTTP controllers, DTOs, interceptors (entry points)
app/             → Services that orchestrate business logic
domain/          → Pure entities and rules (no framework deps)
infrastructure/  → Repos, Prisma, Redis (external world)
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

```
CREATED → PENDING → AUTHORIZED → CAPTURED → REFUNDED
                         ↓
                       FAILED
```

---

## Data Consistency Guarantees

### 1. Webhook processing is atomic
When a webhook arrives, these five things happen in **one Prisma transaction**:
- Store the webhook event
- Update payment status
- Upsert ledger entry
- Create outbox event (receipt email)
- Cache the event ID in Redis (after commit)

If anything fails mid-way, the whole transaction rolls back. Nothing is half-applied.

### 2. Duplicate webhooks rejected at two levels
1. **Redis cache** — checked first (fast, in-memory), TTL 24h
2. **DB unique constraint** — `WebhookEvent` has a unique constraint on `(gateway, gatewayEventId)` — the insert fails if the event already exists

### 3. Out-of-order webhooks handled by the state machine
`payment-transition.policy.ts` returns one of three outcomes:
- `APPLIED` — valid transition, proceed
- `IGNORED` — same status received again, safe no-op
- `REJECTED` — invalid transition (e.g. CAPTURED → PENDING), do nothing

### 4. Idempotent payment creation
If the same `Idempotency-Key` header is sent twice, the existing payment is returned immediately — no second charge, no error.

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

---

## Demo Steps

### Step 1 — Create a payment
```bash
curl -X POST http://localhost:7000/payments \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-key-001" \
  -d '{ "amount": 5000, "currency": "USD", "userId": "<a-valid-user-id>" }'
```
Returns: `{ paymentId, checkoutUrl, gatewayPaymentId, status: "PENDING" }`

### Step 2 — Simulate a webhook (payment captured)
```bash
curl -X POST http://localhost:7000/webhooks/mock \
  -H "Content-Type: application/json" \
  -H "x-signature: <hmac-sha256-of-body-using-WEBHOOK_SECRET>" \
  -d '{
    "eventId": "evt_001",
    "gateway": "MOCK",
    "eventType": "PAYMENT_CAPTURED",
    "gatewayPaymentId": "<gatewayPaymentId from step 1>"
  }'
```

### Step 3 — Check payment status
```bash
curl http://localhost:7000/payments/<paymentId>
```
Returns the updated payment with `status: "CAPTURED"` and a ledger entry created.

### Step 4 — Test idempotency
Repeat Step 1 with the same `Idempotency-Key`. You get back the same payment — no duplicate created.

### Step 5 — Test duplicate webhook
Repeat Step 2 with the same `eventId`. Redis catches it first and returns a no-op — payment not processed twice.

---

## Stack

- **Framework:** NestJS 11
- **Database:** PostgreSQL via Prisma ORM
- **Cache:** Redis (ioredis)
- **API:** REST + GraphQL (Apollo)
- **Containers:** Docker + Docker Compose
- **Runtime:** Node.js 20
# Full Card Payment Flow

End-to-end card payment processing system built with NestJS + PostgreSQL + Redis.

---

## Architecture

Uses **Hexagonal Architecture** (Ports & Adapters) with four layers:

```
interface/       → HTTP controllers, DTOs, interceptors (entry points)
app/             → Services that orchestrate business logic
domain/          → Pure entities and rules (no framework deps)
infrastructure/  → Repos, Prisma, Redis (external world)
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

```
CREATED → PENDING → AUTHORIZED → CAPTURED → REFUNDED
                         ↓
                       FAILED
```

---

## Data Consistency Guarantees

### 1. Webhook processing is atomic
When a webhook arrives, these five things happen in **one Prisma transaction**:
- Store the webhook event
- Update payment status
- Upsert ledger entry
- Create outbox event (receipt email)
- Cache the event ID in Redis (after commit)

If anything fails mid-way, the whole transaction rolls back. Nothing is half-applied.

### 2. Duplicate webhooks rejected at two levels
1. **Redis cache** — checked first (fast, in-memory), TTL 24h
2. **DB unique constraint** — `WebhookEvent` has a unique constraint on `(gateway, gatewayEventId)` — the insert fails if the event already exists

### 3. Out-of-order webhooks handled by the state machine
`payment-transition.policy.ts` returns one of three outcomes:
- `APPLIED` — valid transition, proceed
- `IGNORED` — same status received again, safe no-op
- `REJECTED` — invalid transition (e.g. CAPTURED → PENDING), do nothing

### 4. Idempotent payment creation
If the same `Idempotency-Key` header is sent twice, the existing payment is returned immediately — no second charge, no error.

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

---

## Demo Steps

### Step 1 — Create a payment
```bash
curl -X POST http://localhost:7000/payments \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-key-001" \
  -d '{ "amount": 5000, "currency": "USD", "userId": "<a-valid-user-id>" }'
```
Returns: `{ paymentId, checkoutUrl, gatewayPaymentId, status: "PENDING" }`

### Step 2 — Simulate a webhook (payment captured)
```bash
curl -X POST http://localhost:7000/webhooks/mock \
  -H "Content-Type: application/json" \
  -H "x-signature: <hmac-sha256-of-body-using-WEBHOOK_SECRET>" \
  -d '{
    "eventId": "evt_001",
    "gateway": "MOCK",
    "eventType": "PAYMENT_CAPTURED",
    "gatewayPaymentId": "<gatewayPaymentId from step 1>"
  }'
```

### Step 3 — Check payment status
```bash
curl http://localhost:7000/payments/<paymentId>
```
Returns the updated payment with `status: "CAPTURED"` and a ledger entry created.

### Step 4 — Test idempotency
Repeat Step 1 with the same `Idempotency-Key`. You get back the same payment — no duplicate created.

### Step 5 — Test duplicate webhook
Repeat Step 2 with the same `eventId`. Redis catches it first and returns a no-op — payment not processed twice.

---

## Stack

- **Framework:** NestJS 11
- **Database:** PostgreSQL via Prisma ORM
- **Cache:** Redis (ioredis)
- **API:** REST + GraphQL (Apollo)
- **Containers:** Docker + Docker Compose
- **Runtime:** Node.js 20
