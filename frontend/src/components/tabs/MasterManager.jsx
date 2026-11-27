import React, { useState, useEffect } from "react";
import { api } from "../../services/api";

const MASTER_ENTITIES = [
  { key: "designers", label: "Designers (Creative / Concept / Total Wt)" },
  { key: "main_categories", label: "Main Category (Product Code)", hasShortCode: true },
  { key: "categories", label: "Category (Sales Code)", hasShortCode: true, parentType: "main_category" },
  { key: "subcategories_1", label: "Subcategory 1", parentType: "category" },
  { key: "subcategories_2", label: "Subcategory 2", parentType: "category" },
  { key: "metal_types", label: "Metal Type" },
  { key: "diamond_types", label: "Diamond Type" },
  { key: "shapes", label: "Shape" },
  { key: "cuts", label: "Cut" },
  { key: "colour_stones", label: "Colour Stone" },
  { key: "customer_numbers", label: "Customer Number" },
  { key: "markets", label: "Market" },
];

export default function MasterManager() {
  const [selectedEntity, setSelectedEntity] = useState(MASTER_ENTITIES[0]);
  const [items, setItems] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add / Edit form state
  const [newName, setNewName] = useState("");
  const [newShortCode, setNewShortCode] = useState("");
  const [selectedParentId, setSelectedParentId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editShortCode, setEditShortCode] = useState("");

  useEffect(() => {
    loadParentLookups();
  }, []);

  useEffect(() => {
    setEditingId(null);
    setNewName("");
    setNewShortCode("");
    setSelectedParentId("");
    loadItems(selectedEntity.key);
  }, [selectedEntity]);

  const loadParentLookups = async () => {
    try {
      const [mcs, cats] = await Promise.all([
        api.getMasterItems("main_categories"),
        api.getMasterItems("categories"),
      ]);
      setMainCategories(mcs);
      setCategories(cats);
    } catch (e) {
      console.error("Failed to load parent categories", e);
    }
  };

  const loadItems = async (entityKey) => {
    setLoading(true);
    try {
      const data = await api.getMasterItems(entityKey);
      setItems(data);
    } catch (err) {
      alert("Error loading items: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const payload = { name: newName.trim() };
    if (selectedEntity.hasShortCode) payload.short_code = newShortCode.trim();
    if (selectedEntity.parentType === "main_category" && selectedParentId) {
      payload.main_category_id = Number(selectedParentId);
    }
    if (selectedEntity.parentType === "category" && selectedParentId) {
      payload.category_id = Number(selectedParentId);
    }

    try {
      await api.createMasterItem(selectedEntity.key, payload);
      setNewName("");
      setNewShortCode("");
      await loadItems(selectedEntity.key);
      if (selectedEntity.key === "main_categories" || selectedEntity.key === "categories") {
        await loadParentLookups();
      }
    } catch (err) {
      alert("Error adding item: " + err.message);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditShortCode(item.short_code || "");
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) return;
    try {
      await api.updateMasterItem(selectedEntity.key, id, {
        name: editName.trim(),
        short_code: selectedEntity.hasShortCode ? editShortCode.trim() : null,
      });
      setEditingId(null);
      await loadItems(selectedEntity.key);
      if (selectedEntity.key === "main_categories" || selectedEntity.key === "categories") {
        await loadParentLookups();
      }
    } catch (err) {
      alert("Error updating item: " + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" from ${selectedEntity.label}?`)) return;
    try {
      await api.deleteMasterItem(selectedEntity.key, id);
      await loadItems(selectedEntity.key);
    } catch (err) {
      alert("Error deleting item: " + err.message);
    }
  };

  const getParentLabel = (item) => {
    if (selectedEntity.parentType === "main_category") {
      return mainCategories.find((m) => m.id === item.main_category_id)?.name || "—";
    }
    if (selectedEntity.parentType === "category") {
      return categories.find((c) => c.id === item.category_id)?.name || "—";
    }
    return null;
  };

  return (
    <div className="flex h-[820px] bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Left Sidebar: Master Categories */}
      <div className="w-72 border-r border-slate-200 bg-slate-50/60 p-4 flex flex-col gap-1 overflow-y-auto shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
          Master Dropdown Lists
        </span>
        {MASTER_ENTITIES.map((ent) => {
          const isActive = selectedEntity.key === ent.key;
          return (
            <button
              key={ent.key}
              onClick={() => setSelectedEntity(ent)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-700 hover:bg-slate-200/70"
              }`}
            >
              {ent.label}
            </button>
          );
        })}
      </div>

      {/* Right Content: Add & Manage Table */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="border-b border-slate-100 pb-4 mb-4">
          <h2 className="text-lg font-bold text-slate-900">{selectedEntity.label}</h2>
          <p className="text-xs text-slate-500">
            Add, edit, or remove values available in the metadata entry dropdowns.
          </p>
        </div>

        {/* Add New Form */}
        <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
          {selectedEntity.parentType === "main_category" && (
            <select
              required
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white outline-none focus:border-blue-600"
            >
              <option value="">-- Select Main Category --</option>
              {mainCategories.map((mc) => (
                <option key={mc.id} value={mc.id}>
                  {mc.name}
                </option>
              ))}
            </select>
          )}

          {selectedEntity.parentType === "category" && (
            <select
              required
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white outline-none focus:border-blue-600"
            >
              <option value="">-- Select Category --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter option name..."
            className="flex-1 min-w-[180px] rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white outline-none focus:border-blue-600"
          />

          {selectedEntity.hasShortCode && (
            <input
              type="text"
              maxLength={10}
              value={newShortCode}
              onChange={(e) => setNewShortCode(e.target.value.toUpperCase())}
              placeholder="Sketch Code (e.g. R, HP)"
              className="w-44 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono uppercase bg-white outline-none focus:border-blue-600"
            />
          )}

          <button
            type="submit"
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
          >
            + Add Option
          </button>
        </form>

        {/* Table */}
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading...</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2.5 px-4 font-bold text-slate-600 w-16">ID</th>
                  {selectedEntity.parentType && (
                    <th className="py-2.5 px-4 font-bold text-slate-600">Parent</th>
                  )}
                  <th className="py-2.5 px-4 font-bold text-slate-600">Name</th>
                  {selectedEntity.hasShortCode && (
                    <th className="py-2.5 px-4 font-bold text-slate-600 w-36">Sketch Short Code</th>
                  )}
                  <th className="py-2.5 px-4 font-bold text-slate-600 text-right w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="py-2 px-4 font-mono text-slate-400">{item.id}</td>
                      {selectedEntity.parentType && (
                        <td className="py-2 px-4 text-slate-500">{getParentLabel(item)}</td>
                      )}
                      <td className="py-2 px-4 font-semibold text-slate-800">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full rounded border border-blue-400 px-2 py-1 text-xs outline-none"
                          />
                        ) : (
                          item.name
                        )}
                      </td>
                      {selectedEntity.hasShortCode && (
                        <td className="py-2 px-4 font-mono font-bold text-blue-600">
                          {isEditing ? (
                            <input
                              type="text"
                              maxLength={10}
                              value={editShortCode}
                              onChange={(e) => setEditShortCode(e.target.value.toUpperCase())}
                              className="w-24 rounded border border-blue-400 px-2 py-1 text-xs uppercase outline-none"
                            />
                          ) : (
                            item.short_code || <span className="text-slate-300 font-normal">—</span>
                          )}
                        </td>
                      )}
                      <td className="py-2 px-4 text-right space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(item.id)}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded font-bold hover:bg-slate-300"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(item)}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded font-semibold hover:bg-slate-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded font-semibold hover:bg-rose-100"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No options added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}