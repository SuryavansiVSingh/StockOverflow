import React, { useState, useEffect } from "react";
import Barcode from "react-barcode";
import "./Dashboard.css";
import { FiEdit, FiTrash2, FiPrinter, FiArrowDown, FiArrowUp } from "react-icons/fi";


const Inventory = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedRows, setSelectedRows] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [newItem, setNewItem] = useState({
    name: "",
    sku: "",
    barcode: "",
    quantity: 0,
    threshold: 0,
    category: "Select Category",
    childParts: [],
  });

  const fixedCategories = ["Production", "Office", "Car Wash", "Paint/Damage"];

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/inventory/")
      .then((res) => res.json())
      .then(setItems)
      .catch(console.error);
  }, []);

  const handleAddChildPart = () => {
    setNewItem((prev) => ({
      ...prev,
      childParts: [
        ...prev.childParts,
        {
          name: `Part ${prev.childParts.length + 1}`,
          sku: "",
          barcode: "",
          quantity: 0,
          threshold: 0,
        },
      ],
    }));
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? <FiArrowUp /> : <FiArrowDown />;
  };

  const toggleRowSelection = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id]
    );
  };

  const isRowSelected = (id) => selectedRows.includes(id);

  const handleChildPartChange = (index, field, value) => {
    const updated = [...newItem.childParts];
    updated[index][field] = ["quantity", "threshold"].includes(field)
      ? parseInt(value)
      : value;
    setNewItem({ ...newItem, childParts: updated });
  };

  const generateChildBarcode = (index) => {
    const updated = [...newItem.childParts];
    updated[index].barcode = `PARTBAR-${Date.now()}-${index}`;
    setNewItem({ ...newItem, childParts: updated });
  };

  const scanBarcode = () =>
    alert("Scanning functionality is not implemented yet.");

  const handleAddItem = (e) => {
    e.preventDefault();
    if (newItem.category === "Select Category")
      return alert("Please select a valid category.");
    if (!newItem.barcode) return alert("Barcode is required.");

    fetch("http://127.0.0.1:8000/api/inventory/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newItem,
        childParts: newItem.childParts,
      }),
    })
      .then((res) => res.json())
      .then((added) => {
        setItems((prev) => [...prev, added]);
        setShowAddForm(false);
        setNewItem({
          name: "",
          sku: "",
          barcode: "",
          quantity: 0,
          threshold: 0,
          category: "Select Category",
          childParts: [],
        });
      });
  };

  const handleOpenUpdateModal = (item) => {
    setCurrentItem(item);
    setShowUpdateModal(true);
  };

  const handleUpdateItem = (e) => {
    e.preventDefault();
    fetch(`http://127.0.0.1:8000/api/inventory/${currentItem.id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentItem),
    })
      .then((res) => res.json())
      .then((updated) => {
        setItems((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        setShowUpdateModal(false);
      });
  };

  const handleDeleteItem = (id) => {
    fetch(`http://127.0.0.1:8000/api/inventory/${id}/`, { method: "DELETE" })
      .then(() => setItems((prev) => prev.filter((item) => item.id !== id)))
      .catch(console.error);
  };

  const generateBarcode = () => {
    if (!newItem.barcode)
      setNewItem({ ...newItem, barcode: `BAR${Date.now()}` });
  };

  const handlePrintBarcode = (item) => {
    const labelWindow = window.open("", "PRINT", "height=600,width=800");
    labelWindow.document.write(`
      <html><head><title>Print Label</title></head><body>
        <div style="text-align:center;font-family:sans-serif;padding:20px">
          <h3>Item Label</h3>
          <p><strong>Name:</strong> ${item.name}</p>
          <p><strong>SKU:</strong> ${item.sku}</p>
          <svg id="barcode"></svg>
          <p><strong>Barcode:</strong> ${item.barcode}</p>
        </div>
      </body></html>`);

    const script = labelWindow.document.createElement("script");
    script.onload = () => {
      labelWindow.JsBarcode(
        labelWindow.document.querySelector("#barcode"),
        item.barcode,
        {
          format: "CODE128",
          height: 100,
          width: 2,
        }
      );
      labelWindow.document.close();
      labelWindow.focus();
      labelWindow.print();
      labelWindow.close();
    };
    script.src =
      "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js";
    labelWindow.document.body.appendChild(script);
  };

  const sortedItems = [...items].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    if (typeof aValue === "string") {
      return sortConfig.direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
    }
  });

  const filteredItems = sortedItems.filter(
    (item) =>
      !item.parent &&
      item.name?.toLowerCase().includes(search.toLowerCase()) &&
      (selectedCategory === "" || item.category === selectedCategory)
  );

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="dashboard-section dark-mode-ui">
      <div className="dashboard-cards">
        <div className="card blue">
          <h3>Total Products</h3>
          <p>{items.length}</p>
          <span>+1.5% Since last week</span>
        </div>
        <div className="card indigo">
          <h3>Low Stock</h3>
          <p>{items.filter((i) => i.quantity < i.threshold).length}</p>
          <span>Needs restock</span>
        </div>
        <div className="card purple">
          <h3>With Children</h3>
          <p>{items.filter((i) => i.children?.length).length}</p>
          <span>Includes parts</span>
        </div>
        <div className="card pink">
          <h3>Empty Stock</h3>
          <p>{items.filter((i) => i.quantity === 0).length}</p>
          <span>Critical</span>
        </div>
      </div>
      <h2 className="dashboard-title">Inventory Management</h2>
      <div className="dashboard-filters">
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-select"
        >
          <option value="">All Categories</option>
          {fixedCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <button
        className="add-item-button"
        onClick={() => setShowAddForm(!showAddForm)}
      >
        {showAddForm ? "Cancel" : "Add Item"}
      </button>

      {showAddForm && (
        <form className="add-item-form" onSubmit={handleAddItem}>
          <input
            type="text"
            placeholder="Name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="SKU"
            value={newItem.sku}
            onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
            required
          />

          <div className="barcode-container">
            <input
              type="text"
              placeholder="Barcode"
              value={newItem.barcode}
              onChange={(e) =>
                setNewItem({ ...newItem, barcode: e.target.value })
              }
              required
            />
            <div className="barcode-options">
              <button type="button" onClick={generateBarcode}>
                Generate Barcode
              </button>
              <button type="button" onClick={scanBarcode}>
                Scan Barcode
              </button>
            </div>
            {newItem.barcode && <Barcode value={newItem.barcode} />}
          </div>

          <input
            type="number"
            placeholder="Quantity"
            value={newItem.quantity}
            onChange={(e) =>
              setNewItem({ ...newItem, quantity: parseInt(e.target.value) })
            }
            required
          />
          <input
            type="number"
            placeholder="Threshold"
            value={newItem.threshold}
            onChange={(e) =>
              setNewItem({ ...newItem, threshold: parseInt(e.target.value) })
            }
            required
          />

          <select
            value={newItem.category}
            onChange={(e) =>
              setNewItem({ ...newItem, category: e.target.value })
            }
            required
          >
            <option value="Select Category">Select Category</option>
            {fixedCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {newItem.childParts.map((part, index) => (
            <div key={index} className="child-part">
              <h5>Part {index + 1}</h5>
              <input
                placeholder="Name"
                value={part.name}
                onChange={(e) =>
                  handleChildPartChange(index, "name", e.target.value)
                }
              />
              <input
                placeholder="SKU"
                value={part.sku}
                onChange={(e) =>
                  handleChildPartChange(index, "sku", e.target.value)
                }
              />
              <input
                placeholder="Barcode"
                value={part.barcode}
                onChange={(e) =>
                  handleChildPartChange(index, "barcode", e.target.value)
                }
              />
              <input
                placeholder="Quantity"
                type="number"
                value={part.quantity}
                onChange={(e) =>
                  handleChildPartChange(index, "quantity", e.target.value)
                }
              />
              <input
                placeholder="Threshold"
                type="number"
                value={part.threshold}
                onChange={(e) =>
                  handleChildPartChange(index, "threshold", e.target.value)
                }
              />
              <div className="barcode-options">
                <button
                  type="button"
                  onClick={() => generateChildBarcode(index)}
                >
                  Generate Barcode
                </button>
                <button type="button" onClick={scanBarcode}>
                  Scan Barcode
                </button>
              </div>
              {part.barcode && (
                <Barcode value={part.barcode} width={1} height={40} />
              )}
            </div>
          ))}

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button type="submit" className="submit-button">
              Add Item
            </button>
            <button type="button" onClick={handleAddChildPart}>
              + Add Part
            </button>
          </div>
        </form>
      )}

      <table className="inventory-table dark-table">
        <thead>
          <tr>
            <th>Select</th>
            <th onClick={() => handleSort("name")}>
              Name {renderSortIcon("name")}
            </th>
            <th onClick={() => handleSort("sku")}>
              SKU {renderSortIcon("sku")}
            </th>
            <th>Barcode</th>
            <th onClick={() => handleSort("quantity")}>
              Qty {renderSortIcon("quantity")}
            </th>
            <th>Category</th>
            <th>Threshold</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {paginatedItems.map((item) => (
            <React.Fragment key={item.id}>
              <tr className="group-title">
                <td
                  colSpan="7"
                  style={{ fontWeight: "bold", backgroundColor: "#1e293b" }}
                >
                  {item.name}
                </td>
              </tr>
              <tr className={item.quantity < item.threshold ? "low-stock" : ""}>
                <td>
                  <input
                    type="checkbox"
                    checked={isRowSelected(item.id)}
                    onChange={() => toggleRowSelection(item.id)}
                  />
                </td>

                <td style={{ paddingLeft: "2em" }}>↳ {item.name}</td>
                <td>{item.sku}</td>
                <td>
                  {item.barcode ? (
                    <Barcode value={item.barcode} width={1} height={50} />
                  ) : (
                    "No Barcode"
                  )}
                </td>
                <td>{item.quantity}</td>
                <td>{item.category}</td>
                <td>{item.threshold}</td>
                <td>
                  <button
                    className="update-button"
                    onClick={() => handleOpenUpdateModal(item)}
                  >
                    <FiEdit />
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <FiTrash2 />
                  </button>
                  <button
                    className="print-button"
                    onClick={() => handlePrintBarcode(item)}
                  >
                    <FiPrinter />
                  </button>
                </td>
              </tr>
              {item.children &&
                item.children.map((part, idx) => (
                  <tr key={`${item.id}-child-${idx}`} className="child-row">
                    <td style={{ paddingLeft: "4em" }}>
                      - Part {idx + 1}: {part.name}
                    </td>
                    <td>{part.sku}</td>
                    <td>{part.barcode}</td>
                    <td>{part.quantity}</td>
                    <td colSpan="2">Threshold: {part.threshold}</td>
                    <td>Belongs to: {item.name}</td>
                  </tr>
                ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Prev
        </button>
        <span>Page {currentPage}</span>
        <button
          disabled={
            currentPage >= Math.ceil(filteredItems.length / itemsPerPage)
          }
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </button>
      </div>

      {showUpdateModal && currentItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Update Item</h3>
            <form onSubmit={handleUpdateItem}>
              <input
                type="text"
                placeholder="Name"
                value={currentItem.name}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, name: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="SKU"
                value={currentItem.sku}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, sku: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Barcode"
                value={currentItem.barcode}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, barcode: e.target.value })
                }
                required
              />
              <input
                type="number"
                placeholder="Quantity"
                value={currentItem.quantity}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    quantity: parseInt(e.target.value),
                  })
                }
                required
              />
              <input
                type="number"
                placeholder="Threshold"
                value={currentItem.threshold}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    threshold: parseInt(e.target.value),
                  })
                }
                required
              />
              <select
                value={currentItem.category}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, category: e.target.value })
                }
                required
              >
                <option value="Select Category">Select Category</option>
                {fixedCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="modal-actions">
                <button type="submit" className="submit-button">
                  Update
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowUpdateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
