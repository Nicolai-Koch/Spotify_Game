import React, { createContext, useState, useEffect } from 'react';

// Create the WebSocket context
export const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let ws = new WebSocket('wss://spotifygame.dk/ws');
    setSocket(ws);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);

      // Start a heartbeat to keep the connection alive
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000); // Send a ping every 30 seconds

      return () => clearInterval(heartbeat);
    };

    ws.onclose = (event) => {
      console.log("WebSocket disconnected", event.code, event.reason);
      setIsConnected(false);

      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        console.log("Attempting to reconnect...");
        ws = new WebSocket('wss://spotifygame.dk/ws');
        setSocket(ws);
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error.message);
    };

    ws.onmessage = (event) => {
      console.log("WebSocket message received:", event.data);
    };

    return () => {
      console.log("Cleaning up WebSocket connection");
      ws.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};
