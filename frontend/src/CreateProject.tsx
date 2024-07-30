import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const environments = [
  { label: "Node.js", value: "node" },
  { label: "Python", value: "python" },
];

export default function Create() {
  const { register, handleSubmit } = useForm();

  const navigate = useNavigate();
  const headers = {
    "Content-Type": "application/json",
  };
  async function createProject(data: any) {
    try {
      await axios.post(
        "http://localhost:3000/project",
        {
          project_name: data.projectName,
          env: data.env,
        },
        { headers }
      );
      navigate(`/workspace?project=${data.projectName}`);
    } catch (e) {
      console.log("Error while creating project");
    }
  }
  return (
    <>
      <AppBar />
      <form onSubmit={handleSubmit((data) => createProject(data))}>
        <div className="flex justify-center items-center bg-[#193251] min-h-screen overflow-hidden">
          <div className="border rounded-md p-2 border-[#37BCF8] text-[#DDDEDD] text-sm h-[250px] w-[400px]">
            <div className="flex justify-center items-center font-bold">
              Welcome {localStorage.getItem("name")} 👋, create your project
              now!
            </div>
            <div className="flex ml-2 mt-8 gap-7 items-center">
              <p>Project Name</p>
              <input
                {...register("projectName")}
                type="text"
                className="rounded-sm p-1  focus:ring focus:ring-[#37BCF8] focus:border-[#37BCF8] focus:outline-none text-black w-[200px]"
              />
            </div>
            <div className="flex ml-2 mt-8 gap-8 items-center">
              <p>Environment</p>
              <select
                className="rounded-sm p-1 focus:ring focus:ring-[#37BCF8] focus:border-[#37BCF8] focus:outline-none text-black w-[200px]"
                {...register("env")}
              >
                <option disabled>Choose your Env</option>
                {environments.map((env) => {
                  return <option value={env.value}>{env.label}</option>;
                })}
              </select>
            </div>
            <div className="flex justify-center items-center">
              <input
                type="submit"
                className="mt-10 bg-[#37BCF8] rounded-md text-white font-medium p-2 hover:ring hover:ring-[#a2e0fc] cursor-pointer"
                value="Create"
              />
            </div>
          </div>
        </div>
      </form>
    </>
  );
}

export function AppBar() {
  return (
    <div className=" flex items-center justify-between h-[40px] bg-[#37BCF8] p-2">
      <p className="font-bold text-[#333333]">CODE NOW</p>
      <Avatar url={localStorage.getItem("picture")} />
    </div>
  );
}

function Avatar({ url }: { url: string | null }) {
  return (
    <div className="rounded-full w-8 h-8 bg-white overflow-hidden">
      {url && <img src={url} className="w-full h-full object-cover"></img>}
    </div>
  );
}
