import { LedgerEntry } from "../domain/LedgerEntry/ledger-entry.entity";
import { Outbox } from "../domain/outbox/outbox.entity";
import { Payment } from "../domain/payment_management/payment.entity";
import { WebhookEvent } from "../domain/webhookEvent/webhookEvent.entity";
import { GenericResponse } from "../app/types";
import { TransactionPort } from "../app/port/transaction.port";
import { PrismaService } from "./postgres/prisma/prisma.service";

import { Injectable } from "@nestjs/common";

@Injectable()
export class TransactionRepo implements TransactionPort {
    constructor(
        private readonly prismaService: PrismaService,
    ) { }

    async runEventTransaction(
        webhookEvent: WebhookEvent,
        payment: Payment,
        ledgerEntry: LedgerEntry,
        outbox: Outbox,
    ): Promise<GenericResponse> {
        try {
            await this.prismaService.$transaction(async (tx) => {
                await tx.webhookEvent.create({
                    data: {
                        id: webhookEvent.id,
                        gateway: webhookEvent.gateway,
                        gatewayEventId: webhookEvent.gatewayEventId,
                        eventType: webhookEvent.type,
                        processingState: "RECEIVED",
                        payload: webhookEvent.payload,
                        receivedAt: webhookEvent.receivedAt,
                    },
                });

                await tx.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: payment.status,
                        gatewayPaymentId: payment.gatewayPaymentId,
                        checkoutUrl: payment.checkoutUrl,
                    },
                });

                await tx.ledgerEntry.create({
                    data: {
                        id: ledgerEntry.id,
                        paymentId: ledgerEntry.paymentId,
                        userId: ledgerEntry.userId,
                        direction: ledgerEntry.direction,
                        amount: ledgerEntry.amount,
                        currency: ledgerEntry.currency,
                        type: ledgerEntry.type,
                        createdAt: ledgerEntry.createdAt,
                    },
                });

                await tx.outbox.create({
                    data: {
                        id: outbox.id,
                        type: outbox.type,
                        payload: outbox.payload,
                        createdAt: outbox.createdAt,
                    },
                });
            });


            return { status: "success", ok: true };
        } catch (error) {
            throw new Error("runEventTransaction Error: " + error.message);
        }
    }
}