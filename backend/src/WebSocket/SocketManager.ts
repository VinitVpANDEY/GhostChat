import WebSocket from "ws";

interface AuthenticatedWebSocket extends WebSocket {
  userId: string;
  userName?: string;
}

class SocketManager {
    private static instance: SocketManager;
    private userSockets: Map<number, Set<AuthenticatedWebSocket>>;   // userId => ws1, ws2, ...

    private constructor() {
        this.userSockets = new Map<number, Set<AuthenticatedWebSocket>>();
    }

  
    public static getInstance(): SocketManager {
        if (!SocketManager.instance) {
            SocketManager.instance = new SocketManager();
        }
        return SocketManager.instance;
    }

    public userExists(userId: number){
        return this.userSockets.has(userId)
    }

    public addUser(userId: number) {
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
    }

    public addSocket(socket: AuthenticatedWebSocket){
        const userId = socket.userId;
        this.addUser(Number(userId)); // Ensure the user exists
        const sockets = this.userSockets.get(Number(userId));
        if(sockets) sockets.add(socket);
    }

    
    public removeSocket(socket: AuthenticatedWebSocket){
        const userId = socket.userId;
        const sockets = this.userSockets.get(Number(userId));
        if (sockets) {
            sockets.delete(socket);
            if (sockets.size === 0) {
                this.userSockets.delete(Number(userId)); // Remove user if no sockets remain
            }
        }
    }

    public removeUser(userId: number) {
        this.userSockets.delete(userId);
    }


    public getSockets(userId: number) {
        return this.userSockets.get(userId) || new Set();
    }

    public getAllSockets() {
        return this.userSockets;
    }
    
}

// Singleton instance
const socketManager = SocketManager.getInstance();

export default socketManager;
