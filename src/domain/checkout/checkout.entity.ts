import { v4 as uuidv4 } from "uuid";

export class CheckoutEntity {
  amount: number;
  currency: string;
  userId: string;

  constructor(props: {
    amount: number;
    currency: string;
    userId: string;
  }) {
    if (Number(props.amount) <= 0) throw new Error("Amount must be positive");

    if (!/^[A-Z]{3}$/.test(props.currency))
      throw new Error("Currency must be ISO 4217 code");

    if (!props.userId) throw new Error("User ID is required");

    this.amount = props.amount;
    this.currency = props.currency;
    this.userId = props.userId;
  }
}
