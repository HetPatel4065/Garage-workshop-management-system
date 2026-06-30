import { useState, useEffect } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import Modal from "../UI/Modal";

const API = import.meta.env.VITE_API_URL;
const CAR_CATEGORIES = [
  "Hatchback",
  "Sedan",
  "Compact SUV",
  "SUV",
  "MPV",
  "Luxury",
  "Ultra Luxury",
];

const SERVICE_NAMES = [
  "Basic Service",
  "Periodic Service",
  "Full Service",
  "Major Service",
  "Engine Oil Change",
  "Oil Filter Replacement",
  "Air Filter Replacement",
  "Brake Pad Replacement",
  "Brake Shoe Replacement",
  "Brake Fluid Replacement",
  "Wheel Alignment",
  "Wheel Balancing",
  "Tyre Rotation",
  "Tyre Replacement",
  "AC Gas Refill",
  "AC Service",
  "Battery Replacement",
  "Battery Check",
  "Clutch Replacement",
  "Gearbox Oil Change",
  "Spark Plug Replacement",
  "Coolant Flush",
  "Radiator Cleaning",
  "Engine Diagnostics",
  "OBD Scan",
  "Car Wash",
  "Interior Cleaning",
  "Denting",
  "Painting",
  "Scratch Removal",
];

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

export default function ServicePricingSettings({ token }) {
  const [allPricing, setAllPricing] = useState([]);
  const [activeCategory, setActiveCategory] = useState("Hatchback");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  // Add form
  const [newService, setNewService] = useState("");
  const [newMin, setNewMin] = useState("");
  const [newMax, setNewMax] = useState("");

  // Edit modal
  const [editingEntry, setEditingEntry] = useState(null); // { _id, serviceName, minPrice, maxPrice, carCategory }
  const [editMin, setEditMin] = useState("");
  const [editMax, setEditMax] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/service-pricing`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAllPricing(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const entriesForCategory = allPricing.filter(
    (p) => p.carCategory === activeCategory,
  );

  // ── Add new entry ──
  const handleSaveEntry = async () => {
    if (!newService || !newMin || !newMax) return;
    if (Number(newMin) > Number(newMax)) {
      showToast("Min price cannot exceed max price");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/service-pricing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          carCategory: activeCategory,
          serviceName: newService,
          minPrice: Number(newMin),
          maxPrice: Number(newMax),
        }),
      });
      if (res.ok) {
        showToast("Added!");
        setNewService("");
        setNewMin("");
        setNewMax("");
        fetchAll();
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Open edit modal ──
  const handleEditClick = (entry) => {
    setEditingEntry(entry);
    setEditMin(String(entry.minPrice));
    setEditMax(String(entry.maxPrice));
  };

  // ── Save edited entry ──
  const handleEditSave = async () => {
    if (!editingEntry) return;
    if (Number(editMin) > Number(editMax)) {
      showToast("Min price cannot exceed max price");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/service-pricing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          carCategory: editingEntry.carCategory,
          serviceName: editingEntry.serviceName,
          minPrice: Number(editMin),
          maxPrice: Number(editMax),
        }),
      });
      if (res.ok) {
        showToast("Updated!");
        setEditingEntry(null);
        fetchAll();
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async (id) => {
    await fetch(`${API}/service-pricing/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    showToast("Deleted");
    fetchAll();
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          {/* Edit Modal */}
          <Modal
            isOpen={!!editingEntry}
            onClose={() => setEditingEntry(null)}
            title={
              editingEntry ? `Edit Price — ${editingEntry.serviceName}` : ""
            }
            subtitle={
              editingEntry ? `Category: ${editingEntry.carCategory}` : ""
            }
            size="sm"
            footer={
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingEntry(null)}
                  className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={saving}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            }
          >
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Min (₹)
                </label>
                <input
                  type="number"
                  value={editMin}
                  onChange={(e) => setEditMin(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Max (₹)
                </label>
                <input
                  type="number"
                  value={editMax}
                  onChange={(e) => setEditMax(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </Modal>
        </div>
      )}

      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white">
          Service Pricing
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Set min–max price ranges per service for each car category. These show
          as estimates when creating job cards.
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CAR_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
              activeCategory === cat
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add new entry */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-2xl p-3 relative">
        <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3">
          Add price for {activeCategory}
        </p>
        <button
          onClick={() => {
            setNewService("");
            setNewMin("");
            setNewMax("");
          }}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-red-400 hover:text-white hover:bg-red-600 rounded-full text-xs font-black transition-all"
          title="Clear"
        >
          ✕
        </button>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-45">
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Service
            </label>
            <select
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="">-- Select Service --</option>
              {SERVICE_NAMES.filter(
                (s) => !entriesForCategory.find((e) => e.serviceName === s),
              ).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Min (₹)
            </label>
            <input
              type="number"
              value={newMin}
              onChange={(e) => setNewMin(e.target.value)}
              placeholder="500"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="w-28">
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Max (₹)
            </label>
            <input
              type="number"
              value={newMax}
              onChange={(e) => setNewMax(e.target.value)}
              placeholder="1500"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSaveEntry}
            disabled={saving || !newService || !newMin || !newMax}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all h-9"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      {/* Existing entries table */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entriesForCategory.length === 0 ? (
        <div className="text-center py-10 text-sm text-slate-400">
          No prices set for {activeCategory} yet. Add one above.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                  Service
                </th>
                <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                  Range
                </th>
                <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entriesForCategory.map((entry) => (
                <tr
                  key={entry._id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {entry.serviceName}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-semibold">
                    {formatINR(entry.minPrice)} – {formatINR(entry.maxPrice)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(entry)}
                        className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(entry._id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
