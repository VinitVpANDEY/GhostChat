import WebSocket, { WebSocketServer } from 'ws';
import * as url from 'url';
import { UserManagerRedisClient, ChannelManagerRedisClient, MessageManagerRedisClient } from "./RedisClient";
import { addUser, removeWebSocketConnection } from "./UserManager";
import { groupJoinRequest, joinGroup, leaveGroup } from './handleRequest';
import { publishMessage, publishUser } from './Publisher';
import { createGroupDB, getGroupDB, getUserDB, getUsersDB, inviteFriendDB, joinGroupDB, leaveGroupDB, updateRequestStatusDB } from '../dbQuery';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { db } from '../prismaClient';
import socketManager from './SocketManager';
import { startPolling } from './polling';
import { get } from 'http';

dotenv.config();

async function startRedis() {
  try {
    await UserManagerRedisClient.connect();
    await ChannelManagerRedisClient.connect();
    await MessageManagerRedisClient.connect();
    await startPolling();
    console.log("Connected to Redis");
  } catch (error) {
    console.error("Failed to connect to Redis", error);
  }
}

startRedis();

// Extend WebSocket to include userId
interface AuthenticatedWebSocket extends WebSocket {
  userId: string;
  userName?: string;
}

interface User {
  id: number;
  username: string;
}

function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
  } catch (err: any) {
    console.error('Invalid Token:', err.message);
    return null;
  }
}

const wss = new WebSocketServer({ port: 8080 });

function startWebSocketServer() {
  wss.on('connection', async function connection(ws: AuthenticatedWebSocket) {
    ws.on('error', console.error);

    ws.on('message', async (data: any) => {
      try {
        const message = JSON.parse(data.toString());

        // Authentication phase
        if (message.type === 'AUTH') {
          const decoded = verifyToken(message.payload.token);
          if (decoded) {
            ws.userId = decoded.userId; // Attach userId to the WebSocket session
            const user = await db.user.findUnique({
              where: {
                id: Number(ws.userId)
              },
              select: {
                username: true
              }
            })
            ws.userName = user?.username;
            console.log(`Authenticated userId: ${ws.userId}`);
            await addUser(ws);
            console.log(`Added userId: ${ws.userId}`);
          } else {
            ws.close(1008, 'Unauthorized');
          }
          return;
        }

        // Handle subsequent messages after authentication
        if (ws.userId && ws.userName) {
          if (message.type === 'CREATE_GROUP') {
            const groupName = message.payload.groupName as string;
            const receivers = message.payload.receivers as User[];
            const group = await createGroupDB(ws.userId, message.payload.groupName);
            if (group) {
              const groupId = (group.id).toString();
              await joinGroup(ws.userId, groupId, groupName);    
              for (const receiver of receivers) {
                const receiverId = (receiver.id).toString();
                const request = await inviteFriendDB(ws.userId, receiverId, groupId);
                const exists = socketManager.userExists(Number(receiverId));
                const socket  = socketManager.getSockets(Number(receiverId));
                if (request) await groupJoinRequest(request.id, request.groupId, ws.userId, ws.userName, receiverId, receiver.username);
                else await publishUser(ws.userId, "REQUEST_FAILED", { msg: "Request is already sent by some other member of the group" });
              }
            }
          }
        else if (message.type === 'INVITE_FRIENDS') {
          for (const receiver of message.payload.receivers) {
            const request = await inviteFriendDB(ws.userId, receiver.id, message.payload.groupId);
            if (request) await groupJoinRequest(request.id, request.groupId, ws.userId, ws.userName, receiver.id, receiver.name);
            else await publishUser(ws.userId, "REQUEST_FAILED", { msg: "Request is already sent by some other member of the group" });
          }
        }
        else if (message.type === 'ACCEPT_REQUEST') { // JOIN_GROUP
          console.log("Request Accepted INTIALISED");
          const groupName = await getGroupDB(message.payload.groupId);
          if(groupName){
            await joinGroup(ws.userId, message.payload.groupId, groupName);
            await joinGroupDB(ws.userId, message.payload.groupId);
            console.log("Updating DB");
            console.log(message.payload.requestId);
            await updateRequestStatusDB(message.payload.requestId, "ACCEPTED");
            // update status on both side in real-time
            await publishUser(message.payload.senderId, "REQUEST_ACCEPTED", { requestId: message.payload.requestId, status: "ACCEPTED" });
            await publishUser(ws.userId, "REQUEST_ACCEPTED", { requestId: message.payload.requestId, status: "ACCEPTED" });
            const user = await getUserDB(ws.userId);
            await publishMessage(message.payload.groupId, "XXXXXXXXXX",  `${user} joined group`, "notification");
          }
          console.log("Request Accepted COMPLETED");
        }

        else if (message.type === 'DECLINE_REQUEST') {
          await updateRequestStatusDB(message.payload.requestId, "DECLINED");
          // update status on both side in real-time
          await publishUser(message.payload.senderId, "REQUEST_REJECTED", { requestId: message.payload.requestId, status: "DECLINED" });
          await publishUser(ws.userId, "REQUEST_REJECTED", { requestId: message.payload.requestId, status: "DECLINED" });
        }

        else if (message.type === 'LEAVE_GROUP') {
          await leaveGroup(ws.userId, message.payload.groupId);
          await leaveGroupDB(ws.userId, message.payload.groupId);
          const user = await getUserDB(ws.userId);
          await publishMessage(message.payload.groupId, "XXXXXXXXXX",  `${user} left group`, "notification");
        }

        else if (message.type === 'SEND_MESSAGE') {
          await publishMessage(message.payload.groupId, message.payload.randomId, message.payload.msg, message.payload.type, message.payload.taggedBy, message.payload.taggedMessage); 
        }

      } else {
        ws.close(1008, 'Unauthorized');
      }
    } catch (err: any) {
      console.error('Error handling message:', err.message);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', async () => {
    console.log(`User disconnected`);
    await removeWebSocketConnection(ws);
  });

  ws.send('Connected')

});
}

startWebSocketServer();


