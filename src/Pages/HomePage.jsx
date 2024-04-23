import React from "react";
import ShortenURL from "../Component/ShortenURL";

const HomePage = () => {
  return (
    <div className="flex justify-center   bg-gray-100">
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold text-center ">
          Welcome to My URL Shortener
        </h1>
        <ShortenURL />
      </div>
    </div>
  );
};
export default HomePage;
