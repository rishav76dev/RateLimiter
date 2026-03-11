import { Redis } from "ioredis";
import TimeBucket from "../utils/timeBucket.ts";

export default class CounterStore {
    constructor (private readonly redis: Redis ){}

    async incrementAndGet (
        ip: string,
        bucket: TimeBucket,
        incrementBy: number = 1
    ): Promise<{ currentCount: number; previousCount: number }> {
        const currentKey = `rate_limit:${ip}:${bucket.currentWindowId}`;
        const previousKey = `rate_limit:${ip}:${bucket.previousWindowId}`;

        const currentCount = await this.redis.incrby(currentKey, incrementBy);

        if (currentCount === incrementBy) {
            await this.redis.expire(currentKey, bucket.windowSize * 2);
        }

        const previousRaw = await this.redis.get(previousKey);
        const previousCount = previousRaw ? parseInt(previousRaw, 10) : 0;

        return { currentCount, previousCount };
    }

    async setMitigation(ip: string, durationMs: number): Promise<void> {
        const mitigationKey = `mitigation:${ip}`;
        const expiryTime = Date.now() + durationMs;
        
        await this.redis.set(
            mitigationKey,
            expiryTime.toString(),
            'PX', 
            durationMs
        );
    }

    async isMitigated(ip: string): Promise<boolean> {
        const mitigationKey = `mitigation:${ip}`;
        const result = await this.redis.get(mitigationKey);
        return result !== null;
    }

    async getMitigationExpiry(ip: string): Promise<number | null> {
        const mitigationKey = `mitigation:${ip}`;
        const result = await this.redis.get(mitigationKey);
        
        if (!result) return null;
        
        return parseInt(result, 10);
    }
}