import { Injectable } from "@nestjs/common";
import { PrismaService } from "./postgres/prisma/prisma.service";
import { LedgerPort } from "../app/port/ledger";
import { LedgerEntry } from "../domain/LedgerEntry/ledger-entry.entity";
import { LedgerDirection, LedgerType } from "../app/types";

@Injectable()
export class LedgerRepo implements LedgerPort {
  constructor(private readonly prisma: PrismaService) { }

  async findLedgerByPaymentId(id: string): Promise<LedgerEntry> {
    try {
      const ledger = await this.prisma.ledgerEntry.findFirst({
        where: { paymentId: id },
      });

      if (!ledger) {
        throw new Error(`Ledger entry for payment ${id} not found`);
      }

      return new LedgerEntry({
        id: ledger.id,
        paymentId: ledger.paymentId,
        userId: ledger.userId,
        direction: ledger.direction as LedgerDirection,
        amount: Number(ledger.amount),
        currency: ledger.currency,
        type: ledger.type as LedgerType,
        createdAt: ledger.createdAt,
      });

    } catch (error) {
      throw new Error("findLedgerByPaymentId Error: " + error.message);
    }
  }
}