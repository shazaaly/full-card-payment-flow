import { PrismaService } from "./postgres/prisma/prisma.service";
import { WebhookEventPort } from "../app/port/webhookEvent.port";
import { WebhookEvent } from "../domain/webhookEvent/webhookEvent.entity";
import { GenericResponse, WebhookEventType } from "../app/types";

import { Injectable } from "@nestjs/common";

@Injectable()
export class WebhookEventRepo implements WebhookEventPort {
    constructor(private readonly prismaService: PrismaService) { }

    async createWebhookEvent(webhookEvent: WebhookEvent): Promise<GenericResponse> {
        try {
            await this.prismaService.webhookEvent.create({
                data: {
                    id: webhookEvent.id,
                    gateway: webhookEvent.gateway,
                    gatewayEventId: webhookEvent.gatewayEventId ?? undefined,
                    eventType: webhookEvent.type,
                    payload: webhookEvent.payload ?? undefined,
                    receivedAt: webhookEvent.receivedAt,
                },
            });

            return { status: "success", ok: true };
        } catch (error: any) {
            throw new Error("Failed to create webhook event: " + error.message);
        }
    }

    async findWebhookEventByGatewayEventId(
        gatewayEventId: string
    ): Promise<WebhookEvent | null> {
        try {
            const event = await this.prismaService.webhookEvent.findFirst({
                where: { gatewayEventId },
            });

            if (!event) return null;

            return new WebhookEvent({
                id: event.id,
                gateway: event.gateway,
                gatewayEventId: event.gatewayEventId ?? "",
                type: event.eventType as WebhookEventType,
                payload: event.payload ?? {},
                receivedAt: event.receivedAt,
            });
        } catch (error) {
            throw new Error("Failed to find webhook event:findWebhookEventByGatewayEventId " + error.message);
        }
    }
}