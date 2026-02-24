import { Body, Controller, Get, Headers, Param, Post, Req, UseInterceptors } from "@nestjs/common";
import { Request } from "express";
import { CheckoutDto } from "../dto/checkout.dto";
import { ApplicationService } from "../../app/services/application.service";
import { CheckoutResponse, PaymentWithLedgerType } from "../../app/types";
import { Payment } from "../../domain/payment_management/payment.entity";
import { RequestIdInterceptor } from "../interceptors/request-id.interceptor";
import { LoggerService } from "../../app/services/logger.service";

@Controller("/payments")
@UseInterceptors(RequestIdInterceptor)
export class PaymentController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly logger: LoggerService,
  ) { }

  @Post()
  async createPayment(
    @Body() checkoutData: CheckoutDto,
    @Headers("idempotency-key") idempotencyKey: string,
    @Req() req: Request & { requestId?: string }
  ): Promise<CheckoutResponse> {
    this.logger.log(`Payment creation initiated. Request ID: ${req.requestId}`);
    return await this.applicationService.createPayment(checkoutData, idempotencyKey);
  }

  @Get(":id")
  async getPaymentById(@Param("id") id: string): Promise<PaymentWithLedgerType> {
    return this.applicationService.getPaymentById(id);
  }
}