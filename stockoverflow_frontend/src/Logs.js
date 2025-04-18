import React, { useEffect, useState } from "react";
import "./logs.css";

const Logs = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/logs/")
      .then((response) => response.json())
      .then((data) => setLogs(data))
      .catch((error) => console.error("Error fetching logs:", error));
  }, []);

  const formatTimestamp = (timestamp) => {
    const options = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };
    return new Date(timestamp).toLocaleString("en-GB", options);
  };
  

  return (
    <div className="logs-container">
      {logs.map((log, index) => (
        <div className="log-entry" key={index}>
          <span className="log-timestamp">[{formatTimestamp(log.timestamp)}]</span>{" "}
          <span className="log-action">{log.action}</span>{" "}
          <span className="log-item">"{log.item_name}"</span> by{" "}
          <span className="log-user">{log.user || "Anonymous"}</span>
          <div className="log-details">{log.details}</div>
        </div>
      ))}
    </div>
  );
};

export default Logs;
