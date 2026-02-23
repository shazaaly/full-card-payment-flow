import { Body, Controller, Headers, Post } from "@nestjs/common";
import { CheckoutDto } from "../dto/checkout.dto";
import { ApplicationService } from "../../app/services/application.service";
import { CheckoutResponse, GenericResponse } from "../../app/types";

@Controller("/payments​")
export class PaymentController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  async createPayment(
    @Body() checkoutData: CheckoutDto,
    @Headers("idempotency-key") idempotencyKey: string,
  ) :Promise<CheckoutResponse>{
    return await this.applicationService.createPayment(checkoutData, idempotencyKey);
  }
}