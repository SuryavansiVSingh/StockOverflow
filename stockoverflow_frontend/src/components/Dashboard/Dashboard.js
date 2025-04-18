import React from "react";
import { Link, Outlet } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <div>
        <div className="navbar">
          <h1>Stock Overflow</h1>
          <div className="nav-links">
            <Link to="/inventory">Inventory</Link>
            <Link to="/users">Users</Link>
            <Link to="/checkout">Checkout</Link>
            <Link to="/cars">Cars</Link>
            <Link to="/chat">Chat</Link>
            <Link to="/logs">Logs</Link>
          </div>
        </div>

      <div className="dashboard-section">
        <Outlet /> {/* This renders Inventory or any other page */}
      </div>
    </div>
  );
};

export default Dashboard;
