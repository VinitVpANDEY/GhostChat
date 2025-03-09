import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL;

export const ChannelManagerRedisClient = createClient({ url: redisUrl });
ChannelManagerRedisClient.on('error', (err) => console.log('Redis Client Error', err));

export const UserManagerRedisClient = createClient({ url: redisUrl });
UserManagerRedisClient.on('error', (err) => console.log('Redis Client Error', err));

export const MessageManagerRedisClient = createClient({ url: redisUrl });
MessageManagerRedisClient.on('error', (err) => console.log('Redis Client Error', err));




