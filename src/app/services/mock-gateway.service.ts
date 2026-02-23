import { Injectable } from "@nestjs/common";
import { CheckoutResponse, PaymentEventType, WebhookEventType } from "../types";

export interface MockGatewayConfig {
  sendDuplicateEvents?: boolean;
  sendOutOfOrderEvents?: boolean;
  delayEvent?: number;
}

export interface MockWebhook {
  eventType: WebhookEventType;
  payload: { gatewayPaymentId: string; url: string };
  delay?: number;
}

@Injectable()
export class MockGatewayService {
  gatewayPaymentId: string;
  checkoutUrl: string;
  config?: MockGatewayConfig;

  constructor(
    gatewayPaymentId: string,
    checkoutUrl: string,
    config?: MockGatewayConfig,
  ) {
    this.gatewayPaymentId = gatewayPaymentId;
    this.checkoutUrl = checkoutUrl;
    if (config) this.config = config;
  }

  setConfig(config: MockGatewayConfig): void {
    this.config = { ...this.config, ...config };
  }

  generateWebhooks(event: {
    eventType: WebhookEventType;
    url: string;
  }): MockWebhook[] {
    const webhooks: MockWebhook[] = [];

    const baseWebhook: MockWebhook = {
      eventType: event.eventType,
      payload: { gatewayPaymentId: this.gatewayPaymentId, url: event.url },
      delay: this.config?.delayEvent,
    };

    webhooks.push(baseWebhook);

    if (this.config?.sendDuplicateEvents) webhooks.push({ ...baseWebhook });

    if (
      this.config?.sendOutOfOrderEvents &&
      event.eventType === WebhookEventType.PAYMENT_CAPTURED
    ) {
      webhooks.push({
        ...baseWebhook,
        eventType: WebhookEventType.PAYMENT_FAILED,
      });
    }

    return webhooks;
  }

  checkout(): CheckoutResponse {
    const gatewayPaymentId = crypto.randomUUID();
    const checkoutUrl = `https://mock-gateway.local/checkout?gatewayPaymentId=${gatewayPaymentId}`;

    const delay = this.config?.delayEvent ?? 1000;
    setTimeout(() => {
      const webhooks = this.generateWebhooks({
        eventType: WebhookEventType.PAYMENT_AUTHORIZED,
        url: checkoutUrl,
      });

      console.log("Webhooks ready to send:", webhooks);
    }, delay);

    this.gatewayPaymentId = gatewayPaymentId;
    this.checkoutUrl = checkoutUrl;

    return {
      checkoutUrl: this.checkoutUrl,
      gatewayPaymentId: this.gatewayPaymentId,
    };
  }
}
