import type { Request, Response, NextFunction } from "express";
import LimiterService from "../services/limiterService.ts";
import { rateLimitConfig } from "../config/rateLimitConfig.ts";

export class RateLimitMiddleware {
    constructor(private limiterService: LimiterService) {}

    middleware = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const ip = this.getClientIp(req);

            const result = await this.limiterService.check(ip);

            res.setHeader("X-RateLimit-Limit", rateLimitConfig.limit.toString());
            res.setHeader("X-RateLimit-Remaining", result.remaining.toString());
            res.setHeader("X-RateLimit-Window", rateLimitConfig.windowSize.toString());

            if (!result.allowed) {
                if (result.retryAfter) {
                    res.setHeader("Retry-After", result.retryAfter.toString());
                }

                res.status(429).json({
                    error: "Too Many Requests",
                    message: "Rate limit exceeded",
                    retryAfter: result.retryAfter,
                });
                return;
            }
            next();
        } catch (error) {
            console.error("Rate limit middleware error:", error);
       
            next();
        }
    };

 
    private getClientIp(req: Request): string {
        const forwardedFor = req.headers["x-forwarded-for"];
        if (forwardedFor) {
            const ips = Array.isArray(forwardedFor)
                ? forwardedFor[0]
                : forwardedFor;
            return ips?.split(",")[0]?.trim() || req.ip || "unknown";
        }

        const realIp = req.headers["x-real-ip"];
        if (realIp) {
            const ip = Array.isArray(realIp) ? realIp[0] : realIp;
            return ip || "unknown";
        }

        return req.ip || "unknown";
    }

    getQueueSize(): number {
        return this.limiterService.getQueueSize();
    }
}
