//@ts-ignore => someone fix this
import { IPty, fork } from "node-pty";

const SHELL = "bash";

export class TerminalManager {
  private sessions: {
    [id: string]: { terminal: IPty; project_name: string };
  } = {};
  constructor() {
    this.sessions = {};
  }

  createPty(id: string, project_name: string, onData: (data: string) => void) {
    const term = fork(SHELL, [], {
      cols: 100,
      name: "xterm",
      cwd: process.env.COPY_DIRECTORY_PATH,
      env: process.env,
    });

    term.on("data", (data: string) => {
      onData(data);
    });

    this.sessions[id] = {
      terminal: term,
      project_name,
    };
    term.on("exit", () => {
      delete this.sessions[term.pid];
    });
  }

  write(terminal_id: string, data: string) {
    this.sessions[terminal_id]?.terminal.write(data);
  }

  kill(terminal_id: string) {
    this.sessions[terminal_id]?.terminal.kill();
    delete this.sessions[terminal_id];
  }
}
