"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWebSocket = void 0;
const socket_io_1 = require("socket.io");
const utils_1 = require("./utils");
const terminal_1 = require("./terminal");
const terminalManager = new terminal_1.TerminalManager();
// http websocket server to handle the real time communication
function initWebSocket(httpServer) {
    console.log("Initializing the websocket server");
    const io_server = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });
    io_server.on("connection", (socket) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        console.log("websocket connection established");
        const project_name = ((_a = socket.handshake.query.project_name) === null || _a === void 0 ? void 0 : _a.toString()) || "";
        console.log("Handshake query", project_name);
        yield (0, utils_1.downloadS3ContentToLocal)("projects/" + project_name, project_name);
        //get the files from s3 and copy to local and send back the root directory structure to frontend
        socket.emit("loaded", {
            rootContent: (0, utils_1.fetchRootDirectories)(project_name),
        });
        // socket.on("typing", async (char, callback) => {
        //   console.log("data changed from", char);
        //   callback("change received");
        // });
        //Fetch content of a file given file path
        socket.on("fetchFileContent", (filePathObject, callback) => __awaiter(this, void 0, void 0, function* () {
            var _b;
            console.log("Fetch file content event received", filePathObject);
            const filePath = filePathObject.path;
            const project_name = ((_b = socket.handshake.query.project_name) === null || _b === void 0 ? void 0 : _b.toString()) || "";
            const content = (0, utils_1.fetchContent)(project_name, filePath);
            console.log("content of the selected file", content);
            callback(content);
        }));
        socket.on("updateFileContent", (obj) => __awaiter(this, void 0, void 0, function* () {
            var _c;
            console.log("Content change from browser", obj);
            const project_name = ((_c = socket.handshake.query.project_name) === null || _c === void 0 ? void 0 : _c.toString()) || "";
            if (obj.path && obj.content) {
                const path = process.env.COPY_DIRECTORY_PATH + "/" + project_name + obj.path;
                const content = obj.content;
                yield (0, utils_1.writeToFile)(path, content);
            }
        }));
        socket.on("requestTerminal", () => __awaiter(this, void 0, void 0, function* () {
            var _d;
            const project_name = ((_d = socket.handshake.query.project_name) === null || _d === void 0 ? void 0 : _d.toString()) || "";
            console.log("Request to create a terminal");
            terminalManager.createPty(socket.id, project_name, (data) => {
                console.log("data before emitting to frontend", data);
                socket.emit("terminal", {
                    data: Buffer.from(data, "utf-8"),
                });
                socket.emit("loaded", {
                    rootContent: (0, utils_1.fetchRootDirectories)(project_name),
                });
            });
        }));
        socket.on("terminalData", (_e) => __awaiter(this, [_e], void 0, function* ({ data }) {
            console.log("terminal data is", data);
            terminalManager.write(socket.id, data);
        }));
        socket.on("fetchDirectory", (dir, callback) => __awaiter(this, void 0, void 0, function* () {
            var _f;
            const project_name = ((_f = socket.handshake.query) === null || _f === void 0 ? void 0 : _f.project_name) || "";
            console.log("fetchDirectory called for project - ", project_name);
            const dirPath = process.env.COPY_DIRECTORY_PATH + `/${project_name}/${dir}`;
            const contents = yield (0, utils_1.fetchDirectories)(dirPath, dir);
            callback(contents);
        }));
    }));
}
exports.initWebSocket = initWebSocket;
