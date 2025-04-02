import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

interface WebSocketMessage {
  type: string;
  data: any;
}

class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Set<WebSocket>;

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws', // Explicitly define WebSocket path
      // Add error handlers for WebSocket server
      perMessageDeflate: false // Disable compression which can cause issues
    });
    this.clients = new Set();

    this.wss.on("connection", (ws) => {
      this.handleConnection(ws);
    });
    
    this.wss.on("error", (error) => {
      console.error("WebSocket server error:", error);
    });
  }

  private handleConnection(ws: WebSocket) {
    this.clients.add(ws);
    console.log(`WebSocket client connected (${this.clients.size} total)`);

    ws.on("message", (message) => {
      try {
        const parsedMessage = JSON.parse(message.toString()) as WebSocketMessage;
        this.handleMessage(ws, parsedMessage);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });

    ws.on("close", () => {
      this.clients.delete(ws);
      console.log(`WebSocket client disconnected (${this.clients.size} remaining)`);
    });

    // Send welcome message with initial data
    this.sendToClient(ws, {
      type: "connected",
      data: { message: "Connected to Virtual9jaBet WebSocket server" }
    });
  }

  private handleMessage(client: WebSocket, message: WebSocketMessage) {
    console.log(`Received message: ${message.type}`);
    
    // Handle specific message types
    switch (message.type) {
      case "ping":
        this.sendToClient(client, { type: "pong", data: { timestamp: Date.now() } });
        break;
      
      // Add more message handlers as needed
    }
  }

  private sendToClient(client: WebSocket, message: WebSocketMessage) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  public broadcast(message: WebSocketMessage) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
}

export function setupWebSocketServer(server: HttpServer) {
  return new WebSocketManager(server);
}
