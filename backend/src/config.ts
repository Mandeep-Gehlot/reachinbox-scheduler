import 'dotenv/config';

export const config = {
  port: +(process.env.PORT ?? 4000),
  concurrency: +(process.env.WORKER_CONCURRENCY ?? 5),
  minDelayMs: +(process.env.MIN_DELAY_MS ?? 2000),
  maxPerHourPerSender: +(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER ?? 100),
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: 6379,
    maxRetriesPerRequest: null as null,
  },
};