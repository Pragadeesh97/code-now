import { Server } from "socket.io";
import {
  downloadS3ContentToLocal,
  fetchRootDirectories,
  fetchContent,
  writeToFile,
  fetchDirectories,
} from "./utils";
import { TerminalManager } from "./terminal";

const terminalManager = new TerminalManager();

// http websocket server to handle the real time communication
export function initWebSocket(httpServer: any) {
  const io_server = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io_server.on("connection", async (socket) => {
    const project_name = socket.handshake.query.project_name?.toString() || "";

    //get the files from s3 and copy to local and send back the root directory structure to frontend
    socket.emit("loaded", {
      rootContent: fetchRootDirectories(project_name),
    });

    socket.on("fetchFileContent", async (filePathObject, callback) => {
      const filePath = filePathObject.path;
      const project_name: string =
        socket.handshake.query.project_name?.toString() || "";

      const content = fetchContent(project_name, filePath);
      callback(content);
    });

    socket.on("updateFileContent", async (obj) => {
      const project_name: string =
        socket.handshake.query.project_name?.toString() || "";
      if (obj.path && obj.content) {
        const path = process.env.COPY_DIRECTORY_PATH + "/" + obj.path;
        const content = obj.content;
        await writeToFile(path, content);
      }
    });

    socket.on("requestTerminal", async () => {
      const project_name: string =
        socket.handshake.query.project_name?.toString() || "";
      terminalManager.createPty(socket.id, project_name, (data) => {
        socket.emit("terminal", {
          data: Buffer.from(data, "utf-8"),
        });
        socket.emit("loaded", {
          rootContent: fetchRootDirectories(project_name),
        });
      });
    });

    socket.on(
      "terminalData",
      async ({ data }: { data: string; terminalId: number }) => {
        terminalManager.write(socket.id, data);
      }
    );

    socket.on("fetchDirectory", async (dir: string, callback) => {
      const project_name = socket.handshake.query?.project_name || "";
      const dirPath = process.env.COPY_DIRECTORY_PATH + `/${dir}`;

      const contents = await fetchDirectories(dirPath, dir);
      callback(contents);
    });
  });
}
