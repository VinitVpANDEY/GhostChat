import WebSocket, { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';

// Secret key for JWT signing and verification
const JWT_SECRET = 'your_secret_key';

// Extend WebSocket to include userId
interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
}

// Define the WebSocket server
const wss = new WebSocketServer({ port: 8080 });

// Function to verify JWT token
function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch (err: any) {
    console.error('Invalid Token:', err.message);
    return null;
  }
}

// WebSocket connection handler
wss.on('connection', (ws: AuthenticatedWebSocket) => {
  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message);

      // Authentication phase
      if (data.type === 'auth') {
        const decoded = verifyToken(data.token);
        if (decoded) {
          ws.userId = decoded.userId; // Attach userId to the WebSocket session
          console.log(`Authenticated userId: ${ws.userId}`);
          ws.send(JSON.stringify({ type: 'auth_success', message: 'Authentication successful' }));
        } else {
          ws.close(1008, 'Unauthorized');
        }
        return;
      }

      // Handle subsequent messages after authentication
      if (ws.userId) {
        if (data.type === 'action') {
          console.log(`Received action from userId ${ws.userId}:`, data.payload);
          ws.send(JSON.stringify({ type: 'action_response', message: 'Action processed' }));
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Unknown request type' }));
        }
      } else {
        ws.close(1008, 'Unauthorized');
      }
    } catch (err: any) {
      console.error('Error handling message:', err.message);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });
});

console.log('WebSocket server running on ws://localhost:8080');