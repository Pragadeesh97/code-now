import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { Terminal as XTerminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";

const fitAddon = new FitAddon();

function ab2str(buf: string) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

const OPTIONS_TERM = {
  cursorBlink: true,
  cols: 80,
  theme: {
    background: "black",
    foreground: "white",
  },
  fontFamily: "monospace",
};

export const Terminal = ({ socket }: { socket: Socket }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const term = useRef<XTerminal | null>(null);

  useEffect(() => {
    if (!terminalRef.current || !socket) return;

    term.current = new XTerminal(OPTIONS_TERM);
    term.current.loadAddon(fitAddon);
    term.current.open(terminalRef.current);
    fitAddon.fit();

    socket.emit("requestTerminal");

    const terminalHandler = ({ data }: { data: ArrayBuffer }) => {
      if (data instanceof ArrayBuffer) {
        const strData = ab2str(data);
        term.current?.write(strData);
      }
    };

    socket.on("terminal", terminalHandler);

    term.current.onData((data) => {
      socket.emit("terminalData", { data });
    });

    socket.emit("terminalData", { data: "\n" });

    return () => {
      socket.off("terminal", terminalHandler);
      term.current?.dispose();
    };
  }, [socket]);

  return (
    <div
      style={{
        width: "40vw",
        height: "400px",
        textAlign: "left",
        zIndex: 1000,
      }}
      ref={terminalRef}
    ></div>
  );
};
