import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class CachingService implements OnModuleInit, OnModuleDestroy {
    private redisClient!: Redis;

    onModuleInit() {
        this.redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    }

    onModuleDestroy() {
        this.redisClient.disconnect();
    }

    async setEvent(idempotencyKey: string, eventData: any, ttlSeconds: number = 86400): Promise<void> {
        await this.redisClient.set(
            `webhook_event:${idempotencyKey}`,
            JSON.stringify(eventData),
            'EX',
            ttlSeconds
        );
    }

    async getEvent(idempotencyKey: string): Promise<any | null> {
        const data = await this.redisClient.get(`webhook_event:${idempotencyKey}`);
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch {
            return data;
        }
    }

    async eventExists(idempotencyKey: string): Promise<boolean> {
        const exists = await this.redisClient.exists(`webhook_event:${idempotencyKey}`);
        return exists === 1;
    }
}
