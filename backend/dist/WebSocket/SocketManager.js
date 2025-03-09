"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SocketManager {
    constructor() {
        this.userSockets = new Map();
    }
    static getInstance() {
        if (!SocketManager.instance) {
            SocketManager.instance = new SocketManager();
        }
        return SocketManager.instance;
    }
    userExists(userId) {
        return this.userSockets.has(userId);
    }
    addUser(userId) {
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
    }
    addSocket(socket) {
        const userId = socket.userId;
        this.addUser(Number(userId)); // Ensure the user exists
        const sockets = this.userSockets.get(Number(userId));
        if (sockets)
            sockets.add(socket);
    }
    removeSocket(socket) {
        const userId = socket.userId;
        const sockets = this.userSockets.get(Number(userId));
        if (sockets) {
            sockets.delete(socket);
            if (sockets.size === 0) {
                this.userSockets.delete(Number(userId)); // Remove user if no sockets remain
            }
        }
    }
    removeUser(userId) {
        this.userSockets.delete(userId);
    }
    getSockets(userId) {
        return this.userSockets.get(userId) || new Set();
    }
    getAllSockets() {
        return this.userSockets;
    }
}
// Singleton instance
const socketManager = SocketManager.getInstance();
exports.default = socketManager;
