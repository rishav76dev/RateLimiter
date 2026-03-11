import CounterStore from "../redis/counterStore.ts";
import TimeBucket from "../utils/timeBucket.ts";
import MitigationCache from "../cache/mitigationCache.ts";


export default class CounterWorker {
    private queue: Map<string, number> = new Map();
    private isProcessing = false;
    private readonly processIntervalMs = 100; // Process every 100ms

    constructor(
        private readonly counterStore: CounterStore,
        private readonly mitigationCache: MitigationCache,
        private readonly limit: number,
        private readonly windowSize: number,
        private readonly blockDurationMs: number
    ) {
        this.startProcessing();
    }

  
    public recordIp(ip: string): void {
        const currentCount = this.queue.get(ip) || 0;
        this.queue.set(ip, currentCount + 1);
    }

 
    private startProcessing(): void {
        setInterval(() => {
            this.processQueue();
        }, this.processIntervalMs);
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.queue.size === 0) {
            return;
        }

        this.isProcessing = true;
        
        // Take a snapshot of the current queue
        const snapshot = new Map(this.queue);
        this.queue.clear();

        try {
            const bucket = TimeBucket.create(this.windowSize);

            // Process each IP in the snapshot
            for (const [ip, pendingIncrements] of snapshot) {
                try {
                    if (this.mitigationCache.isBlocked(ip)) {
                        continue;
                    }

                    // Increment counter and get current + previous window counts
                    const { currentCount, previousCount } = 
                        await this.counterStore.incrementAndGet(ip, bucket, pendingIncrements);

                    // Sliding window calculation
                    // rate = previous_count * overlap_ratio + current_count
                    const effectiveRate = previousCount * bucket.overlapRatio + currentCount;

                    // Check if rate exceeds limit
                    if (effectiveRate > this.limit) {
                        // Start mitigation - cache locally for fast lookups
                        this.mitigationCache.block(ip, this.blockDurationMs);
                        
                        // Store mitigation in Redis so other servers in the PoP know
                        await this.counterStore.setMitigation(ip, this.blockDurationMs);
                        
                        console.log(
                            `[MITIGATION] IP ${ip} blocked. Rate: ${effectiveRate.toFixed(2)}/${this.limit}`
                        );
                    }
                } catch (error) {
                    console.error(`Error processing IP ${ip}:`, error);
                }
            }
        } finally {
            this.isProcessing = false;
        }
    }

 
    public getQueueSize(): number {
        return this.queue.size;
    }
}