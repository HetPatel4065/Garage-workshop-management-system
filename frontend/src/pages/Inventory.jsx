import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SearchBar from "../components/UI/SearchBar";
import Modal from "../components/UI/Modal";
import { useToast } from "../context/ToastContext";
import InventoryForm from "../components/Inventory/InventoryForm";
import InventoryList from "../components/Inventory/InventoryList";
import StockUpdateModal from "../components/Inventory/StockUpdateModal";
import ConfirmModal from "../components/UI/ConfirmModal";
import { Plus } from "lucide-react";
import ExportButton from "../components/common/ExportButton";
import { useSocket } from "../context/SocketContext";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const location = useLocation();
  const queryParam = new URLSearchParams(location.search).get("q") || "";
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeSearch, setActiveSearch] = useState(queryParam);

  // Sync activeSearch with URL on mount or URL change
  useEffect(() => {
    if (queryParam !== activeSearch) {
      setActiveSearch(queryParam);
    }
  }, [queryParam]);
  const [sortBy, setSortBy] = useState("default");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockItem, setStockItem] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const { addToast } = useToast();
  const { user, token } = useAuth();
  const role = user?.role || "user";
  const isMechanic = role === "mechanic";
  const navigate = useNavigate();

  const getToken = () => token;

  // 🔄 Fetch inventory
  const fetchInventory = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/inventory`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch inventory");

      setItems(data);
    } catch (err) {
      console.error(err);
      addToast(err.message, "error");
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleCreated = (newItem) => {
      setItems((prev) => {
        if (prev.some((i) => i._id === newItem._id)) return prev;
        return [...prev, newItem];
      });
    };

    const handleUpdated = (updatedItem) => {
      setItems((prev) =>
        prev.map((i) => (i._id === updatedItem._id ? updatedItem : i)),
      );
    };

    const handleDeleted = ({ _id }) => {
      setItems((prev) => prev.filter((i) => i._id !== _id));
    };

    socket.on("inventory:created", handleCreated);
    socket.on("inventory:updated", handleUpdated);
    socket.on("inventory:deleted", handleDeleted);

    return () => {
      socket.off("inventory:created", handleCreated);
      socket.off("inventory:updated", handleUpdated);
      socket.off("inventory:deleted", handleDeleted);
    };
  }, [socket]);

  // 🔍 Filter & Sort
  let filteredItems = items.filter((i) => {
    const query = (isTyping ? searchQuery : activeSearch).toLowerCase();
    return (
      (i?.name || "").toLowerCase().includes(query) ||
      (i?.sku || "").toLowerCase().includes(query) ||
      (i?.category || "").toLowerCase().includes(query) ||
      (i?.supplier?.name || "").toLowerCase().includes(query) ||
      (i?.carModel || "").toLowerCase().includes(query)
    );
  });

  if (sortBy === "carModel") {
    filteredItems.sort((a, b) =>
      (a.carModel || "Universal").localeCompare(b.carModel || "Universal"),
    );
  } else if (sortBy === "dealer") {
    filteredItems.sort((a, b) =>
      (a.supplier?.name || "").localeCompare(b.supplier?.name || ""),
    );
  }

  //  Add
  const handleAdd = () => {
    setSelectedItem(null);
    setViewOnly(false);
    setModalOpen(true);
  };

  const handleView = (item) => {
    setSelectedItem(item);
    setViewOnly(true);
    setModalOpen(true);
  };

  //  Edit
  const handleEdit = (item) => {
    setSelectedItem(item);
    setViewOnly(false);
    setModalOpen(true);
  };

  //  Delete
  const handleDelete = (id) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/inventory/${itemToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Delete failed");

      setItems(items.filter((i) => i._id !== itemToDelete));
      addToast("Item deleted", "delete");
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error(err);
      addToast(err.message, "error");
    }
  };

  //  Add / Update
  const handleSubmit = async (formData) => {
    try {
      const isEdit = !!formData._id;

      const url = isEdit
        ? `${import.meta.env.VITE_API_URL}/inventory/${formData._id}`
        : `${import.meta.env.VITE_API_URL}/inventory`;

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Full details:", JSON.stringify(data, null, 2));
        throw new Error(
          data.error ||
            data.message ||
            JSON.stringify(data) ||
            "Operation failed",
        );
      }

      if (isEdit) {
        setItems(items.map((i) => (i._id === data._id ? data : i)));
        addToast("Item updated", "success");
      } else {
        setItems([...items, data]);
        addToast("Item added", "success");
      }

      setModalOpen(false);
    } catch (err) {
      console.error(err);
      addToast(err.message, "error");
    }
  };

  //  Open stock modal
  const handleUpdateStock = (item) => {
    setStockItem(item);
    setStockModalOpen(true);
  };

  //  Update stock
  const handleStockSubmit = async (updatedItem) => {
    try {
      const token = getToken();

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/inventory/${updatedItem._id}/stock`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          // IMPORTANT: Send the keys your backend controller actually uses
          body: JSON.stringify({
            adjustmentType: updatedItem.adjustmentType || "set", // 'add', 'remove', or 'set'
            quantity: Number(updatedItem.quantity || 0), // The amount changed
            reason: updatedItem.reason || "Manual Adjustment", // For the history log
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("FULL ERROR:", data);
        addToast(data.message || data.error || "Something went wrong", "error");
        return;
      }

      // Update state using the full object returned by the backend
      setItems((prevItems) =>
        prevItems.map((i) => (i._id === data._id ? data : i)),
      );

      addToast("Stock updated", "success");
      setStockModalOpen(false);
    } catch (err) {
      console.error("Network/App Error:", err);
      addToast(err.message, "error");
    }
  };

  const exportColumns = [
    { header: "Name", accessor: "name" },
    { header: "SKU", accessor: "sku" },
    { header: "Category", accessor: "category" },
    { header: "Car Model", accessor: "carModel" },
    { header: "Quantity", accessor: "stock" },
    { header: "Unit Price", accessor: "costPrice" },
    { header: "Selling Price", accessor: "retailPrice" },
    { header: "Supplier", accessor: (row) => row.supplier?.name || "N/A" },
  ];

  return (
    <div className="p-4 sm:p-6 bg-gray-100 dark:bg-slate-950 min-h-screen">
      <div className="mb-8 pb-5 border-b-3 border-slate-200/80 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-2">
              Inventory Management
            </p>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
              Inventory
            </h1>

            <p className="text-sm font-medium text-slate-500 mt-3">
              Manage your spare parts, stock levels, and supplier information
            </p>
          </div>

          {role !== "mechanic" && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <ExportButton
                title="Inventory Items"
                columns={exportColumns}
                data={filteredItems}
                filenamePrefix="inventory"
              />
              <button
                onClick={handleAdd}
                className="
                  flex items-center gap-2
                  px-5 py-3
                  bg-blue-600 dark:bg-blue-950/90 hover:bg-blue-700
                  text-white
                  rounded-2xl
                  text-sm font-bold
                  transition-all duration-300
                  shadow-md hover:shadow-xl
                  h-10.5
                "
              >
                <Plus size={17} />
                Add Items
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Search & Sort Bar */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <SearchBar
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsTyping(true);
            }}
            onSearch={(term) => {
              const cleanTerm = term.trim();
              setIsTyping(false);
              setActiveSearch(cleanTerm);
              setSearchQuery("");
              if (cleanTerm) {
                navigate(`/inventory?q=${encodeURIComponent(cleanTerm)}`, {
                  replace: true,
                });
              } else {
                navigate("/inventory", { replace: true });
              }
            }}
            activeSearch={!isTyping && activeSearch}
            onClearActive={() => {
              setActiveSearch("");
              navigate("/inventory", { replace: true });
            }}
            placeholder="Search inventory by name, SKU, category, supplier or car model..."
            className="w-full"
          />
        </div>
        <div className="w-full lg:w-64">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
          >
            <option value="default">All Items</option>
            <option value="carModel">Sort by Car Model</option>
            <option value="dealer">Sort by Dealer</option>
          </select>
        </div>
      </div>
      <div className="mt-4 border-t border-gray-100 p-4">
        <p className="text-sm font-medium text-gray-600">
          Total Inventory Items:{" "}
          <span className="text-gray-900">{filteredItems.length}</span>
        </p>
      </div>
      <InventoryList
        items={filteredItems}
        role={role}
        groupBy={sortBy}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        onUpdateStock={handleUpdateStock}
      />
      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setViewOnly(false);
        }}
        title={
          isMechanic || viewOnly
            ? "View Item"
            : selectedItem
              ? "Edit Item"
              : "Add Item"
        }
        size="xl"
      >
        <InventoryForm
          itemData={selectedItem}
          onSubmit={handleSubmit}
          onClose={() => {
            setModalOpen(false);
            setViewOnly(false);
          }}
          existingItems={inventoryItems}
          readOnly={isMechanic || viewOnly}
        />
      </Modal>
      {/* Stock Modal */}
      {stockItem && (
        <StockUpdateModal
          isOpen={stockModalOpen}
          onClose={() => setStockModalOpen(false)}
          itemData={stockItem}
          onSubmit={handleStockSubmit}
        />
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Inventory Item"
        message="Are you sure you want to delete this item from inventory? This will remove all stock and history records."
        confirmText="Delete Item"
      />
    </div>
  );
}
