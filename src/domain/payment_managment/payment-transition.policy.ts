import {
  PaymentEventType,
  PaymentStatus,
  TransitionDecision,
} from "../../application/types";
import { OUTCOME, REASON } from "./types";

const EVENT_TO_TARGET_STATUS: Record<PaymentEventType, PaymentStatus> = {
  [PaymentEventType.CHECKOUT_CREATED]: PaymentStatus.PENDING,
  [PaymentEventType.PAYMENT_PENDING]: PaymentStatus.PENDING,
  [PaymentEventType.PAYMENT_AUTHORIZED]: PaymentStatus.AUTHORIZED,
  [PaymentEventType.PAYMENT_CAPTURED]: PaymentStatus.CAPTURED,
  [PaymentEventType.PAYMENT_FAILED]: PaymentStatus.FAILED,
  [PaymentEventType.PAYMENT_REFUNDED]: PaymentStatus.REFUNDED,
};

const ALLOWED_TRANSITIONS: Record<PaymentStatus, Set<PaymentStatus>> = {
  [PaymentStatus.CREATED]: new Set([PaymentStatus.PENDING]),
  [PaymentStatus.PENDING]: new Set([
    PaymentStatus.AUTHORIZED,
    PaymentStatus.CAPTURED,
    PaymentStatus.FAILED,
  ]),
  [PaymentStatus.AUTHORIZED]: new Set([
    PaymentStatus.CAPTURED,
    PaymentStatus.FAILED,
  ]),
  [PaymentStatus.CAPTURED]: new Set([PaymentStatus.REFUNDED]),
  [PaymentStatus.FAILED]: new Set(),
  [PaymentStatus.REFUNDED]: new Set(),
};

export function decidePaymentTransition(
  currentStatus: PaymentStatus,
  incomingEvent: PaymentEventType,
): TransitionDecision {
  const targetStatus = EVENT_TO_TARGET_STATUS[incomingEvent];

  const baseDecision = {
    targetStatus: currentStatus,
    shouldCreateLedgerEntry: false,
    shouldCreateReceiptOutboxEvent: false,
  };

  if (!targetStatus) {
    return {
      ...baseDecision,
      outcome: OUTCOME.REJECTED,
      reason: REASON.UNSUPPORTED_EVENT,
    };
  }

  if (targetStatus === currentStatus) {
    return {
      ...baseDecision,
      outcome: OUTCOME.IGNORED,
      reason: REASON.DUPLICATE_EVENT,
    };
  }

  // Out-of-order after CAPTURED
  if (
    currentStatus === PaymentStatus.CAPTURED &&
    targetStatus !== PaymentStatus.REFUNDED
  ) {
    return {
      ...baseDecision,
      outcome: OUTCOME.IGNORED,
      reason: REASON.OUT_OF_ORDER_EVENT,
    };
  }

  if (!ALLOWED_TRANSITIONS[currentStatus].has(targetStatus)) {
    return {
      ...baseDecision,
      outcome: OUTCOME.REJECTED,
      reason: REASON.INVALID_TRANSITION,
    };
  }

  const isCapture = targetStatus === PaymentStatus.CAPTURED;

  return {
    outcome: OUTCOME.APPLIED,
    targetStatus,
    shouldCreateLedgerEntry: isCapture,
    shouldCreateReceiptOutboxEvent: isCapture,
    reason: REASON.TRANSITION_APPLIED,
  };
}
