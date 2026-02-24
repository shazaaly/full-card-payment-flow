import { LedgerEntry } from "../../domain/LedgerEntry/ledger-entry.entity";
import { GenericResponse } from "../types";

export interface LedgerPort {
  findLedgerByPaymentId(id: string): Promise<LedgerEntry>;
  createLedgerEntry(ledgerEntry: LedgerEntry): Promise<GenericResponse>;
}