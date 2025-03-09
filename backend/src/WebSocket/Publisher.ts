import { MessageManagerRedisClient } from "./RedisClient";
import { getSubscribers } from "./Subscriber";
import socketManager from "./SocketManager";
import WebSocket from 'ws';

export async function publishMessage(groupId: string, randomUserId: string, message: string,  type: string, taggedBy?: string, taggedMessage?: string) {
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
    await MessageManagerRedisClient.lPush('messages', JSON.stringify(payload));
    console.log(`RandomUserId: ${randomUserId}`);
    // Publish to all subscribers
    const subscribers = await getSubscribers(groupId);  // list of userId
    if (subscribers.length === 0) {
        console.log(`No subscribers for channel ${groupId}`);
        return;
    }
    
    for (const userId of subscribers) {
        await publishUser(userId, "PUBLISH_MESSAGE", payload);
    }
    console.log(`Message sent to all subscribers of ${groupId}`);
}

export async function publishUser(userId: string, type: string, payload: any){
    const sockets = socketManager.getSockets(Number(userId));
    console.log(`sockets: ${userId}: ${sockets.size}`);
    for (const socket of sockets) {
        if (socket.readyState === WebSocket.OPEN) {
            console.log(`Publishing to user ${userId}: ${type}`)
            socket.send(
                JSON.stringify({
                    type,
                    payload,
                })
            )
        }
    }
}



