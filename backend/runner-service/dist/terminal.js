"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalManager = void 0;
//@ts-ignore => someone fix this
const node_pty_1 = require("node-pty");
const SHELL = "bash";
class TerminalManager {
    constructor() {
        this.sessions = {};
        this.sessions = {};
    }
    createPty(id, project_name, onData) {
        console.log("Inside Terminal manager create putty", project_name);
        const term = (0, node_pty_1.fork)(SHELL, [], {
            cols: 100,
            name: "xterm",
            cwd: process.env.COPY_DIRECTORY_PATH,
            env: process.env,
        });
        console.log("PUTTY spawn", term.pid);
        term.on("data", (data) => {
            console.log("On data called in server", data);
            onData(data);
        });
        this.sessions[id] = {
            terminal: term,
            project_name,
        };
        console.log("sessions", this.sessions);
        term.on("exit", () => {
            console.log("deleting the putty session");
            delete this.sessions[term.pid];
        });
    }
    write(terminal_id, data) {
        var _a;
        console.log("Writing to terminal");
        (_a = this.sessions[terminal_id]) === null || _a === void 0 ? void 0 : _a.terminal.write(data);
    }
    kill(terminal_id) {
        var _a;
        console.log("Clearing the terminal");
        (_a = this.sessions[terminal_id]) === null || _a === void 0 ? void 0 : _a.terminal.kill();
        delete this.sessions[terminal_id];
    }
}
exports.TerminalManager = TerminalManager;
