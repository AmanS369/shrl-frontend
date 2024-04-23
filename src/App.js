// App.js

import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./Pages/HomePage";
import ShortenURL from "./Component/ShortenURL";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ShortenURL />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
