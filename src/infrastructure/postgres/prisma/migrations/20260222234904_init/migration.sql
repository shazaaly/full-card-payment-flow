-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "gateway" TEXT NOT NULL DEFAULT 'MOCK',
    "gatewayPaymentId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'CREDIT',
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PAYMENT_CAPTURE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_event" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gateway" TEXT NOT NULL DEFAULT 'MOCK',
    "gatewayEventId" TEXT,
    "eventType" TEXT NOT NULL,
    "processingState" TEXT NOT NULL DEFAULT 'PENDING',
    "payload" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" TEXT NOT NULL DEFAULT 'RECEIPT_EMAIL',
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "nextAttemptAt" TIMESTAMP(6),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "payment_gatewayPaymentId_key" ON "payment"("gatewayPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_idempotencyKey_key" ON "payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payment_userId_idx" ON "payment"("userId");

-- CreateIndex
CREATE INDEX "payment_status_idx" ON "payment"("status");

-- CreateIndex
CREATE INDEX "ledger_entries_userId_idx" ON "ledger_entries"("userId");

-- CreateIndex
CREATE INDEX "ledger_entries_createdAt_idx" ON "ledger_entries"("createdAt");

-- CreateIndex
CREATE INDEX "ledger_entries_paymentId_idx" ON "ledger_entries"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entries_paymentId_type_key" ON "ledger_entries"("paymentId", "type");

-- CreateIndex
CREATE INDEX "webhook_event_gateway_eventType_idx" ON "webhook_event"("gateway", "eventType");

-- CreateIndex
CREATE INDEX "webhook_event_processingState_idx" ON "webhook_event"("processingState");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_event_gateway_gatewayEventId_key" ON "webhook_event"("gateway", "gatewayEventId");

-- CreateIndex
CREATE INDEX "outbox_status_idx" ON "outbox"("status");

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
