import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { CheckoutDto } from "../dto/checkout.dto";
import { ApplicationService } from "../../app/services/application.service";
import { CheckoutResponse } from "../../app/types";
import { Payment } from "../../domain/payment_management/payment.entity";

@Controller("/payments")
export class PaymentController {
  constructor(private readonly applicationService: ApplicationService) { }

  @Post()
  async createPayment(
    @Body() checkoutData: CheckoutDto,
    @Headers("idempotency-key") idempotencyKey: string,
  ): Promise<CheckoutResponse> {
    return await this.applicationService.createPayment(checkoutData, idempotencyKey);
  }

  @Get(":id")
  async getPaymentById(@Param("id") id: string): Promise<Payment> {
    return this.applicationService.getPaymentById(id);
  }
}