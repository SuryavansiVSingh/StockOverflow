// Full Users.js - with multi-filter support and search bar

import React, { useEffect, useState } from "react";
import Barcode from "react-barcode";
import "./Dashboard.css";
import { FaPlus, FaFilter, FaEdit, FaTrash, FaPrint } from "react-icons/fa";

const ROLES = ["manager", "supervisor", "worker", "temp"];

const Users = () => {
  const [users, setUsers] = useState([]);
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState({ username: "", role: "worker", password: "" });
  const [editingUsers, setEditingUsers] = useState([]);
  const [editForms, setEditForms] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [filters, setFilters] = useState({ search: "", role: "", is_active: "" });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/users/");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Error loading users", err);
    }
  };

  const handleAddUser = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/users/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ username: "", role: "worker", password: "" });
        fetchUsers();
      } else {
        alert("Failed to add user.");
      }
    } catch (err) {
      console.error("Error adding user", err);
    }
  };

  const handleEditUser = async () => {
    for (const form of editForms) {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      await fetch(`http://127.0.0.1:8000/api/users/${form.id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setEditingUsers([]); setSelectedUsers([]); fetchUsers();
  };

  const handleBulkDelete = async () => {
    if (!window.confirm("Delete selected users?")) return;
    for (const id of selectedUsers) {
      await fetch(`http://127.0.0.1:8000/api/users/${id}/`, { method: "DELETE" });
    }
    setSelectedUsers([]); fetchUsers();
  };

  const handleRowDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    await fetch(`http://127.0.0.1:8000/api/users/${id}/`, { method: "DELETE" });
    fetchUsers();
  };

  const printBarcode = (username, uniqueId) => {
    const win = window.open("", "PRINT", "height=600,width=400");
    win.document.write(`<html><head><title>${username}</title></head><body style='text-align:center;font-family:sans-serif'>`);
    win.document.write(`<h3>${username}</h3><svg id='barcode'></svg></body></html>`);
    const script = win.document.createElement("script");
    script.onload = () => {
      win.JsBarcode("#barcode", uniqueId, { format: "CODE128", height: 80, width: 2, displayValue: true });
      win.print(); win.close();
    };
    script.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js";
    win.document.body.appendChild(script);
  };

  const toggleSelectUser = (id) => {
    setSelectedUsers((prev) => prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]);
  };

  const handleActionButton = (userId = null) => {
    const selected = userId ? users.filter((u) => u.id === userId) : users.filter((u) => selectedUsers.includes(u.id));
    if (selected.length === 0) return alert("No users selected");
    setEditingUsers(selected);
    setEditForms(selected.map((u) => ({ id: u.id, username: u.username, role: u.role, is_active: u.is_active, password: "" })));
    setIsBulkEdit(!userId);
  };

  const updateEditForm = (index, field, value) => {
    const updated = [...editForms];
    updated[index][field] = value;
    setEditForms(updated);
  };

  const applyFilters = (user) => {
    const searchMatch = filters.search === "" ||
      user.username.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.role.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.unique_id.toLowerCase().includes(filters.search.toLowerCase()) ||
      (user.is_active ? "active" : "inactive").includes(filters.search.toLowerCase());

    const roleMatch = !filters.role || user.role === filters.role;
    const activeMatch = filters.is_active === "" || (filters.is_active === "active" && user.is_active) || (filters.is_active === "inactive" && !user.is_active);

    return searchMatch && roleMatch && activeMatch;
  };

  const clearFilter = (key) => setFilters({ ...filters, [key]: "" });

  return (
    <div className="dashboard-section">
      <h2 className="dashboard-title">User Management</h2>

      <div className="dashboard-filters">
        <input className="search-input" placeholder="Search" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <select className="category-select" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="category-select" value={filters.is_active} onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="action-buttons">
        <button onClick={() => setFormVisible(!formVisible)} className="action-button" title="Add user">
          <FaPlus /> Add User
        </button>
        <button onClick={() => setFilters({ search: "", role: "", is_active: "" })} className="action-button" title="Clear filters">
          <FaFilter /> Reset Filters
        </button>
        <button onClick={() => handleActionButton()} className="action-button" title="Edit selected users">
          <FaEdit /> Actions
        </button>
      </div>

      {formVisible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New User</h3>
            <div className="edit-form">
              <label htmlFor="username">Username</label>
              <input id="username" placeholder="Enter username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              <label htmlFor="role">Role</label>
              <select id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
              <label htmlFor="password">Password</label>
              <input id="password" type="password" placeholder="Enter password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="submit-button" onClick={handleAddUser}>Submit</button>
              <button className="cancel-button" onClick={() => setFormVisible(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <table className="inventory-table">
        <thead>
          <tr><th></th><th>Username</th><th>Role</th><th>Status</th><th>Unique ID</th><th>Barcode</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {users.filter(applyFilters).map((u) => (
            <tr key={u.id}>
              <td><input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => toggleSelectUser(u.id)} /></td>
              <td>{u.username}</td>
              <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
              <td><span className={u.is_active ? "status-active" : "status-inactive"}>{u.is_active ? "Active" : "Inactive"}</span></td>
              <td>{u.unique_id}</td>
              <td><Barcode value={u.unique_id} width={1.2} height={40} /></td>
              <td>
                <button className="update-button" onClick={() => handleActionButton(u.id)} title="Edit User"><FaEdit /></button>
                <button className="print-button" onClick={() => printBarcode(u.username, u.unique_id)} title="Print ID"><FaPrint /></button>
                <button className="delete-button" onClick={() => handleRowDelete(u.id)} title="Delete User"><FaTrash /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingUsers.length > 0 && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Selected Users</h3>
            {editForms.map((userForm, index) => (
              <div key={userForm.id} className="edit-form">
                <label>Username</label>
                <input value={userForm.username} onChange={(e) => updateEditForm(index, "username", e.target.value)} />
                <label>Role</label>
                <select value={userForm.role} onChange={(e) => updateEditForm(index, "role", e.target.value)}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
                <label>Status</label>
                <div className="status-toggle">
                  <label className="switch-label">
                    <input type="checkbox" checked={userForm.is_active} onChange={(e) => updateEditForm(index, "is_active", e.target.checked)} />
                    <span className="slider" />
                  </label>
                  <span className="switch-text">{userForm.is_active ? "Active" : "Inactive"}</span>
                </div>
                <label>New Password (optional)</label>
                <input type="password" value={userForm.password} onChange={(e) => updateEditForm(index, "password", e.target.value)} />
              </div>
            ))}
            <div className="modal-actions">
              <button className="submit-button" onClick={handleEditUser}>Save</button>
              <button className="cancel-button" onClick={() => setEditingUsers([])}>Cancel</button>
              {isBulkEdit && (<button className="delete-button" onClick={handleBulkDelete}><FaTrash /> Delete Selected</button>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
