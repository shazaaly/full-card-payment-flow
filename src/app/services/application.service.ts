import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { CheckoutResponse, PaymentEventType, PaymentStatus } from "../types";
import { MockGatewayService } from "./mock-gateway.service";
import { CheckoutDto } from "../../interface/dto/checkout.dto";
import { PaymentPort } from "../port/payment.port";
import { Payment } from "../../domain/payment_management/payment.entity";
import { v4 as uuidv4 } from "uuid";
import { CheckoutEntity } from "../../domain/checkout/checkout.entity";
import { UserPort } from "../port/user.port";
import { UserEntity } from "../../domain/user.entity.ts/user.entity";

@Injectable()
export class ApplicationService {
  constructor(
    private readonly mockGatewayService: MockGatewayService,
    @Inject("PaymentPort") private readonly paymentPort: PaymentPort,
    @Inject("UserPort") private readonly userPort: UserPort,
  ) { }

  validateIdempotencyKey(idempotencyKey: string): void {
    if (!idempotencyKey) {
      throw new BadRequestException("Idempotency-Key header is required");
    }
  }

  async createPayment(
    checkoutData: CheckoutDto,
    idempotencyKey: string,
  ): Promise<CheckoutResponse> {
    try {

      const { userId, amount, currency } = checkoutData;

      const existing_user = await this.userPort.findUserById(userId);
      const user_instance = new UserEntity({
        id: existing_user.id,
        email: existing_user.email,
        name: existing_user.name,
      });


      const checkout_entity = new CheckoutEntity({
        userId: user_instance.id,
        amount,
        currency,
      });
      this.validateIdempotencyKey(idempotencyKey);
      const existing_payment =
        await this.paymentPort.findPaymentByIdempotencyKey(idempotencyKey);

      if (existing_payment)
        return {
          gatewayPaymentId: existing_payment.gatewayPaymentId || "",
          checkoutUrl: existing_payment.checkoutUrl || "",
        };


      const checkout_response: CheckoutResponse = await this.mockGatewayService.checkout(
        checkoutData,
        idempotencyKey,
      );

      const { checkoutUrl, gatewayPaymentId } = checkout_response;

      const new_payment_instance = new Payment({
        id: uuidv4(),
        userId: checkout_entity.userId,
        amount: checkout_entity.amount,
        currency: checkout_entity.currency,
        gateway: "MOCK",
        status: PaymentStatus.CREATED,
        idempotencyKey,
        gatewayPaymentId,
        checkoutUrl,
      });

      new_payment_instance.applyPaymentStatusUpdate(PaymentEventType.CHECKOUT_CREATED);

      await this.paymentPort.createPayment(new_payment_instance)

      return {
        checkoutUrl,
        gatewayPaymentId,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
