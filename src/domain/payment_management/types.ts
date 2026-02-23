export enum REASON{
    TRANSITION_APPLIED = "Transition applied.",
    DUPLICATE_EVENT = "Duplicate event for same status.",
    OUT_OF_ORDER_EVENT = "Out-of-order event ignored after CAPTURED.",
    INVALID_TRANSITION = "Invalid transition.",
    UNSUPPORTED_EVENT = "Unsupported event.",
}

export enum OUTCOME {
    APPLIED = "APPLIED",
    IGNORED = "IGNORED",
    REJECTED = "REJECTED",
}