import { BadRequestException } from "@nestjs/common";
import { CheckoutResponse } from "../types";
import { MockGatewayService } from "./mock-gateway.service";
import { CheckoutDto } from "../../interface/dto/checkout.dto";

export class ApplicationService {
  constructor(private readonly mockGatewayService: MockGatewayService) {}

  validateIdempotencyKey(idempotencyKey: string): void {
    if (!idempotencyKey) {
      throw new BadRequestException("Idempotency-Key header is required");
    }
  }

  async checkout(checkoutData: CheckoutDto, idempotencyKey: string): Promise<CheckoutResponse> {
    try {
      this.validateIdempotencyKey(idempotencyKey);
      return await this.mockGatewayService.checkout(checkoutData, idempotencyKey);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
