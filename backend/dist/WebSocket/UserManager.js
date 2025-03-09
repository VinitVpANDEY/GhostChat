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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeWebSocketConnection = exports.addUser = void 0;
const RedisClient_1 = require("./RedisClient");
const RandomIdGenerator_1 = require("./RandomIdGenerator");
const dbQuery_1 = require("../dbQuery");
const Subscriber_1 = require("./Subscriber");
const Publisher_1 = require("./Publisher");
const SocketManager_1 = __importDefault(require("./SocketManager"));
function addUser(socket) {
    return __awaiter(this, void 0, void 0, function* () {
        const userGroupsKey = `user:${socket.userId}`;
        try {
            // db call to fetch all groupId's
            const groupDetails = (yield (0, dbQuery_1.getGroups)(socket.userId)) || [];
            const randomIds = [];
            if (SocketManager_1.default.userExists(Number(socket.userId))) {
                SocketManager_1.default.addSocket(socket);
                console.log(`User ${socket.userId} connected again`);
            }
            else {
                SocketManager_1.default.addUser(Number(socket.userId));
                SocketManager_1.default.addSocket(socket);
                for (const group of groupDetails) {
                    const randomId = (0, RandomIdGenerator_1.randomIdRenerator)(10); // Example: Xh3P9zAlrQ
                    randomIds.push(randomId);
                    yield RedisClient_1.UserManagerRedisClient.hSet(userGroupsKey, (group.id).toString(), randomId); // Data Structure: Hashes =>  userId1 : {GROUP_ID1: randomId1, GROUP_ID2: randomId2, GROUP_ID3: randomId3 ...}, userId2 : {GROUP_ID1: randomId1, GROUP_ID3: randomId3 ...}, ...
                }
                console.log(`User ${socket.userId} connected`);
            }
            // Once you have added user
            const userGroupDetails = groupDetails.map((obj, index) => (Object.assign(Object.assign({}, obj), { randomUserId: randomIds[index] })));
            // sending list of groups user is member of
            yield (0, Publisher_1.publishUser)(socket.userId, "INTIALIZE_USER_GROUP", userGroupDetails);
            // db call to fetch messages from each group and send it to user
            for (const group of groupDetails) {
                const messages = yield (0, dbQuery_1.getMessagesBatchDB)(Number(group.id), 20, new Date());
                yield (0, Publisher_1.publishUser)(socket.userId, "INTIALIZE_MESSAGE", messages);
            }
        }
        catch (error) {
            console.error(`Error adding user to group: ${error.message}`);
        }
    });
}
exports.addUser = addUser;
function removeWebSocketConnection(socket) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            SocketManager_1.default.removeSocket(socket);
            const sockets = SocketManager_1.default.getSockets(Number(socket.userId));
            // No active connection for the user
            if (sockets.size === 0) {
                const userGroupsKey = `user:${socket.userId}`;
                const exists = yield RedisClient_1.UserManagerRedisClient.exists(userGroupsKey);
                if (exists) {
                    yield RedisClient_1.UserManagerRedisClient.del(userGroupsKey);
                    //Unsubcribe to all channel (groups)
                    const groupIds = (yield (0, dbQuery_1.getGroups)(socket.userId)) || [];
                    for (const groupId of groupIds) {
                        yield (0, Subscriber_1.unsubscribe)(groupId.toString(), socket.userId);
                    }
                }
            }
            console.log(`User ${socket.userId} has been disconnected.`);
        }
        catch (error) {
            console.error(`Error disconnecting user: ${error.message}`);
        }
    });
}
exports.removeWebSocketConnection = removeWebSocketConnection;
