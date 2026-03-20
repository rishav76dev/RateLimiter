import express from "express";
import redisClient from "./redis/redisClient.ts";
import CounterStore from "./redis/counterStore.ts";
import MitigationCache from "./cache/mitigationCache.ts";
import LimiterService from "./services/limiterService.ts";
import { RateLimitMiddleware } from "./middleware/rateLimitMiddleware.ts";
import { rateLimitConfig } from "./config/rateLimitConfig.ts";

const app = express();
app.use(express.json());

// Initialize single rate limiter
const counterStore = new CounterStore(redisClient);
const mitigationCache = new MitigationCache();
const limiterService = new LimiterService(
    mitigationCache,
    counterStore,
    rateLimitConfig.limit,
    rateLimitConfig.windowSize,
    rateLimitConfig.blockDurationMs
);

const rateLimitMiddleware = new RateLimitMiddleware(limiterService);

console.log(`✓ Rate limiter initialized`);
console.log(`  - Limit: ${rateLimitConfig.limit} requests per ${rateLimitConfig.windowSize}s`);
console.log(`  - Block duration: ${rateLimitConfig.blockDurationMs / 1000}s`);


app.use(rateLimitMiddleware.middleware);

app.get("/api/data", (req, res) => {
    res.json({ 
        message: "Success", 
        timestamp: new Date().toISOString() 
    });
});

app.get("/health", (req, res) => {
    res.json({ 
        status: "healthy", 
        timestamp: new Date().toISOString() 
    });
});

app.get("/stats", (req, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        queueSize: rateLimitMiddleware.getQueueSize(),
        config: {
            limit: rateLimitConfig.limit,
            windowSize: rateLimitConfig.windowSize,
            blockDurationMs: rateLimitConfig.blockDurationMs
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Rate Limiter Server Started");
    console.log(`Server running on port ${PORT}`);
    console.log(`\nTest endpoints:`);
    console.log(`  GET http://localhost:${PORT}/api/data`);
    console.log(`  GET http://localhost:${PORT}/stats`);
    console.log(`  GET http://localhost:${PORT}/health`);
});