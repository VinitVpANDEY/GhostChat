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
exports.publishUser = exports.publishMessage = void 0;
const RedisClient_1 = require("./RedisClient");
const Subscriber_1 = require("./Subscriber");
const SocketManager_1 = __importDefault(require("./SocketManager"));
const ws_1 = __importDefault(require("ws"));
function publishMessage(groupId, randomUserId, message, type, taggedBy, taggedMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        //Add to message queue
        const payload = {
            groupId,
            randomUserId,
            message,
            timeStamp: new Date(),
            type,
            taggedBy,
            taggedMessage,
        };
        yield RedisClient_1.MessageManagerRedisClient.lPush('messages', JSON.stringify(payload));
        console.log(`RandomUserId: ${randomUserId}`);
        // Publish to all subscribers
        const subscribers = yield (0, Subscriber_1.getSubscribers)(groupId); // list of userId
        if (subscribers.length === 0) {
            console.log(`No subscribers for channel ${groupId}`);
            return;
        }
        for (const userId of subscribers) {
            yield publishUser(userId, "PUBLISH_MESSAGE", payload);
        }
        console.log(`Message sent to all subscribers of ${groupId}`);
    });
}
exports.publishMessage = publishMessage;
function publishUser(userId, type, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const sockets = SocketManager_1.default.getSockets(Number(userId));
        console.log(`sockets: ${userId}: ${sockets.size}`);
        for (const socket of sockets) {
            if (socket.readyState === ws_1.default.OPEN) {
                console.log(`Publishing to user ${userId}: ${type}`);
                socket.send(JSON.stringify({
                    type,
                    payload,
                }));
            }
        }
    });
}
exports.publishUser = publishUser;
