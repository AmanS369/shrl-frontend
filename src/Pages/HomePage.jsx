import React from "react";
import ShortenURL from "../Component/ShortenURL";

const HomePage = () => {
  return (
    <div className="flex justify-center   bg-gray-100">
      <div className="max-w-md">
        <ShortenURL />
      </div>
    </div>
  );
};
export default HomePage;
