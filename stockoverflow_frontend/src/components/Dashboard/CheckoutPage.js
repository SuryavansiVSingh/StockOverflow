// CheckoutPage.js - Final Layout Polished with Clean UI
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Dashboard.css";

const CheckoutPage = () => {
  const [userCode, setUserCode] = useState("");
  const [vin, setVin] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [scannedParts, setScannedParts] = useState([""]);
  const [users, setUsers] = useState([]);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/users/").then((res) => setUsers(res.data));
    axios.get("http://127.0.0.1:8000/api/inventory/").then((res) => setInventory(res.data));
  }, []);

  const handlePartChange = (value, index) => {
    const updated = [...scannedParts];
    updated[index] = value;
    setScannedParts(updated);
  };

  const addPartField = () => setScannedParts([...scannedParts, ""]);

  const deletePartField = (index) => {
    const updated = scannedParts.filter((_, i) => i !== index);
    setScannedParts(updated.length ? updated : [""]);
  };

  const handleFinalSubmit = async () => {
    try {
      const user = users.find((u) => u.unique_id === userCode);
      if (!user) return alert("Invalid user code");

      const matchedParts = scannedParts
        .filter((p) => p.trim() !== "")
        .map((partValue) => {
          const part = inventory.find(
            (inv) =>
              inv.barcode === partValue ||
              inv.name.toLowerCase() === partValue.toLowerCase() ||
              inv.sku === partValue
          );
          if (!part) throw new Error(`Part '${partValue}' not found`);
          return {
            part: part.barcode,
            damaged: false,
            edit_reason: ""
          };
        });

      const payload = {
        user: user.unique_id,
        vin,
        order_number: orderNumber,
        parts: matchedParts
      };

      await axios.post("http://127.0.0.1:8000/api/checkout/", payload);
      alert("✅ Checkout saved!");
      setUserCode("");
      setVin("");
      setOrderNumber("");
      setScannedParts([""]);
    } catch (err) {
      if (err.response && err.response.data) {
        console.error("Backend error:", err.response.data);
        alert("❌ Failed to save: " + JSON.stringify(err.response.data, null, 2));
      } else {
        console.error("❌ Unknown error:", err);
        alert("❌ Failed to save. Check the console.");
      }
    }
  };

  return (
    <div className="dashboard-section checkout-page">
      <h2 className="checkout-title">Checkout Page</h2>

      <div className="form-row">
        <div className="form-group">
          <label>User Barcode</label>
          <input value={userCode} onChange={(e) => setUserCode(e.target.value)} placeholder="Scan/Enter user code" />
        </div>
        <div className="form-group">
          <label>VIN</label>
          <input value={vin} onChange={(e) => setVin(e.target.value)} placeholder="Vehicle VIN" />
        </div>
        <div className="form-group">
          <label>Order Number</label>
          <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="Order number" />
        </div>
      </div>

      <label>Parts</label>
      {scannedParts.map((value, index) => (
        <div key={index} className="form-row part-entry">
          <input
            value={value}
            onChange={(e) => handlePartChange(e.target.value, index)}
            placeholder={`Part ${index + 1}`}
          />
          <button className="delete-button" onClick={() => deletePartField(index)} title="Remove part">✕</button>
        </div>
      ))}

      <div className="button-row center-buttons">
        <button className="add-button" onClick={addPartField}>➕ Add Part</button>
        <button className="submit-button" onClick={handleFinalSubmit}>✅ Finish</button>
      </div>
    </div>
  );
};

export default CheckoutPage;