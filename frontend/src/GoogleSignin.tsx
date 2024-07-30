// GoogleSignIn.js
import React, { useEffect, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function GoogleSignIn() {
  const [user, setUser] = useState();

  const signIn = useGoogleLogin({
    onSuccess: (response) => setUser(response),
    onError: (response) => {
      alert("Login Failed");
      console.log("User login failed", response);
    },
  });
  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      axios
        .get(
          `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user?.access_token}`
        )
        .then((res) => {
          localStorage.setItem("name", res.data.given_name);
          localStorage.setItem("picture", res.data.picture);
          navigate("/create");
        })
        .catch((e) => {
          console.log("error while fetching user profile", e);
        });
    }
  }, [user]);

  return (
    <div className="flex justify-center items-center bg-[#193251] min-h-screen overflow-hidden">
      <div className="border rounded-md p-2 border-[#37BCF8] text-[#DDDEDD] text-sm h-[150px] w-[400px]">
        <div className="flex justify-center items-center font-bold mt-4">
          Welcome to Code-Now, Login to embark your journey
        </div>
        <div className="flex justify-center items-center mt-7 ml-5">
          <button
            className="min-w-[300px] bg-[#37BCF8] rounded-md text-white font-medium p-2 hover:ring hover:ring-[#a2e0fc] cursor-pointer"
            onClick={signIn}
          >
            Sign in with Google 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
