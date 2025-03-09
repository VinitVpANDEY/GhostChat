"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageManagerRedisClient = exports.UserManagerRedisClient = exports.ChannelManagerRedisClient = void 0;
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redisUrl = process.env.REDIS_URL;
exports.ChannelManagerRedisClient = (0, redis_1.createClient)({ url: redisUrl });
exports.ChannelManagerRedisClient.on('error', (err) => console.log('Redis Client Error', err));
exports.UserManagerRedisClient = (0, redis_1.createClient)({ url: redisUrl });
exports.UserManagerRedisClient.on('error', (err) => console.log('Redis Client Error', err));
exports.MessageManagerRedisClient = (0, redis_1.createClient)({ url: redisUrl });
exports.MessageManagerRedisClient.on('error', (err) => console.log('Redis Client Error', err));
