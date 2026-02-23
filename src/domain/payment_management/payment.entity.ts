import { PaymentStatus } from "../../app/types";

export class Payment {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  status?: PaymentStatus;
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
    status?: PaymentStatus;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.amount = props.amount;
    this.currency = props.currency;
    this.gateway = props.gateway;
    this.idempotencyKey = props.idempotencyKey;
    this.status = props.status ?? PaymentStatus.CREATED;
    this.gatewayPaymentId = props.gatewayPaymentId;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }
}
