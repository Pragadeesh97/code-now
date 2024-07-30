import { useEffect, useMemo } from "react";
import Sidebar from "./components/editor/components/sidebar";
import { CodeEditor } from "./components/editor/editor/index.tsx";
import styled from "@emotion/styled";
import {
  File,
  buildFileTree,
  RemoteFile,
} from "./components/editor/utils/file-manager";
import { FileTree } from "./components/editor/components/file-tree";
import { Socket } from "socket.io-client";

// credits - https://codesandbox.io/s/monaco-tree-pec7u
export const Editor = ({
  files,
  onSelect,
  selectedFile,
  socket,
  selectedFileContent,
}: {
  files: RemoteFile[];
  onSelect: (file: File) => void;
  selectedFile: File | undefined;
  socket: Socket;
  selectedFileContent: any;
}) => {
  const rootDir = useMemo(() => {
    return buildFileTree(files);
  }, [files]);

  useEffect(() => {
    if (!selectedFile) {
      onSelect(rootDir.files[0]);
    }
  }, [selectedFile, rootDir, onSelect]);

  return (
    <div>
      <Main>
        <Sidebar>
          <FileTree
            rootDir={rootDir}
            selectedFile={selectedFile}
            onSelect={onSelect}
          />
        </Sidebar>
        <CodeEditor
          socket={socket}
          selectedFile={selectedFile}
          selectedFileContent={selectedFileContent}
        />
      </Main>
    </div>
  );
};

const Main = styled.main`
  display: flex;
`;
