import { Payment } from "../domain/payment_management/payment.entity";

export enum LedgerType {
  PAYMENT_CAPTURE = "PAYMENT_CAPTURE",
}

export enum LedgerDirection {
  CREDIT = "CREDIT",
  DEBIT = "DEBIT",
}

export enum PaymentStatus {
  CREATED = "CREATED",
  PENDING = "PENDING",
  AUTHORIZED = "AUTHORIZED",
  CAPTURED = "CAPTURED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum PaymentEventType {
  CHECKOUT_CREATED = "CHECKOUT_CREATED",
  PAYMENT_PENDING = "PAYMENT_PENDING",
  PAYMENT_AUTHORIZED = "PAYMENT_AUTHORIZED",
  PAYMENT_CAPTURED = "PAYMENT_CAPTURED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  PAYMENT_REFUNDED = "PAYMENT_REFUNDED",
}

export type TransitionOutcome = "APPLIED" | "IGNORED" | "REJECTED";

export interface TransitionDecision {
  outcome: TransitionOutcome;
  targetStatus: PaymentStatus;
  shouldCreateLedgerEntry: boolean;
  shouldCreateReceiptOutboxEvent: boolean;
  reason?: string;
}

export enum WebhookProcessingState {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  IGNORED = "IGNORED",
  RETRIED = "RETRIED",
}

export enum WebhookEventType {
  CHECKOUT_CREATED = "CHECKOUT_CREATED",
  PAYMENT_PENDING = "PAYMENT_PENDING",
  PAYMENT_AUTHORIZED = "PAYMENT_AUTHORIZED",
  PAYMENT_CAPTURED = "PAYMENT_CAPTURED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  PAYMENT_REFUNDED = "PAYMENT_REFUNDED",
}

export enum OutboxStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  FAILED = "FAILED",
}

export enum OutboxType {
  RECEIPT_EMAIL = "RECEIPT_EMAIL",
}

export interface CheckoutResponse {
  checkoutUrl?: string;
  gatewayPaymentId?: string;
}

export interface GenericResponse {
  status: string;
  ok: boolean;
}

export type PaymentWithoutMethods = Omit<Payment, "applyPaymentStatusUpdate">;

export type PaymentWithLedgerType = PaymentWithoutMethods & {
  ledger_type: LedgerType | null;
};