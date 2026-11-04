import IORedis from 'ioredis';
import { config } from './config';

const redis = new IORedis(config.redis);
const HOUR = 3600000;

const lua = `
local c = redis.call('INCR', KEYS[1])
if c == 1 then redis.call('EXPIRE', KEYS[1], 3700) end
return c`;

export async function tryConsume(senderId: number, limit: number) {
  const hourStart = Math.floor(Date.now() / HOUR) * HOUR;
  const key = `rl:${senderId}:${hourStart}`;
  const count = (await redis.eval(lua, 1, key)) as number;
  if (count > limit) {
    await redis.decr(key);
    return { ok: false as const, nextWindow: hourStart + HOUR };
  }
  return { ok: true as const };
}