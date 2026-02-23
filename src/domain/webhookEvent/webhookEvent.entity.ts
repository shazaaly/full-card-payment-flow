import { WebhookEventType } from "../../app/types";
import { v4 as uuidv4 } from "uuid";

export interface WebhookEventProps {
  id?: string;
  gateway: string;
  gatewayEventId: string;
  type: WebhookEventType;
  payload?: any;
  receivedAt?: Date;
}
export class WebhookEvent {
  id: string;
  gateway: string;
  gatewayEventId: string;
  type: WebhookEventType;
  payload?: any;
  receivedAt: Date;

  constructor(props: WebhookEventProps) {
    this.id = props.id ?? uuidv4();
    this.gateway = props.gateway;
    this.gatewayEventId = props.gatewayEventId;
    this.type = props.type;
    this.payload = props.payload;
    this.receivedAt = props.receivedAt ?? new Date();
  }
}