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
const ws_1 = require("ws");
const RedisClient_1 = require("./RedisClient");
const UserManager_1 = require("./UserManager");
const handleRequest_1 = require("./handleRequest");
const Publisher_1 = require("./Publisher");
const dbQuery_1 = require("../dbQuery");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const prismaClient_1 = require("../prismaClient");
const SocketManager_1 = __importDefault(require("./SocketManager"));
const polling_1 = require("./polling");
dotenv_1.default.config();
function startRedis() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield RedisClient_1.UserManagerRedisClient.connect();
            yield RedisClient_1.ChannelManagerRedisClient.connect();
            yield RedisClient_1.MessageManagerRedisClient.connect();
            yield (0, polling_1.startPolling)();
            console.log("Connected to Redis");
        }
        catch (error) {
            console.error("Failed to connect to Redis", error);
        }
    });
}
startRedis();
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    }
    catch (err) {
        console.error('Invalid Token:', err.message);
        return null;
    }
}
const wss = new ws_1.WebSocketServer({ port: 8080 });
function startWebSocketServer() {
    wss.on('connection', function connection(ws) {
        return __awaiter(this, void 0, void 0, function* () {
            ws.on('error', console.error);
            ws.on('message', (data) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const message = JSON.parse(data.toString());
                    // Authentication phase
                    if (message.type === 'AUTH') {
                        const decoded = verifyToken(message.payload.token);
                        if (decoded) {
                            ws.userId = decoded.userId; // Attach userId to the WebSocket session
                            const user = yield prismaClient_1.db.user.findUnique({
                                where: {
                                    id: Number(ws.userId)
                                },
                                select: {
                                    username: true
                                }
                            });
                            ws.userName = user === null || user === void 0 ? void 0 : user.username;
                            console.log(`Authenticated userId: ${ws.userId}`);
                            yield (0, UserManager_1.addUser)(ws);
                            console.log(`Added userId: ${ws.userId}`);
                        }
                        else {
                            ws.close(1008, 'Unauthorized');
                        }
                        return;
                    }
                    // Handle subsequent messages after authentication
                    if (ws.userId && ws.userName) {
                        if (message.type === 'CREATE_GROUP') {
                            const groupName = message.payload.groupName;
                            const receivers = message.payload.receivers;
                            const group = yield (0, dbQuery_1.createGroupDB)(ws.userId, message.payload.groupName);
                            if (group) {
                                const groupId = (group.id).toString();
                                yield (0, handleRequest_1.joinGroup)(ws.userId, groupId, groupName);
                                for (const receiver of receivers) {
                                    const receiverId = (receiver.id).toString();
                                    const request = yield (0, dbQuery_1.inviteFriendDB)(ws.userId, receiverId, groupId);
                                    const exists = SocketManager_1.default.userExists(Number(receiverId));
                                    const socket = SocketManager_1.default.getSockets(Number(receiverId));
                                    if (request)
                                        yield (0, handleRequest_1.groupJoinRequest)(request.id, request.groupId, ws.userId, ws.userName, receiverId, receiver.username);
                                    else
                                        yield (0, Publisher_1.publishUser)(ws.userId, "REQUEST_FAILED", { msg: "Request is already sent by some other member of the group" });
                                }
                            }
                        }
                        else if (message.type === 'INVITE_FRIENDS') {
                            for (const receiver of message.payload.receivers) {
                                const request = yield (0, dbQuery_1.inviteFriendDB)(ws.userId, receiver.id, message.payload.groupId);
                                if (request)
                                    yield (0, handleRequest_1.groupJoinRequest)(request.id, request.groupId, ws.userId, ws.userName, receiver.id, receiver.name);
                                else
                                    yield (0, Publisher_1.publishUser)(ws.userId, "REQUEST_FAILED", { msg: "Request is already sent by some other member of the group" });
                            }
                        }
                        else if (message.type === 'ACCEPT_REQUEST') { // JOIN_GROUP
                            console.log("Request Accepted INTIALISED");
                            const groupName = yield (0, dbQuery_1.getGroupDB)(message.payload.groupId);
                            if (groupName) {
                                yield (0, handleRequest_1.joinGroup)(ws.userId, message.payload.groupId, groupName);
                                yield (0, dbQuery_1.joinGroupDB)(ws.userId, message.payload.groupId);
                                console.log("Updating DB");
                                console.log(message.payload.requestId);
                                yield (0, dbQuery_1.updateRequestStatusDB)(message.payload.requestId, "ACCEPTED");
                                // update status on both side in real-time
                                yield (0, Publisher_1.publishUser)(message.payload.senderId, "REQUEST_ACCEPTED", { requestId: message.payload.requestId, status: "ACCEPTED" });
                                yield (0, Publisher_1.publishUser)(ws.userId, "REQUEST_ACCEPTED", { requestId: message.payload.requestId, status: "ACCEPTED" });
                                const user = yield (0, dbQuery_1.getUserDB)(ws.userId);
                                yield (0, Publisher_1.publishMessage)(message.payload.groupId, "XXXXXXXXXX", `${user} joined group`, "notification");
                            }
                            console.log("Request Accepted COMPLETED");
                        }
                        else if (message.type === 'DECLINE_REQUEST') {
                            yield (0, dbQuery_1.updateRequestStatusDB)(message.payload.requestId, "DECLINED");
                            // update status on both side in real-time
                            yield (0, Publisher_1.publishUser)(message.payload.senderId, "REQUEST_REJECTED", { requestId: message.payload.requestId, status: "DECLINED" });
                            yield (0, Publisher_1.publishUser)(ws.userId, "REQUEST_REJECTED", { requestId: message.payload.requestId, status: "DECLINED" });
                        }
                        else if (message.type === 'LEAVE_GROUP') {
                            yield (0, handleRequest_1.leaveGroup)(ws.userId, message.payload.groupId);
                            yield (0, dbQuery_1.leaveGroupDB)(ws.userId, message.payload.groupId);
                            const user = yield (0, dbQuery_1.getUserDB)(ws.userId);
                            yield (0, Publisher_1.publishMessage)(message.payload.groupId, "XXXXXXXXXX", `${user} left group`, "notification");
                        }
                        else if (message.type === 'SEND_MESSAGE') {
                            yield (0, Publisher_1.publishMessage)(message.payload.groupId, message.payload.randomId, message.payload.msg, message.payload.type, message.payload.taggedBy, message.payload.taggedMessage);
                        }
                    }
                    else {
                        ws.close(1008, 'Unauthorized');
                    }
                }
                catch (err) {
                    console.error('Error handling message:', err.message);
                    ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
                }
            }));
            ws.on('close', () => __awaiter(this, void 0, void 0, function* () {
                console.log(`User disconnected`);
                yield (0, UserManager_1.removeWebSocketConnection)(ws);
            }));
            ws.send('Connected');
        });
    });
}
startWebSocketServer();
