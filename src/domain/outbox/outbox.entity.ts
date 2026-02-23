import { v4 as uuidv4 } from "uuid";
import { OutboxStatus, OutboxType } from "../../app/types";


export interface OutboxProps {
  id?: string;
  type: OutboxType;
  payload?: any;
  status?: OutboxStatus;
  nextAttemptAt?: Date;
  attempts?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Outbox {
  id: string;
  type: string;
  payload?: any;
  status: OutboxStatus;
  nextAttemptAt?: Date;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: OutboxProps) {
    this.id = props.id ?? uuidv4();
    this.type = props.type;
    this.payload = props.payload;
    this.status = props.status ?? OutboxStatus.PENDING;
    this.nextAttemptAt = props.nextAttemptAt;
    this.attempts = props.attempts ?? 0;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

}