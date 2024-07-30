import express from "express";
import { createServer } from "http";
import { initWebSocket } from "./websocket";

const app = express();
const httpServer = createServer(app);

initWebSocket(httpServer);

httpServer.listen(3001, () => {
  console.log("Web socket server is up and running...");
});
