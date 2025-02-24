// App.js

import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Room from "./Pages/RoomPage/Room";
import ShortenURL from "./Pages/ShortenUrlPage/ShortenURL";
// import { setBackgroundImage } from "./config/unsplashConfig";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ShortenURL />} />
        <Route path="/room" element={<Room />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
