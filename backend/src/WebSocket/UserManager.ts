import { UserManagerRedisClient } from "./RedisClient";
import WebSocket from 'ws';
import { randomIdRenerator } from "./RandomIdGenerator";
import { getGroups, getMessagesBatchDB } from "../dbQuery";
import { unsubscribe } from "./Subscriber";
import { publishUser } from "./Publisher";
import socketManager from "./SocketManager";

interface AuthenticatedWebSocket extends WebSocket {
    userId: string;
    userName?: string;
}

export async function addUser(socket: AuthenticatedWebSocket) {
    const userGroupsKey = `user:${socket.userId}`;
    try {
        // db call to fetch all groupId's
        const groupDetails = await getGroups(socket.userId) || [];
        const randomIds: string[] = [];

        if (socketManager.userExists(Number(socket.userId))) {
            socketManager.addSocket(socket);
            console.log(`User ${socket.userId} connected again`);
        }
        else {
            socketManager.addUser(Number(socket.userId));
            socketManager.addSocket(socket);
            for (const group of groupDetails) {
                const randomId = randomIdRenerator(10); // Example: Xh3P9zAlrQ
                randomIds.push(randomId);
                await UserManagerRedisClient.hSet(userGroupsKey, (group.id).toString(), randomId);       // Data Structure: Hashes =>  userId1 : {GROUP_ID1: randomId1, GROUP_ID2: randomId2, GROUP_ID3: randomId3 ...}, userId2 : {GROUP_ID1: randomId1, GROUP_ID3: randomId3 ...}, ...
            }
            console.log(`User ${socket.userId} connected`);
        }

        // Once you have added user
        const userGroupDetails = groupDetails.map((obj, index) => ({
            ...obj,
            randomUserId: randomIds[index],
        }));

        // sending list of groups user is member of
        await publishUser(socket.userId, "INTIALIZE_USER_GROUP", userGroupDetails);

        // db call to fetch messages from each group and send it to user
        for (const group of groupDetails) {
            const messages = await getMessagesBatchDB(Number(group.id), 20, new Date());
            await publishUser(socket.userId, "INTIALIZE_MESSAGE", messages);
        }

    } catch (error) {
        console.error(`Error adding user to group: ${(error as Error).message}`);
    }
}

export async function removeWebSocketConnection(socket: AuthenticatedWebSocket) {

    try {
        socketManager.removeSocket(socket);

        const sockets = socketManager.getSockets(Number(socket.userId));
        // No active connection for the user
        if (sockets.size === 0) {
            const userGroupsKey = `user:${socket.userId}`;
            const exists = await UserManagerRedisClient.exists(userGroupsKey);
            if (exists) {
                await UserManagerRedisClient.del(userGroupsKey);

                //Unsubcribe to all channel (groups)
                const groupIds = await getGroups(socket.userId) || [];
                for (const groupId of groupIds) {
                    await unsubscribe(groupId.toString(), socket.userId);
                }
            }
        }

        console.log(`User ${socket.userId} has been disconnected.`);
    } catch (error) {
        console.error(`Error disconnecting user: ${(error as Error).message}`);
    }
}




