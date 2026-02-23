import { LedgerEntry } from "../../domain/LedgerEntry/ledger-entry.entity";
import { Outbox } from "../../domain/outbox/outbox.entity";
import { Payment } from "../../domain/payment_management/payment.entity";
import { WebhookEvent } from "../../domain/webhookEvent/webhookEvent.entity";
import { GenericResponse } from "../types";


export interface TransactionPort {
    runEventTransaction(webhookEvent: WebhookEvent, payment: Payment, ledgerEntry: LedgerEntry, outbox: Outbox): Promise<GenericResponse>;
}