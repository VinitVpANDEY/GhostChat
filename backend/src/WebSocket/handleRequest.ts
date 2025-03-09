import { publishUser } from "./Publisher";
import { randomIdRenerator } from "./RandomIdGenerator";
import { UserManagerRedisClient } from "./RedisClient";
import { subscribe, unsubscribe } from "./Subscriber";


export async function groupJoinRequest(requestId: number, groupId: number, senderId: string, senderName: string, receiverId: string, receiverName: string) {
    // sender
    await publishUser(senderId, "REQUEST_SENT_CONFIRMATION", { requestId, groupId, receiverId, receiverName, status: "PENDING" });
    console.log("Sender Id: ", senderId);
    // receiver
    console.log("Receiver Id: ", receiverId);
    await publishUser(receiverId, "RECEIVE_REQUEST", { requestId, groupId, senderId, senderName, status: "PENDING" });
}


export async function joinGroup(userId: string, groupId: string, groupName: string) {
    console.log("1");
    const userGroupsKey = `user:${userId}`;
    console.log("2");
    const randomUserId = randomIdRenerator(10);
    console.log("3");
    await UserManagerRedisClient.hSet(userGroupsKey, groupId, randomUserId);
    console.log("4");
    await subscribe(groupId, userId);
    console.log("5");
    await publishUser(userId, "JOIN_GROUP", { randomUserId, id: groupId, groupName });
    console.log("6");
}


export async function leaveGroup(userId: string, groupId: string) {
    const userGroupsKey = `user:${userId}`;
    await UserManagerRedisClient.hDel(userGroupsKey, String(groupId));
    await unsubscribe(groupId, userId);
    await publishUser(userId, "LEAVE_GROUP_CONFIRMATION", { id: groupId });
}