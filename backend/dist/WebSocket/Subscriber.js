"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscribers = exports.unsubscribe = exports.subscribe = void 0;
const RedisClient_1 = require("./RedisClient");
// Subscribe a user to a channel
function subscribe(groupId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const groupUsersKey = `group:${groupId}:users`;
        try {
            // Check if the key exists
            const exists = yield RedisClient_1.ChannelManagerRedisClient.exists(groupUsersKey);
            if (!exists) {
                console.log(`Key ${groupUsersKey} does not exist. Creating it and adding user.`);
                // Add the user to the set, which creates the key if it doesn't exist
                yield RedisClient_1.ChannelManagerRedisClient.sAdd(groupUsersKey, userId.toString());
                console.log(`User ${userId} subscribed to ${groupId}`);
                return;
            }
            // Check if the user is already a member
            const isMember = yield RedisClient_1.ChannelManagerRedisClient.sIsMember(groupUsersKey, userId.toString());
            if (!isMember) {
                yield RedisClient_1.ChannelManagerRedisClient.sAdd(groupUsersKey, userId.toString());
                console.log(`User ${userId} subscribed to ${groupId}`);
            }
            else {
                console.log(`User ${userId} is already a member of ${groupId}`);
            }
        }
        catch (error) {
            console.error("Error during check and subscribe:", error);
        }
    });
}
exports.subscribe = subscribe;
// Unsubscribe a user from a channel
function unsubscribe(groupId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const groupUsersKey = `group:${groupId}:users`;
        const exists = yield RedisClient_1.ChannelManagerRedisClient.sIsMember(groupUsersKey, userId.toString());
        if (!exists)
            return;
        yield RedisClient_1.ChannelManagerRedisClient.sRem(groupUsersKey, userId.toString());
        console.log(`User ${userId} unsubscribed from ${groupId}`);
    });
}
exports.unsubscribe = unsubscribe;
// Get subscribers of a channel
function getSubscribers(groupId) {
    return __awaiter(this, void 0, void 0, function* () {
        const groupUsersKey = `group:${groupId}:users`;
        const subscribers = yield RedisClient_1.ChannelManagerRedisClient.sMembers(groupUsersKey);
        return subscribers || [];
    });
}
exports.getSubscribers = getSubscribers;
