import {
  PaymentEventType,
  PaymentStatus,
  TransitionDecision,
} from "../../app/types";
import { decidePaymentTransition } from "./payment-transition.policy";
import { OUTCOME } from "./types";
import { v4 as uuidv4 } from "uuid";

export class Payment {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  gateway: string;
  gatewayPaymentId?: string;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: {
    id: string;
    userId: string;
    amount: string;
    currency: string;
    gateway: string;
    idempotencyKey: string;
    gatewayPaymentId?: string;
    createdAt?: Date;
    updatedAt?: Date;
    status?: PaymentStatus;  }) {

      if (Number(props.amount) <= 0) {
        throw new Error("Amount must be positive");
      }
      if (!/^[A-Z]{3}$/.test(props.currency)) {
        throw new Error("Currency must be ISO 4217 code");
      }
    this.id = props.id;
    this.userId = props.userId;
    this.amount = props.amount;
    this.currency = props.currency;
    this.gateway = props.gateway;
    this.idempotencyKey = props.idempotencyKey ?? uuidv4();
    this.status = props.status ?? PaymentStatus.CREATED;
    this.gatewayPaymentId = props.gatewayPaymentId;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  applyPaymentStatusUpdate(
    incomingEvent: PaymentEventType,
  ): TransitionDecision {
    const decision = decidePaymentTransition(this.status, incomingEvent);

    if (decision.outcome === OUTCOME.APPLIED) {
      this.status = decision.targetStatus;
      this.updatedAt = new Date();
    }

    return decision;
  }
}
