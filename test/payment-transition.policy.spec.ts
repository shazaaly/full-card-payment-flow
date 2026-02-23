import { strict as assert } from "node:assert";
import {
  PaymentEventType,
  PaymentStatus,
  TransitionDecision,
} from "../../../src/application/types";
import { decidePaymentTransition } from "../../../src/domain/payment_management/payment-transition.policy";

function expectDecision(
  decision: TransitionDecision,
  expected: Partial<TransitionDecision>,
): void {
  assert.equal(decision.outcome, expected.outcome);
  assert.equal(decision.targetStatus, expected.targetStatus);
  assert.equal(decision.shouldCreateLedgerEntry, expected.shouldCreateLedgerEntry);
  assert.equal(
    decision.shouldCreateReceiptOutboxEvent,
    expected.shouldCreateReceiptOutboxEvent,
  );
}

function runPaymentTransitionPolicyTests(): void {
  expectDecision(
    decidePaymentTransition(
      PaymentStatus.PENDING,
      PaymentEventType.PAYMENT_CAPTURED,
    ),
    {
      outcome: "APPLIED",
      targetStatus: PaymentStatus.CAPTURED,
      shouldCreateLedgerEntry: true,
      shouldCreateReceiptOutboxEvent: true,
    },
  );

  expectDecision(
    decidePaymentTransition(
      PaymentStatus.CAPTURED,
      PaymentEventType.PAYMENT_FAILED,
    ),
    {
      outcome: "IGNORED",
      targetStatus: PaymentStatus.CAPTURED,
      shouldCreateLedgerEntry: false,
      shouldCreateReceiptOutboxEvent: false,
    },
  );

  expectDecision(
    decidePaymentTransition(
      PaymentStatus.AUTHORIZED,
      PaymentEventType.PAYMENT_FAILED,
    ),
    {
      outcome: "APPLIED",
      targetStatus: PaymentStatus.FAILED,
      shouldCreateLedgerEntry: false,
      shouldCreateReceiptOutboxEvent: false,
    },
  );

  expectDecision(
    decidePaymentTransition(
      PaymentStatus.CREATED,
      PaymentEventType.PAYMENT_CAPTURED,
    ),
    {
      outcome: "REJECTED",
      targetStatus: PaymentStatus.CREATED,
      shouldCreateLedgerEntry: false,
      shouldCreateReceiptOutboxEvent: false,
    },
  );

  expectDecision(
    decidePaymentTransition(
      PaymentStatus.PENDING,
      PaymentEventType.PAYMENT_PENDING,
    ),
    {
      outcome: "IGNORED",
      targetStatus: PaymentStatus.PENDING,
      shouldCreateLedgerEntry: false,
      shouldCreateReceiptOutboxEvent: false,
    },
  );
}

runPaymentTransitionPolicyTests();
