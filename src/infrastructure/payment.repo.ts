import { Injectable } from "@nestjs/common";
import { Payment as PrismaPayment } from "@prisma/client";
import { PrismaService } from "./postgres/prisma/prisma.service";
import { PaymentPort } from "../app/port/payment.port";
import { Payment as DomainPayment } from "../domain/payment_management/payment.entity";
import { Decimal } from "@prisma/client/runtime/library";

@Injectable()
export class PaymentRepo implements PaymentPort {
  constructor(private readonly prisma: PrismaService) {}

  async findPaymentByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<PrismaPayment | null> {
    return this.prisma.payment.findUnique({
      where: { idempotencyKey },
    });
  }

  async createPayment(payment: DomainPayment): Promise<{ status: string; ok: boolean }> {
    await this.prisma.payment.create({
      data: {
        id: payment.id,
        userId: payment.userId,
        amount: new Decimal(payment.amount),
        currency: payment.currency,
        status: payment.status,
        gateway: payment.gateway,
        gatewayPaymentId: payment.gatewayPaymentId ?? null,
        idempotencyKey: payment.idempotencyKey,
        checkoutUrl: payment.checkoutUrl ?? null,
      },
    });
    return { status: "created", ok: true };
  }
}