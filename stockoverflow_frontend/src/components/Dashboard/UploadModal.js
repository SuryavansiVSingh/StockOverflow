import React, { useState } from "react";
import * as XLSX from "xlsx";
import "./Dashboard.css";

const UploadModal = ({ setIsModalOpen, setCars }) => {
  const [carRows, setCarRows] = useState([
    {
      vin: "",
      model: "",
      adaptation: "",
      scheduled_date: "",
      order_date: "",
      location: "",
      client_name: "",
      dealers_comments: ""
    }
  ]);

  const handleInputChange = (index, field, value) => {
    const updatedRows = [...carRows];
    updatedRows[index][field] = value;
    setCarRows(updatedRows);
  };

  const handleAddRow = () => {
    setCarRows([
      ...carRows,
      {
        vin: "",
        model: "",
        adaptation: "",
        scheduled_date: "",
        order_date: "",
        location: "",
        client_name: "",
        dealers_comments: ""
      }
    ]);
  };

  const handleRemoveRow = (index) => {
    const updatedRows = [...carRows];
    updatedRows.splice(index, 1);
    setCarRows(updatedRows);
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = (event) => {
      const binaryStr = event.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const formattedData = jsonData.map((row) => ({
        vin: row["VIN"] || "",
        model: row["Model"] || "",
        adaptation: row["Adaptation"] || "",
        scheduled_date: row["Scheduled Date"] ? new Date(row["Scheduled Date"]).toISOString().split("T")[0] : "",
        order_date: row["Order Date"] ? new Date(row["Order Date"]).toISOString().split("T")[0] : "",
        location: row["Location"] || "",
        client_name: row["Client Name"] || "",
        dealers_comments: row["Dealer's Comment"] || ""
      }));

      setCarRows([...carRows, ...formattedData]);
    };

    reader.readAsBinaryString(file);
  };

  const handleConfirm = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/cars/manual_add/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(carRows)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Upload error:", result);
        alert(`Some cars failed to upload: ${result.error || "Unknown error"}`);
        return;
      }

      if (result.cars) {
        setCars((prevCars) => [...prevCars, ...result.cars]);
      }

      alert("Upload complete! Check the table for results.");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error during upload:", error);
      alert("Failed to upload data. Please try again.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-wide">
        <h3>Manual Car Entry</h3>
        <p className="info-text">
          Tip: Copy from Excel and paste row-by-row into this sheet. Dates must be selected or entered as YYYY-MM-DD.
        </p>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleExcelUpload}
          className="file-input"
        />
        <table className="inventory-table">
          <thead>
            <tr>
              <th>VIN</th>
              <th>Model</th>
              <th>Adaptation</th>
              <th>Scheduled Date</th>
              <th>Order Date</th>
              <th>Location</th>
              <th>Client Name</th>
              <th>Dealer's Comment</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {carRows.map((car, index) => (
              <tr key={index}>
                {Object.entries(car).map(([field, value]) => (
                  <td key={field}>
                    {field.includes("date") ? (
                      <input
                        type="date"
                        value={value}
                        onChange={(e) => handleInputChange(index, field, e.target.value)}
                      />
                    ) : (
                      <textarea
                        value={value}
                        placeholder={field.replace("_", " ").toUpperCase()}
                        onChange={(e) => handleInputChange(index, field, e.target.value)}
                      />
                    )}
                  </td>
                ))}
                <td>
                  <button
                    className="delete-button"
                    onClick={() => handleRemoveRow(index)}
                  >
                    ❌
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="modal-actions">
          <button onClick={handleAddRow} className="add-row-button">
            Add Row
          </button>
          <button onClick={handleConfirm} className="confirm-button">
            Confirm and Add
          </button>
          <button onClick={() => setIsModalOpen(false)} className="cancel-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;