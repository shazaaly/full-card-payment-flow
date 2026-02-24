import { WebhookEvent } from "../../domain/webhookEvent/webhookEvent.entity";
import { GenericResponse } from "../types";


export interface WebhookEventPort {
    createWebhookEvent(webhookEvent: WebhookEvent): Promise<GenericResponse>;
    findWebhookEventByGatewayEventId(gatewayEventId: string): Promise<WebhookEvent | null>;
}