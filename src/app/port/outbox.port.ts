import { Outbox } from "../../domain/outbox/outbox.entity";
import { GenericResponse } from "../types";


export interface OutboxPort {
    createOutbox(outbox: Outbox): Promise<GenericResponse>;
    findOutboxById(id: string): Promise<Outbox>;
}