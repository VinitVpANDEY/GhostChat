import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface WebSocketContextProps {
  socket: WebSocket | null;
}

const WebSocketContext = createContext<WebSocketContextProps | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem("token");

      const delay = 2000; // Delay in milliseconds (e.g., 2000ms = 2 seconds)
      const timeout = setTimeout(() => {
        const ws = new WebSocket("ws://localhost:8080");

        ws.onopen = () => {
          console.log("WebSocket connection established");
          ws.send(
            JSON.stringify({
              type: "AUTH",
              payload: {
                token,
              },
            })
          );
          setSocket(ws);
        };

        ws.onclose = () => {
          console.log("WebSocket connection closed");
          setSocket(null);
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setSocket(null);
        };
      }, delay);

      return () => {
        clearTimeout(timeout); // Cleanup the timeout to avoid unnecessary WebSocket creation
        if (socket) {
          socket.close();
        }
      };
    }
  }, [isAuthenticated]);

  return (
    <WebSocketContext.Provider value={{ socket }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context.socket;
};
