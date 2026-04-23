import { redis } from "../../config/redis";

export const setCache = async (key: string, data: unknown, ttl = 300) => {
  await redis.set(key, JSON.stringify(data), "EX", ttl);
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  const data = await redis.get(key);
  return data ? (JSON.parse(data) as T) : null;
};

export const deleteCache = async (key: string) => {
  await redis.del(key);
};