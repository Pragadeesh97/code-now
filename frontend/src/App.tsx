// import Login from "./Login";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import GoogleSignIn from "./GoogleSignin.tsx";
import Create from "./CreateProject.tsx";
import { Workspace } from "./Workspace.tsx";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GoogleSignIn />} />
          <Route path="/signin" element={<GoogleSignIn />} />
          <Route path="/create" element={<Create />} />
          <Route path="/workspace" element={<Workspace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
