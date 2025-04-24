import React, { createContext, useState, useEffect } from 'react';

// Create the WebSocket context
export const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let ws = new WebSocket('wss://spotifygame.dk/ws');
    setSocket(ws);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onclose = (event) => {
      console.log("WebSocket disconnected", event.reason);
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        console.log("Attempting to reconnect...");
        ws = new WebSocket('wss://spotifygame.dk/ws');
        setSocket(ws);
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={socket}>
      {children}
    </WebSocketContext.Provider>
  );
};
