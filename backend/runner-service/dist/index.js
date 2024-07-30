"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const websocket_1 = require("./websocket");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
(0, websocket_1.initWebSocket)(httpServer);
httpServer.listen(3001, () => {
    console.log("Web socket server is up and running...");
});
