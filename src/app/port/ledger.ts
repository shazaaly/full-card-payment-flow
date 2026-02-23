import { LedgerEntry } from "../../domain/LedgerEntry/ledger-entry.entity";

export interface LedgerPort {
  findLedgerByPaymentId(id: string): Promise<LedgerEntry>;
}