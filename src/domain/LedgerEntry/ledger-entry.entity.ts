import { v4 as uuidv4 } from "uuid";
import { LedgerDirection, LedgerType } from "../../app/types";

export interface LedgerEntryProps {
  id?: string;
  paymentId: string;
  userId: string;
  direction: LedgerDirection;
  amount: number;
  currency: string;
  type?: LedgerType;
  createdAt?: Date;
}

export class LedgerEntry {
  id: string;
  paymentId: string;
  userId: string;
  direction: LedgerDirection;
  amount: number;
  currency: string;
  type: LedgerType;
  createdAt: Date;

  constructor(props: LedgerEntryProps) {
    if (
      ![LedgerDirection.CREDIT, LedgerDirection.DEBIT].includes(props.direction)
    )
      throw new Error(`Invalid ledger direction: ${props.direction}`);

    if (props.amount <= 0) {
      throw new Error(`LedgerEntry amount must be positive, got: ${props.amount}`);
    }

    if (!/^[A-Z]{3}$/.test(props.currency)) {
      throw new Error(`Invalid currency: ${props.currency}`);
    }

    if (props.type && !Object.values(LedgerType).includes(props.type)) {
      throw new Error(`Invalid ledger type: ${props.type}`);
    }

    this.id = props.id ?? uuidv4();
    this.paymentId = props.paymentId;
    this.userId = props.userId;
    this.direction = props.direction;
    this.amount = props.amount;
    this.currency = props.currency;
    this.type = props.type ?? LedgerType.PAYMENT_CAPTURE;
    this.createdAt = props.createdAt ?? new Date();
  }
}
