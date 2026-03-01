import { Redis, RedisOptions } from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  },
};

declare global {
  var prismaRedis: Redis | undefined;
}

export const redis = global.prismaRedis || new Redis(REDIS_URL, redisOptions);

if (process.env.NODE_ENV !== "production") {
  global.prismaRedis = redis;
}
