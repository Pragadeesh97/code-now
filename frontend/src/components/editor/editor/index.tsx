import Editor from "@monaco-editor/react"; // Package for editor
import { File } from "../utils/file-manager.tsx";
import { Socket } from "socket.io-client";

export const CodeEditor = ({
  selectedFile,
  socket,
  selectedFileContent,
}: {
  selectedFile: File | undefined;
  socket: Socket;
  selectedFileContent: any;
}) => {
  if (!selectedFile) return null;

  const code = selectedFileContent;
  let language = selectedFile.name.split(".").pop();

  if (language === "js" || language === "jsx") language = "javascript";
  else if (language === "ts" || language === "tsx") language = "typescript";
  else if (language === "py") language = "python";

  function debounce(func: (value: string) => void, wait: number) {
    let timeout: number;
    return (value: string) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func(value);
      }, wait);
    };
  }

  return (
    <Editor
      height="100vh"
      language={language}
      value={code}
      theme="vs-dark"
      onChange={debounce((value) => {
        // Should send diffs, for now sending the whole file
        // PR and win a bounty!
        socket.emit("updateFileContent", {
          path: selectedFile.path,
          content: value,
        });
      }, 500)}
    />
  );
};
