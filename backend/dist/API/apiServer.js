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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const asyncHandler_1 = require("./utils/asyncHandler");
const prismaClient_1 = require("../prismaClient");
const AuthSchema_1 = require("./types/AuthSchema");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware_1 = require("./authMiddleware");
const LastReadSchema_1 = require("./types/LastReadSchema");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
}));
app.post("/api/auth/signup", (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = AuthSchema_1.signupSchema.parse(req.body);
    const userExists = yield prismaClient_1.db.user.findUnique({ where: { email } });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }
    const salt = yield bcrypt_1.default.genSalt(10);
    const hashedPassword = yield bcrypt_1.default.hash(password, salt);
    const user = yield prismaClient_1.db.user.create({
        data: {
            username: name,
            email,
            password: hashedPassword,
        }
    });
    res.status(201).json({ user });
})));
app.post("/api/auth/signin", (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = AuthSchema_1.signinSchema.parse(req.body);
    const user = yield prismaClient_1.db.user.findUnique({ where: { email } });
    if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = yield bcrypt_1.default.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }
    const userId = user.id;
    const token = jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
})));
app.get("/api/users", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { search = "", page = 1, limit = 15 } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 15;
    const skip = (pageNumber - 1) * pageSize;
    try {
        const users = yield prismaClient_1.db.user.findMany({
            where: {
                username: {
                    contains: search,
                    mode: "insensitive",
                },
            },
            skip,
            take: pageSize,
            select: {
                id: true,
                username: true,
            }
        });
        const updatedUsers = users.filter((user) => user.id !== userId);
        res.status(200).json(updatedUsers);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
})));
app.get("/api/requests", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.userId;
    try {
        const requestReceived = yield prismaClient_1.db.user.findUnique({
            where: {
                id,
            },
            select: {
                groupRequestReceived: {
                    where: {
                        status: "PENDING",
                    },
                    select: {
                        inviter: {
                            select: {
                                id: true,
                                username: true,
                            }
                        },
                        groupId: true,
                        id: true,
                        status: true,
                    }
                }
            }
        });
        const requestSent = yield prismaClient_1.db.user.findUnique({
            where: {
                id,
            },
            select: {
                groupRequestSent: {
                    where: {
                        status: "PENDING",
                    },
                    select: {
                        invitee: {
                            select: {
                                id: true,
                                username: true,
                            }
                        },
                        groupId: true,
                        id: true,
                        status: true,
                    }
                }
            }
        });
        const updatedRequestReceived = requestReceived === null || requestReceived === void 0 ? void 0 : requestReceived.groupRequestReceived.map((req) => ({ requestId: req.id, groupId: req.groupId, userId: req.inviter.id, username: req.inviter.username, status: req.status }));
        const updatedRequestSent = requestSent === null || requestSent === void 0 ? void 0 : requestSent.groupRequestSent.map((req) => ({ requestId: req.id, groupId: req.groupId, userId: req.invitee.id, username: req.invitee.username, status: req.status }));
        const requests = { requestReceived: updatedRequestReceived, requestSent: updatedRequestSent };
        res.status(200).json(requests);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch requests" });
    }
})));
app.get("/api/group", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.query;
    try {
        const group = yield prismaClient_1.db.group.findUnique({
            where: {
                id: Number(id),
            },
            select: {
                users: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                            }
                        }
                    }
                },
                groupSize: true,
                name: true,
                createdAt: true,
            }
        });
        const members = group === null || group === void 0 ? void 0 : group.users.map((u) => ({ id: u.user.id, username: u.user.username }));
        res.status(200).json({ name: group === null || group === void 0 ? void 0 : group.name, members, size: group === null || group === void 0 ? void 0 : group.groupSize, createdAt: group === null || group === void 0 ? void 0 : group.createdAt });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch group" });
    }
})));
app.get("/api/profile", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.userId;
    try {
        const user = yield prismaClient_1.db.user.findUnique({
            where: {
                id: Number(id),
            },
            select: {
                username: true,
                email: true,
                notificationPermission: true,
                theme: true,
            }
        });
        res.status(200).json(user);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch group" });
    }
})));
app.get("/api/messages", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.userId;
    const { groupId, page } = req.query;
    if (!groupId || !page) {
        return res.status(400).json({ error: "Group ID and page number are required." });
    }
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = 15;
    const skip = (pageNumber - 1) * pageSize;
    try {
        // Find the user's join date for the group
        const userGroup = yield prismaClient_1.db.usersInGroup.findFirst({
            where: {
                userId: Number(id),
                groupId: Number(groupId),
            }
        });
        if (!userGroup) {
            return res.status(404).json({ error: "User is not part of this group." });
        }
        const joinDate = userGroup.joinedAt;
        // Fetch messages sent after the join date
        const messages = yield prismaClient_1.db.message.findMany({
            where: {
                groupId: Number(groupId),
                createdAt: {
                    gte: joinDate, // Messages sent after or on the join date
                },
            },
            orderBy: {
                createdAt: 'desc', // Newest messages first
            },
            skip: skip, // Number of messages to skip for pagination
            take: pageSize, // Limit to the batch size
            select: {
                content: true,
                sender: true,
                createdAt: true,
                groupId: true,
                type: true,
                taggedBy: true,
                taggedMessages: true,
            }
        });
        const updatedMessage = messages.map((msg) => ({ groupId: msg.groupId.toString(), randomUserId: msg.sender, message: msg.content, timeStamp: msg.createdAt, isReceived: true, type: msg.type, taggedBy: msg.taggedBy, taggedMessage: msg.taggedMessages }));
        return res.json(updatedMessage);
    }
    catch (error) {
        console.error("Error fetching messages:", error);
        return res.status(500).json({ error: "Failed to fetch messages." });
    }
})));
app.post("/api/updateLastRead", authMiddleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.userId;
    const { gId, end } = LastReadSchema_1.lastReadSchema.parse(req.body);
    console.log(gId);
    console.log(end);
    if (!gId || !end) {
        return res.status(400).json({ error: "Group ID and time are required." });
    }
    try {
        yield prismaClient_1.db.usersInGroup.update({
            where: {
                userId_groupId: {
                    userId: Number(id),
                    groupId: Number(gId),
                },
            },
            data: {
                lastRead: new Date(Number(end)),
            }
        });
        console.log("Update successfull");
        res.status(200);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update last read" });
    }
})));
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    if (err.name === 'ZodError') {
        res.status(400).json({ message: err.errors.map((error) => error.message) });
        return; // End the request-response cycle
    }
    res.status(500).json({
        message: 'Internal Server Error',
    });
    return; // End the request-response cycle
};
app.use(errorHandler);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
