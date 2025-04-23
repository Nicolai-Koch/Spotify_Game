import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Import your WebSocket context provider if it's defined
import { WebSocketProvider } from "./WebSocketContext";  // Make sure this path is correct!

const root = ReactDOM.createRoot(document.getElementById("root"));

// Render the App wrapped with WebSocketProvider
root.render(
  <WebSocketProvider>
    <App />
  </WebSocketProvider>
);
