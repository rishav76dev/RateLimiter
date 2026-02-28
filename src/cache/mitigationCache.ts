import { MinHeap } from "../utils/minHeap.ts";

export class MitigationCache {
    private blockedIPs = new Map<string, number>();

    private heap = new MinHeap();

    private cleanUp() {
        const now = Date.now();

        while(true){
            const top = this.heap.peek();

            if(!top || top.expiry > now) break;

            const expired = this.heap.removeMin();
            if(expired){
                this.blockedIPs.delete(expired.ip);
            }
        }

    }

    isBlocked(ip: string): boolean {
        this.cleanUp();
        return this.blockedIPs.has(ip)
    }

    block(ip: string, durationMs: number){
        const expiry = Date.now() + durationMs;
        this.blockedIPs.set(ip, expiry);
        this.heap.insert({ip, expiry})
    }
}