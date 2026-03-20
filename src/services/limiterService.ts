import MitigationCache from "../cache/mitigationCache.ts";
import CounterStore from "../redis/counterStore.ts";
import CounterWorker from "../worker/counterWorker.ts";


export default class LimiterService {
    private readonly worker: CounterWorker;

    constructor(
        private readonly cache: MitigationCache,
        private readonly counterStore: CounterStore,
        private readonly limit: number,
        private readonly windowSize: number,
        private readonly blockDurationMs: number
    ) {
        // Initialize background worker for async processing
        this.worker = new CounterWorker(
            counterStore,
            cache,
            limit,
            windowSize,
            blockDurationMs
        );
    }


    public async check(ip: string): Promise<{
        allowed: boolean;
        remaining: number;
        retryAfter?: number;
    }> {
        if (this.cache.isBlocked(ip)) {
            return {
                allowed: false,
                remaining: 0,
                retryAfter: Math.ceil(this.blockDurationMs / 1000),
            };
        }


        const mitigationExpiry = await this.counterStore.getMitigationExpiry(ip);
        if (mitigationExpiry !== null) {
            const now = Date.now();
            if (mitigationExpiry > now) {
                // Cache it locally so we don't need to check Redis again
                const remainingMs = mitigationExpiry - now;
                this.cache.block(ip, remainingMs);
                
                return {
                    allowed: false,
                    remaining: 0,
                    retryAfter: Math.ceil(remainingMs / 1000),
                };
            }
        }

        this.worker.recordIp(ip);

        return {
            allowed: true,
            remaining: this.limit, // Optimistic estimate
        };
    }

   
    public getQueueSize(): number {
        return this.worker.getQueueSize();
    }
}