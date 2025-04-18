import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid"; // import uuid
import "./Dashboard.css";
import UploadModal from "./UploadModal";

const statusColors = {
  "not started yet": "#f0f0f0",
  pending: "#fff3cd",
  completed: "#d4edda",
};

const Cars = () => {
  const [cars, setCars] = useState([]);
  const [models, setModels] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editedCars, setEditedCars] = useState({});
  const [rowStatuses, setRowStatuses] = useState({});

  const API_BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cars/`);
      const data = await response.json();
      // Assign a unique key if not already present
      const dataWithKeys = data.map((car) => ({
        ...car,
        key: car.id ? car.id : uuidv4(),
      }));
      setCars(dataWithKeys);
      
      const modelSet = [
        ...new Set(dataWithKeys.map((car) => car.model)),
      ].sort((a, b) => a.localeCompare(b));
      setModels(modelSet);

      const initialStatuses = {};
      dataWithKeys.forEach(car => {
        initialStatuses[car.key] = car.status;
      });
      setRowStatuses(initialStatuses);
    } catch (error) {
      console.error("Failed to fetch cars:", error);
    }
  };

  const updateCar = async (carKey) => {
    const updatedFields = editedCars[carKey];
    if (!updatedFields) return;

    try {
      // Here you might need to adjust the API endpoint if your API uses car.id instead of car.key
      const response = await fetch(`${API_BASE_URL}/api/cars/${carKey}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (response.ok) {
        const updatedCar = await response.json();
        setCars((prev) =>
          prev.map((car) =>
            car.key === carKey ? { ...updatedCar, key: car.key } : car
          )
        );
        setEditedCars((prev) => {
          const newState = { ...prev };
          delete newState[carKey];
          return newState;
        });
        setRowStatuses((prev) => ({ ...prev, [carKey]: updatedCar.status }));
      }
    } catch (error) {
      console.error("Failed to update car", error);
    }
  };

  const deleteCar = async (carKey) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cars/${carKey}/`, {
        method: "DELETE",
      });
      if (response.ok) {
        setCars((prev) => prev.filter((car) => car.key !== carKey));
      }
    } catch (error) {
      console.error("Failed to delete car", error);
    }
  };

  const handleFieldChange = (carKey, field, value) => {
    setCars((prevCars) =>
      prevCars.map((car) =>
        car.key === carKey ? { ...car, [field]: value } : car
      )
    );
    setEditedCars((prev) => ({
      ...prev,
      [carKey]: {
        ...prev[carKey],
        [field]: value,
      },
    }));
    if (field === "status") {
      setRowStatuses((prev) => ({ ...prev, [carKey]: value }));
    }
  };

  const filteredCars = cars.filter((car) => {
    const matchStatus =
      filterStatus === "all" || rowStatuses[car.key] === filterStatus;
    const matchModel = selectedModel === "" || car.model === selectedModel;
    return matchStatus && matchModel;
  });

  return (
    <div className="dashboard-section">
      <h2 className="dashboard-title">Cars Management</h2>

      <div className="filters">
        <label htmlFor="model-filter">Filter by Model:</label>
        <select
          id="model-filter"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="category-select"
        >
          <option value="">All Models</option>
          {models.map((model, idx) => (
            <option key={idx} value={model}>
              {model}
            </option>
          ))}
        </select>

        <label htmlFor="status-filter">Filter by Status:</label>
        <select
          id="status-filter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="status-select"
        >
          <option value="all">All</option>
          <option value="not started yet">Not Started Yet</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <button className="upload-button" onClick={() => setIsModalOpen(true)}>
        Add Cars
      </button>

      <table className="inventory-table">
        <thead>
          <tr>
            <th>VIN</th>
            <th>Model</th>
            <th>Adaptation</th>
            <th>Dealer Comments</th>
            <th>Order Date</th>
            <th>Scheduled Date</th>
            <th>Status</th>
            <th>Update</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {filteredCars.map((car) => (
            <tr
              key={car.key}
              style={{
                backgroundColor:
                  statusColors[rowStatuses[car.key]] || "white",
              }}
            >
              <td>
                <input
                  value={car.vin || ""}
                  onChange={(e) =>
                    handleFieldChange(car.key, "vin", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  value={car.model || ""}
                  onChange={(e) =>
                    handleFieldChange(car.key, "model", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  value={car.adaptation || ""}
                  onChange={(e) =>
                    handleFieldChange(car.key, "adaptation", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  value={car.dealers_comments || ""}
                  onChange={(e) =>
                    handleFieldChange(car.key, "dealers_comments", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  type="date"
                  value={car.order_date || ""}
                  onChange={(e) =>
                    handleFieldChange(car.key, "order_date", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  type="date"
                  value={car.scheduled_date || ""}
                  onChange={(e) =>
                    handleFieldChange(car.key, "scheduled_date", e.target.value)
                  }
                />
              </td>
              <td>
                <select
                  value={rowStatuses[car.key] || "not started yet"}
                  onChange={(e) =>
                    handleFieldChange(car.key, "status", e.target.value)
                  }
                >
                  <option value="not started yet">Not Started Yet</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </td>
              <td>
                <button
                  className="confirm-button"
                  onClick={() => updateCar(car.key)}
                >
                  Update
                </button>
              </td>
              <td>
                <button
                  className="delete-button"
                  onClick={() => deleteCar(car.key)}
                >
                  ❌
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <UploadModal setIsModalOpen={setIsModalOpen} setCars={setCars} />
      )}
    </div>
  );
};

export default Cars;
