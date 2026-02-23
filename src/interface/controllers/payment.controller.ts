import { Body, Controller, Headers, Post } from "@nestjs/common";
import { CheckoutDto } from "../dto/checkout.dto";
import { CheckoutResponse } from "../../app/types";
import { ApplicationService } from "../../app/services/application.service";

@Controller("/payments​")
export class PaymentController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post("checkout")
  async checkout(
    @Body() checkoutData: CheckoutDto,
    @Headers("idempotency-key") idempotencyKey: string,
  ) :Promise<CheckoutResponse>{
    return await this.applicationService.checkout(checkoutData, idempotencyKey);
  }
}