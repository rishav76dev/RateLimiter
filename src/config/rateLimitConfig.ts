export interface RateLimitConfig {
    limit: number;           // Max requests allowed
    windowSize: number;      // Time window in seconds
    blockDurationMs: number; // How long to block after exceeding limit
}


export const rateLimitConfig: RateLimitConfig = {
    limit: 10,                     // 10 requests
    windowSize: 60,                // per 60 seconds
    blockDurationMs: 2 * 60 * 1000 // block for 2 minutes
};
