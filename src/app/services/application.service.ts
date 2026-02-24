import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { CheckoutResponse, LedgerDirection, LedgerType, OutboxType, PaymentEventType, PaymentStatus, PaymentWithLedgerType } from "../types";
import { MockGatewayService } from "./mock-gateway.service";
import { CheckoutDto } from "../../interface/dto/checkout.dto";
import { PaymentPort } from "../port/payment.port";
import { Payment } from "../../domain/payment_management/payment.entity";
import { v4 as uuidv4 } from "uuid";
import { CheckoutEntity } from "../../domain/checkout/checkout.entity";
import { UserPort } from "../port/user.port";
import { UserEntity } from "../../domain/user.entity.ts/user.entity";
import { LedgerPort } from "../port/ledger";
import { WebhookEvent } from "../../domain/webhookEvent/webhookEvent.entity";
import { LedgerEntry } from "../../domain/LedgerEntry/ledger-entry.entity";
import { Outbox } from "../../domain/outbox/outbox.entity";
import { WebhookEventPort } from "../port/webhookEvent.port";
import { OutboxPort } from "../port/outbox.port";
import { TransactionPort } from "../port/transaction.port";
import { CachingService } from "./caching.service";

@Injectable()
export class ApplicationService {
  private readonly WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!;

  constructor(
    private readonly mockGatewayService: MockGatewayService,
    @Inject("PaymentPort") private readonly paymentPort: PaymentPort,
    @Inject("UserPort") private readonly userPort: UserPort,
    @Inject("LedgerPort") private readonly ledgerPort: LedgerPort,
    @Inject("WebhookEventPort") private readonly webhookEventPort: WebhookEventPort,
    @Inject("OutboxPort") private readonly outboxPort: OutboxPort,
    @Inject("TransactionPort") private readonly transactionPort: TransactionPort,
    private readonly cachingService: CachingService,
  ) { }

  validateIdempotencyKey(idempotencyKey: string): void {
    if (!idempotencyKey) {
      throw new BadRequestException("Idempotency-Key header is required");
    }
  }

  validateSignature(payload: any, signature: string): void {
    if (!signature)
      throw new BadRequestException("Signature header is required");

    try {
      const expectedSignature = MockGatewayService.generateSignature(
        payload,
        this.WEBHOOK_SECRET,
      );

      if (signature !== expectedSignature)
        throw new BadRequestException("Invalid signature");

    } catch (err) {
      throw new BadRequestException("Failed to validate signature");
    }
  }

  async createUser(user: UserEntity): Promise<UserEntity> {
    try {
      const createdUser = await this.userPort.createUser(user);
      return createdUser;
    } catch (error) {
      throw new BadRequestException("Failed to create user");
    }
  }

  async findUserById(id: string): Promise<UserEntity> {
    try {
      const user = await this.userPort.findUserById(id);
      return user;
    } catch (error) {
      throw new BadRequestException("User not found");
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

  async getPaymentById(id: string): Promise<PaymentWithLedgerType> {
    const payment = await this.paymentPort.findPaymentById(id);
    if (!payment) {
      throw new BadRequestException(`Payment with id ${id} not found`);
    }

    const paymentInstance = new Payment(payment);

    let ledgerType: LedgerType | null = null;

    try {
      const ledger = await this.ledgerPort.findLedgerByPaymentId(id);
      ledgerType = ledger.type;
    } catch {
      ledgerType = null;
    }

    return {
      ...paymentInstance,
      ledger_type: ledgerType || null,
    };
  }

  async receiveGatewayEvent(gatewayEventData: any, signature: string): Promise<void> {
    try {
      this.validateSignature(gatewayEventData, signature);

      const eventExistsInCache = await this.cachingService.eventExists(gatewayEventData.id);
      if (eventExistsInCache) return;

      const existing_webhook_event = await this.webhookEventPort.findWebhookEventByGatewayEventId(gatewayEventData.id);
      if (existing_webhook_event) {
        await this.cachingService.setEvent(gatewayEventData.id, existing_webhook_event);
        return;
      }

      const webhook_event_instance = new WebhookEvent({
        id: uuidv4(),
        gateway: "MOCK",
        gatewayEventId: gatewayEventData.id,
        type: gatewayEventData.type,
        payload: gatewayEventData,
        receivedAt: new Date(),
      });



      const payment = await this.paymentPort.findPaymentById(gatewayEventData.paymentId || gatewayEventData.id);
      if (!payment) throw new BadRequestException("Payment not found");

      const payment_instance = new Payment(payment);
      payment_instance.applyPaymentStatusUpdate(webhook_event_instance.type as unknown as PaymentEventType);

      const ledger_entry_instance = new LedgerEntry({
        userId: payment_instance.userId,
        direction: LedgerDirection.CREDIT,
        id: uuidv4(),
        paymentId: payment_instance.id,
        type: LedgerType.PAYMENT_CAPTURE,
        amount: payment_instance.amount,
        currency: payment_instance.currency,
        createdAt: new Date(),
      });
      const outbox_event_instance = new Outbox({
        id: uuidv4(),
        type: OutboxType.RECEIPT_EMAIL,
        payload: payment_instance,
        createdAt: new Date(),
      });

      await this.transactionPort.runEventTransaction(webhook_event_instance, payment_instance, ledger_entry_instance, outbox_event_instance);

      await this.cachingService.setEvent(gatewayEventData.id, webhook_event_instance);

    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
