import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard/Dashboard";
import Inventory from "./components/Dashboard/Inventory";
import Cars from "./components/Dashboard/Cars";
import Chat from "./components/Dashboard/Chat";
import Header from "./components/Header";
import Logs from "./Logs";
import Users from "./components/Dashboard/Users";
import CheckoutPage from "./components/Dashboard/CheckoutPage";


function App() {
  return (
    <Router>
      <Header /> 
      <Routes>
        <Route path="/" element={<Dashboard />}>
          <Route path="inventory" element={<Inventory />} />
          <Route path="users" element={<Users />} />
          <Route path="cars" element={<Cars />} />
          <Route path="chat" element={<Chat />} />
          <Route path="logs" element={<Logs />} />
          <Route path="checkout" element={<CheckoutPage />} />

          </Route>
      </Routes>
    </Router>
    
  );
}

export default App;
