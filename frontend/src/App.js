// src/App.js
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import VetDashboard from "./pages/VetDashboard";
import AnimalDetails from "./pages/AnimalDetails";
import petsData from "./data/pets.json";

function App() {
  const [pets, setPets] = useState(petsData);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route
          path="/dashboard"
          element={<VetDashboard pets={pets} setPets={setPets} />}
        />
        <Route path="/animal/:id" element={<AnimalDetails pets={pets} />} />
      </Routes>
    </Router>
  );
}

export default App;
