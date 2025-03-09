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
exports.getUserDB = exports.addMessageDB = exports.getGroupDB = exports.getUsersDB = exports.getMessagesBatchDB = exports.updateRequestStatusDB = exports.inviteFriendDB = exports.getGroups = exports.leaveGroupDB = exports.joinGroupDB = exports.createGroupDB = void 0;
const prismaClient_1 = require("./prismaClient");
function createGroupDB(userId, name) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const group = yield prismaClient_1.db.group.create({
                data: {
                    name,
                    groupSize: 1,
                }
            });
            yield prismaClient_1.db.usersInGroup.create({
                data: {
                    userId: Number(userId),
                    groupId: group.id
                }
            });
            return group;
        }
        catch (error) {
            console.error("Error creating group:", error);
        }
    });
}
exports.createGroupDB = createGroupDB;
function joinGroupDB(userId, groupId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const existingMembership = yield prismaClient_1.db.usersInGroup.findUnique({
                where: {
                    userId_groupId: { userId: Number(userId), groupId: Number(groupId) }, // Use the composite unique constraint
                },
            });
            if (existingMembership) {
                console.log("User is already a member of this group.");
                return; // Exit early if the user is already in the group
            }
            yield prismaClient_1.db.$transaction([
                // Add the user to the group
                prismaClient_1.db.usersInGroup.create({
                    data: {
                        userId: Number(userId),
                        groupId: Number(groupId),
                    },
                }),
                // Increment the group size
                prismaClient_1.db.group.update({
                    where: {
                        id: Number(groupId),
                    },
                    data: {
                        groupSize: { increment: 1 }, // Increment size by 1
                    },
                }),
            ]);
            console.log("User added and group size updated.");
        }
        catch (error) {
            console.error("Error adding record:", error);
        }
    });
}
exports.joinGroupDB = joinGroupDB;
function leaveGroupDB(userId, groupId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prismaClient_1.db.$transaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                // Remove the user from the group
                yield transaction.usersInGroup.delete({
                    where: {
                        userId_groupId: {
                            userId: Number(userId),
                            groupId: Number(groupId),
                        },
                    },
                });
                // Remove all pending request send by this user on this group
                yield transaction.groupInvite.deleteMany({
                    where: {
                        inviterId: Number(userId),
                        groupId: Number(groupId),
                        status: "PENDING",
                    }
                });
                // Fetch the updated group size
                const group = yield transaction.group.update({
                    where: {
                        id: Number(groupId)
                    },
                    data: {
                        groupSize: { decrement: 1 }, // Decrement size by 1
                    },
                    select: {
                        groupSize: true, // Get the updated size
                    },
                });
                // If group size is 0, delete the group
                if (group.groupSize === 0) {
                    yield transaction.group.delete({
                        where: { id: Number(groupId) },
                    });
                    console.log("Group deleted as no members remained.");
                }
                else {
                    console.log("User removed, and group size updated.");
                }
                // TODO : Remove these front end in realtime
                yield transaction.groupInvite.deleteMany({
                    where: {
                        groupId: Number(groupId),
                        OR: [
                            { inviterId: Number(userId) },
                            { inviteeId: Number(userId) },
                        ],
                    }
                });
            }));
        }
        catch (error) {
            console.error("Error removing user from group:", error);
        }
    });
}
exports.leaveGroupDB = leaveGroupDB;
function getGroups(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const groups = yield prismaClient_1.db.usersInGroup.findMany({
                where: {
                    userId: Number(userId),
                },
                select: {
                    lastRead: true,
                    group: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            });
            const updatedGroups = (yield Promise.all(groups.map((groupDetails) => __awaiter(this, void 0, void 0, function* () {
                return ({
                    id: groupDetails.group.id,
                    groupName: groupDetails.group.name,
                    count: yield prismaClient_1.db.message.count({
                        where: {
                            groupId: groupDetails.group.id,
                            createdAt: {
                                gte: groupDetails.lastRead,
                            },
                        },
                    }),
                });
            })))) || [];
            return updatedGroups;
        }
        catch (error) {
            console.error("Error fetching groups", error);
        }
    });
}
exports.getGroups = getGroups;
function inviteFriendDB(senderId, receiverId, groupId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const request = yield prismaClient_1.db.groupInvite.findFirst({
                where: {
                    groupId: Number(groupId),
                    inviteeId: Number(receiverId),
                    OR: [
                        { status: "ACCEPTED" },
                        { status: "PENDING" }
                    ]
                }
            });
            if (!request) {
                const inviteRequest = prismaClient_1.db.groupInvite.create({
                    data: {
                        groupId: Number(groupId),
                        inviterId: Number(senderId),
                        inviteeId: Number(receiverId),
                    }
                });
                console.log("Request sent successfully.");
                return inviteRequest;
            }
            else {
                console.log("Request already sent earlier");
                return;
            }
        }
        catch (error) {
            console.error("Error sending request", error);
        }
    });
}
exports.inviteFriendDB = inviteFriendDB;
function updateRequestStatusDB(requestId, status) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Updating request status");
            const id = parseInt(requestId, 10);
            const req = yield prismaClient_1.db.groupInvite.update({
                where: {
                    id,
                },
                data: {
                    status,
                }
            });
            console.log(req);
        }
        catch (error) {
            console.error("Error updating status", error);
        }
    });
}
exports.updateRequestStatusDB = updateRequestStatusDB;
function getMessagesBatchDB(groupId, batchSize, beforeTimestamp) {
    return __awaiter(this, void 0, void 0, function* () {
        const messages = yield prismaClient_1.db.message.findMany({
            where: {
                groupId,
                createdAt: {
                    lt: beforeTimestamp, // Fetch messages before the given timestamp
                },
            },
            orderBy: {
                createdAt: 'desc', // Order by creation date descending
            },
            take: batchSize, // Limit the number of messages fetched
        });
        return messages;
    });
}
exports.getMessagesBatchDB = getMessagesBatchDB;
function getUsersDB(search, page) {
    return __awaiter(this, void 0, void 0, function* () {
        const take = 15;
        const skip = (parseInt(page, 10) - 1) * take;
        try {
            const users = yield prismaClient_1.db.user.findMany({
                where: {
                    username: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                skip,
                take,
                select: {
                    id: true,
                    username: true,
                },
            });
            const total = yield prismaClient_1.db.user.count({
                where: {
                    username: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            });
            return { users, total, page: parseInt(page, 10), limit: take };
        }
        catch (error) {
            console.error("Error fetching users", error);
        }
    });
}
exports.getUsersDB = getUsersDB;
function getGroupDB(groupId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const group = yield prismaClient_1.db.group.findUnique({
                where: {
                    id: Number(groupId),
                },
                select: {
                    name: true,
                }
            });
            return group === null || group === void 0 ? void 0 : group.name;
        }
        catch (error) {
            console.error("Error fetching group", error);
        }
    });
}
exports.getGroupDB = getGroupDB;
function addMessageDB(groupId, sender, message, createdAt, type, taggedBy, taggedMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prismaClient_1.db.message.create({
                data: {
                    content: message,
                    createdAt,
                    sender,
                    groupId: Number(groupId),
                    type,
                    taggedBy,
                    taggedMessages: taggedMessage,
                }
            });
        }
        catch (error) {
            console.error("Error adding message", error);
        }
    });
}
exports.addMessageDB = addMessageDB;
function getUserDB(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield prismaClient_1.db.user.findUnique({
                where: {
                    id: Number(id),
                },
                select: {
                    username: true,
                }
            });
            return user === null || user === void 0 ? void 0 : user.username;
        }
        catch (error) {
            console.error("Error fetching user", error);
        }
    });
}
exports.getUserDB = getUserDB;
