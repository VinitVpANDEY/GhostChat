"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Secret key for JWT signing and verification
const JWT_SECRET = 'your_secret_key';
// Define the WebSocket server
const wss = new ws_1.WebSocketServer({ port: 8080 });
// Function to verify JWT token
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (err) {
        console.error('Invalid Token:', err.message);
        return null;
    }
}
// WebSocket connection handler
wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            // Authentication phase
            if (data.type === 'auth') {
                const decoded = verifyToken(data.token);
                if (decoded) {
                    ws.userId = decoded.userId; // Attach userId to the WebSocket session
                    console.log(`Authenticated userId: ${ws.userId}`);
                    ws.send(JSON.stringify({ type: 'auth_success', message: 'Authentication successful' }));
                }
                else {
                    ws.close(1008, 'Unauthorized');
                }
                return;
            }
            // Handle subsequent messages after authentication
            if (ws.userId) {
                if (data.type === 'action') {
                    console.log(`Received action from userId ${ws.userId}:`, data.payload);
                    ws.send(JSON.stringify({ type: 'action_response', message: 'Action processed' }));
                }
                else {
                    ws.send(JSON.stringify({ type: 'error', message: 'Unknown request type' }));
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
    });
});
console.log('WebSocket server running on ws://localhost:8080');
