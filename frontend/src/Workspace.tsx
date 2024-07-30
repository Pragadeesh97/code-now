import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { AppBar } from "./CreateProject";
import { Editor } from "./Editor.tsx";
import styled from "@emotion/styled";
import { Output } from "./components/Ouput.tsx";
import { Terminal } from "./components/Terminal.tsx";
import { Type } from "./components/editor/utils/file-manager.tsx";
import axios from "axios";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end; /* Aligns children (button) to the right */
  padding: 10px; /* Adds some space around the button */
`;

const Workingspace = styled.div`
  display: flex;
  margin: 0;
  font-size: 16px;
  width: 100%;
`;

const LeftPanel = styled.div`
  flex: 1;
  width: 60%;
`;

const RightPanel = styled.div`
  flex: 1;
  width: 40%;
`;

export function Workspace() {
  const [socket, setSocket] = useState();
  const [fileStructure, setFileStructure] = useState();
  const [selectedFile, setSelectedFile] = useState();
  const [selectedFileContent, setSelectedFileContent] = useState();
  const [showOutput, setShowOutput] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const project_name = params.get("project");

  useEffect(() => {
    let ws = null;
    async function temp() {
      const headers = {
        "Content-Type": "application/json",
      };
      try {
        const startProjectResult = await axios.post(
          "http://localhost:3002/start",
          {
            project: project_name,
          },
          { headers }
        );
        if (startProjectResult.status === 200) {
          ws = io(`http://${project_name}.pragadeesh97.com`, {
            query: {
              project_name: params.get("project"),
            },
          });

          ws.on("connect", () => {
            console.log("connected");
          });
          ws.on("loaded", async (fileStruct: any) => {
            setLoaded(true);
            if (fileStruct) setFileStructure(fileStruct?.rootContent);
          });

          ws.on("connect_error", (err) => {
            console.error("Connection error:", err);
          });
          setSocket(ws);
        }
      } catch (e) {
        console.log("error occured while creating the project");
      }
    }
    temp();
    return () => {
      if (ws) {
        ws.off("Closing connection");
        ws.close();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedFile) {
      if (socket) {
        if (selectedFile.type === Type.FILE) {
          socket.emit("fetchFileContent", selectedFile, (fileContent) => {
            setSelectedFileContent(fileContent);
          });
        } else {
          socket?.emit(
            "fetchDirectory",
            selectedFile.path,
            (data: RemoteFile[]) => {
              setFileStructure((prev) => {
                const allFiles = [...prev, ...data];
                return allFiles.filter(
                  (file, index, self) =>
                    index === self.findIndex((f) => f.path === file.path)
                );
              });
            }
          );
        }
      }
    }
  }, [selectedFile]);

  if (!loaded) {
    return "Loading...";
  }
  function onSelect(param) {
    setSelectedFile(param);
  }
  return (
    <>
      <AppBar />
      <Container>
        <ButtonContainer>
          <button onClick={() => setShowOutput(!showOutput)}>See output</button>
        </ButtonContainer>
        <Workingspace>
          <LeftPanel>
            <Editor
              socket={socket}
              selectedFile={selectedFile}
              selectedFileContent={selectedFileContent}
              onSelect={onSelect}
              files={fileStructure}
            />
          </LeftPanel>
          <RightPanel>
            {showOutput && <Output project_name={project_name} />}
            <Terminal socket={socket} />
          </RightPanel>
        </Workingspace>
      </Container>
    </>
  );
}
