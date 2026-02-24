import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { CheckoutDto } from "../dto/checkout.dto";
import { ApplicationService } from "../../app/services/application.service";
import { CheckoutResponse, PaymentWithLedgerType } from "../../app/types";
import { Payment } from "../../domain/payment_management/payment.entity";

@Controller("/webhooks")
export class WebhookController {
  constructor(private readonly applicationService: ApplicationService) { }

  @Post("/mock")
  async receiveGatewayEvent(
    @Body() gatewayEventData: any,
    @Headers("x-signature") signature: string,
  ): Promise<void> {

    await this.applicationService.receiveGatewayEvent(
      gatewayEventData,
      signature,
    );
  }


}