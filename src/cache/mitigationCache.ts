import { MinHeap } from "../utils/minHeap.ts";

export default class MitigationCache {
    private blockedIPs = new Map<string, number>();

    private heap = new MinHeap();

    private cleanUp() {
        const now = Date.now();

        while(true){
            const top = this.heap.peek();

            if(!top || top.expiry > now) break;

            const expired = this.heap.removeMin();
            if(expired){
                // Only delete from the map if the expiry matches.
                // A mismatch means the IP was re-blocked with a newer expiry,
                // so this is a stale heap entry that should just be discarded.
                const currentExpiry = this.blockedIPs.get(expired.ip);
                if(currentExpiry !== undefined && currentExpiry <= now){
                    this.blockedIPs.delete(expired.ip);
                }
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