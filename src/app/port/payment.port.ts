import { Payment as PrismaPayment } from "@prisma/client";
import { Payment as DomainPayment } from "../../domain/payment_management/payment.entity";
import { GenericResponse } from "../types";

export interface PaymentPort {
  findPaymentByIdempotencyKey(idempotencyKey: string): Promise<PrismaPayment | null>;
  createPayment(payment: DomainPayment): Promise<GenericResponse>;
  findPaymentById(id: string): Promise<DomainPayment>;
}