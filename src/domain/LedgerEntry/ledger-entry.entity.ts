import { v4 as uuidv4 } from "uuid";

export type LedgerDirection = "CREDIT" | "DEBIT";
export type LedgerType = "PAYMENT_CAPTURE"; // لاحقًا ممكن تضيف REFUND, FEE, إلخ

export interface LedgerEntryProps {
  id?: string;
  paymentId: string;
  userId: string;
  direction: LedgerDirection;
  amount: string;
  currency: string;
  type?: LedgerType;
  createdAt?: Date;
}

export class LedgerEntry {
  id: string;
  paymentId: string;
  userId: string;
  direction: LedgerDirection;
  amount: string;
  currency: string;
  type: LedgerType;
  createdAt: Date;

  constructor(props: LedgerEntryProps) {
    this.id = props.id ?? uuidv4();
    this.paymentId = props.paymentId;
    this.userId = props.userId;
    this.direction = props.direction;
    this.amount = props.amount;
    this.currency = props.currency;
    this.type = props.type ?? "PAYMENT_CAPTURE";
    this.createdAt = props.createdAt ?? new Date();
  }
}