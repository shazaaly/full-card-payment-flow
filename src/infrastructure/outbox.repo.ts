import { Injectable } from "@nestjs/common";
import { OutboxPort } from "../app/port/outbox.port";
import { Outbox } from "../domain/outbox/outbox.entity";
import { PrismaService } from "./postgres/prisma/prisma.service";
import { GenericResponse } from "../app/types";

@Injectable()
export class OutboxRepo implements OutboxPort {
    constructor(private readonly prisma: PrismaService) { }

    async createOutbox(outbox: Outbox, tx?: any): Promise<GenericResponse> {
        const client = tx || this.prisma;
        await client.outbox.create({
            data: {
                id: outbox.id,
                type: outbox.type,
                payload: outbox.payload,
                createdAt: outbox.createdAt,
            },
        });
        return { status: "created", ok: true };
    }

    async findOutboxById(id: string): Promise<Outbox> {
        const outbox = await this.prisma.outbox.findUnique({ where: { id } });
        if (!outbox) {
            throw new Error(`Outbox with id ${id} not found`);
        }
        return new Outbox({
            id: outbox.id,
            type: outbox.type as any,
            payload: outbox.payload,
            createdAt: outbox.createdAt,
        });
    }
}
