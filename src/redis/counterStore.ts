import { Redis } from "ioredis";
import TimeBucket from "../utils/timeBucket.ts";

export default class CounterStore {
    constructor (private readonly redis: Redis ){}

    async incrementAndGet (
        ip: string,
        bucket: TimeBucket
    ): Promise<{ currentCount: number; previousCount: number}> {
        const currentKey = `rate_limit:${ip}:${bucket.currentWindowId}`;
        const previousKey = `rate_limit:${ip}:${bucket.previousWindowId}`;

    const currentCount = await this.redis.incr(currentKey);

    if (currentCount === 1) {
      await this.redis.expire(
        currentKey,
        bucket.windowSize * 2
      );
    }

   
    const previousRaw = await this.redis.get(previousKey);
    const previousCount = previousRaw
      ? parseInt(previousRaw, 10)
      : 0;

    return { currentCount, previousCount };
    }
}