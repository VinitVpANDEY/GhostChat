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
exports.leaveGroup = exports.joinGroup = exports.groupJoinRequest = void 0;
const Publisher_1 = require("./Publisher");
const RandomIdGenerator_1 = require("./RandomIdGenerator");
const RedisClient_1 = require("./RedisClient");
const Subscriber_1 = require("./Subscriber");
function groupJoinRequest(requestId, groupId, senderId, senderName, receiverId, receiverName) {
    return __awaiter(this, void 0, void 0, function* () {
        // sender
        yield (0, Publisher_1.publishUser)(senderId, "REQUEST_SENT_CONFIRMATION", { requestId, groupId, receiverId, receiverName, status: "PENDING" });
        console.log("Sender Id: ", senderId);
        // receiver
        console.log("Receiver Id: ", receiverId);
        yield (0, Publisher_1.publishUser)(receiverId, "RECEIVE_REQUEST", { requestId, groupId, senderId, senderName, status: "PENDING" });
    });
}
exports.groupJoinRequest = groupJoinRequest;
function joinGroup(userId, groupId, groupName) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("1");
        const userGroupsKey = `user:${userId}`;
        console.log("2");
        const randomUserId = (0, RandomIdGenerator_1.randomIdRenerator)(10);
        console.log("3");
        yield RedisClient_1.UserManagerRedisClient.hSet(userGroupsKey, groupId, randomUserId);
        console.log("4");
        yield (0, Subscriber_1.subscribe)(groupId, userId);
        console.log("5");
        yield (0, Publisher_1.publishUser)(userId, "JOIN_GROUP", { randomUserId, id: groupId, groupName });
        console.log("6");
    });
}
exports.joinGroup = joinGroup;
function leaveGroup(userId, groupId) {
    return __awaiter(this, void 0, void 0, function* () {
        const userGroupsKey = `user:${userId}`;
        yield RedisClient_1.UserManagerRedisClient.hDel(userGroupsKey, String(groupId));
        yield (0, Subscriber_1.unsubscribe)(groupId, userId);
        yield (0, Publisher_1.publishUser)(userId, "LEAVE_GROUP_CONFIRMATION", { id: groupId });
    });
}
exports.leaveGroup = leaveGroup;
