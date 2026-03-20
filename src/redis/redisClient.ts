import { Redis } from "ioredis";

const redisClient = new Redis({
  // TODO: Move to config
  host: "localhost",
  port: 6379,
});

export default redisClient;
