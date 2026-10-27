import { useState, useEffect, useMemo } from "react";
import {
  UtensilsCrossed, TrendingUp, TrendingDown, ShoppingCart, Plus, Search,
  Filter, Check, X, Pencil, Trash2, Coffee, Sun, Moon, Sparkles,
  Leaf, Flame, Clock, IndianRupee, LayoutGrid, List, AlertCircle, Eye, CalendarDays
} from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, SectionHeader, StatCard, StatusPill, KeyTag, Table, RowActions } from "../components/ui";
import Modal, { Field, Input, Select, TextArea, FormActions, DetailModal } from "../components/Modal";
import { useLocalStorage, nextId } from "../hooks/useLocalStorage";
import { useAuth } from "../context/AuthContext";
import { canteenTransactions as seedCanteen, messMenu as seedMessMenu, canteenMenuItems as seedMenuItems } from "../data/mockData";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import api from "../services/api";

const CATEGORIES = [
  "All",
  "South Indian",
  "Snacks & Fast Food",
  "Meals & Combos",
  "Beverages & Drinks",
  "Desserts",
];

const ITEM_CATEGORIES = [
  "South Indian",
  "Snacks & Fast Food",
  "Meals & Combos",
  "Beverages & Drinks",
  "Desserts",
  "Other"
];

const MEAL_TIMINGS = ["All Day", "Breakfast", "Lunch", "Evening Snacks", "Dinner"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function todayDayName() {
  return DAYS[(new Date().getDay() + 6) % 7];
}

function todayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

const emptyItemForm = {
  name: "",
  category: "Snacks & Fast Food",
  price: "",
  isVeg: true,
  status: "Available",
  mealTiming: "All Day",
  description: ""
};

const emptyTxnForm = {
  date: todayDateStr(),
  description: "",
  category: "Meal Sales",
  type: "Income",
  amount: ""
};

const TXN_CATEGORIES = ["Meal Sales", "Groceries", "Wages", "Utilities", "Maintenance", "Other"];
const PIE_COLORS = ["#542A52", "#FFB39A", "#7A3D77", "#D96B4E", "#68A678", "#4A7C59"];

export default function CanteenDashboard({ defaultTab = "menu-list" }) {
  const { user } = useAuth();
  const isAdminOrManager = user?.role === "admin" || user?.role === "canteen_manager" || user?.role === "warden";

  // Active Tab
  const [activeTab, setActiveTab] = useState(defaultTab);

  // 1. Canteen Menu Items State
  const [menuItems, setMenuItems] = useLocalStorage("shms:canteenItems", seedMenuItems);
  const [itemSearch, setItemSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [dietFilter, setDietFilter] = useState("All"); // All, Veg, NonVeg
  const [statusFilter, setStatusFilter] = useState("All"); // All, Available, Out of Stock
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

  // Item Modals
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  // 2. Weekly Mess Menu State
  const [messMenu, setMessMenu] = useLocalStorage("shms:messMenu", seedMessMenu);
  const [selectedDay, setSelectedDay] = useState(todayDayName());
  const [messModalOpen, setMessModalOpen] = useState(false);
  const [messForm, setMessForm] = useState({ breakfast: "", lunch: "", dinner: "" });

  // 3. Transactions State
  const [transactions, setTransactions] = useLocalStorage("shms:canteen", seedCanteen);
  const [txnModalOpen, setTxnModalOpen] = useState(false);
  const [editingTxnId, setEditingTxnId] = useState(null);
  const [txnForm, setTxnForm] = useState(emptyTxnForm);
  const [deleteTxnId, setDeleteTxnId] = useState(null);
  const [viewTxn, setViewTxn] = useState(null);
  const [txnTypeFilter, setTxnTypeFilter] = useState("All");

  // Fetch from backend API if reachable
  useEffect(() => {
    // Fetch Canteen Items
    api.get("/canteen/items")
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped = res.data.data.map((item) => ({
            _id: item._id,
            id: item.itemId || item._id,
            name: item.name,
            category: item.category,
            price: item.price,
            isVeg: item.isVeg,
            status: item.status,
            mealTiming: item.mealTiming,
            description: item.description
          }));
          setMenuItems(mapped);
        }
      })
      .catch((err) => console.log("Using cached/local canteen items", err.message));

    // Fetch Weekly Mess Menu
    api.get("/mess")
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setMessMenu(res.data.data);
        }
      })
      .catch((err) => console.log("Using cached/local mess menu", err.message));

    // Fetch Transactions
    api.get("/canteen/transactions")
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped = res.data.data.map((t) => ({
            _id: t._id,
            id: t.transactionId || t._id,
            date: t.date ? t.date.split("T")[0] : todayDateStr(),
            description: t.description,
            category: t.category,
            type: t.type,
            amount: t.amount
          }));
          setTransactions(mapped);
        }
      })
      .catch((err) => console.log("Using cached/local transactions", err.message));
  }, []);

  // Filtered Menu Items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(itemSearch.toLowerCase()));
      const matchCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchDiet =
        dietFilter === "All" ||
        (dietFilter === "Veg" && item.isVeg) ||
        (dietFilter === "NonVeg" && !item.isVeg);
      const matchStatus = statusFilter === "All" || item.status === statusFilter;
      return matchSearch && matchCategory && matchDiet && matchStatus;
    });
  }, [menuItems, itemSearch, selectedCategory, dietFilter, statusFilter]);

  // Menu Stats
  const totalItemsCount = menuItems.length;
  const availableItemsCount = menuItems.filter((i) => i.status === "Available").length;
  const vegItemsCount = menuItems.filter((i) => i.isVeg).length;
  const avgPrice = totalItemsCount > 0 ? Math.round(menuItems.reduce((acc, i) => acc + Number(i.price), 0) / totalItemsCount) : 0;

  // Toggle item availability
  const toggleItemStock = async (item) => {
    const nextStatus = item.status === "Available" ? "Out of Stock" : "Available";
    const updated = { ...item, status: nextStatus };
    setMenuItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));

    if (item._id) {
      try {
        await api.put(`/canteen/items/${item._id}`, { status: nextStatus });
      } catch (err) {
        console.error("Failed to sync item status to DB", err);
      }
    }
  };

  // Add / Edit Item Handlers
  const openAddItem = () => {
    setEditingItemId(null);
    setItemForm(emptyItemForm);
    setItemModalOpen(true);
  };

  const openEditItem = (item) => {
    setEditingItemId(item.id);
    setItemForm({
      name: item.name,
      category: item.category,
      price: item.price,
      isVeg: item.isVeg,
      status: item.status,
      mealTiming: item.mealTiming || "All Day",
      description: item.description || ""
    });
    setItemModalOpen(true);
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    const cleanItem = {
      name: itemForm.name,
      category: itemForm.category,
      price: Number(itemForm.price),
      isVeg: Boolean(itemForm.isVeg),
      status: itemForm.status,
      mealTiming: itemForm.mealTiming,
      description: itemForm.description
    };

    if (editingItemId) {
      const existing = menuItems.find((i) => i.id === editingItemId);
      const updated = { ...existing, ...cleanItem };
      setMenuItems((prev) => prev.map((i) => (i.id === editingItemId ? updated : i)));

      if (existing?._id) {
        try {
          await api.put(`/canteen/items/${existing._id}`, cleanItem);
        } catch (err) {
          console.error("Failed to update item in DB", err);
        }
      }
    } else {
      const newId = nextId(menuItems, "ITEM", 3);
      const newItem = { ...cleanItem, id: newId };
      setMenuItems((prev) => [newItem, ...prev]);

      try {
        const res = await api.post("/canteen/items", cleanItem);
        if (res.data?.success && res.data.data?._id) {
          newItem._id = res.data.data._id;
          newItem.id = res.data.data.itemId || newId;
          setMenuItems((prev) => prev.map((i) => (i.id === newId ? newItem : i)));
        }
      } catch (err) {
        console.error("Failed to save item to DB", err);
      }
    }
    setItemModalOpen(false);
  };

  const handleDeleteItem = async (id) => {
    const target = menuItems.find((i) => i.id === id);
    setMenuItems((prev) => prev.filter((i) => i.id !== id));
    setDeleteItemId(null);

    if (target?._id) {
      try {
        await api.delete(`/canteen/items/${target._id}`);
      } catch (err) {
        console.error("Failed to delete item from DB", err);
      }
    }
  };

  // Weekly Mess Menu Handlers
  const today = todayDayName();
  const currentMeal = messMenu[selectedDay] || { breakfast: "—", lunch: "—", dinner: "—" };

  const openEditMess = () => {
    setMessForm(messMenu[selectedDay] || { breakfast: "", lunch: "", dinner: "" });
    setMessModalOpen(true);
  };

  const handleMessSubmit = async (e) => {
    e.preventDefault();
    setMessMenu((prev) => ({ ...prev, [selectedDay]: messForm }));
    setMessModalOpen(false);

    try {
      await api.put(`/mess/${selectedDay}`, messForm);
    } catch (err) {
      console.error("Failed to update mess menu in DB", err);
    }
  };

  // Transaction Handlers
  const openAddTxn = () => {
    setEditingTxnId(null);
    setTxnForm(emptyTxnForm);
    setTxnModalOpen(true);
  };

  const openEditTxn = (t) => {
    setEditingTxnId(t.id);
    setTxnForm(t);
    setTxnModalOpen(true);
  };

  const handleTxnSubmit = async (e) => {
    e.preventDefault();
    const clean = { ...txnForm, amount: Number(txnForm.amount) };

    if (editingTxnId) {
      setTransactions((prev) => prev.map((t) => (t.id === editingTxnId ? { ...clean, id: editingTxnId } : t)));
    } else {
      const newId = nextId(transactions, "CNT");
      const newTxn = { ...clean, id: newId };
      setTransactions((prev) => [newTxn, ...prev]);

      try {
        const res = await api.post("/canteen/transactions", clean);
        if (res.data?.success && res.data.data?._id) {
          newTxn._id = res.data.data._id;
          newTxn.id = res.data.data.transactionId || newId;
          setTransactions((prev) => prev.map((t) => (t.id === newId ? newTxn : t)));
        }
      } catch (err) {
        console.error("Failed to save transaction to DB", err);
      }
    }
    setTxnModalOpen(false);
  };

  const handleDeleteTxn = async (id) => {
    const target = transactions.find((t) => t.id === id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setDeleteTxnId(null);

    if (target?._id) {
      try {
        await api.delete(`/canteen/transactions/${target._id}`);
      } catch (err) {
        console.error("Failed to delete transaction from DB", err);
      }
    }
  };

  // Financial Stats & Analytics
  const totalIncome = transactions.filter((t) => t.type === "Income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === "Expense").reduce((s, t) => s + Number(t.amount), 0);
  const netProfit = totalIncome - totalExpense;

  // Expense Pie Chart Data
  const expenseMap = {};
  transactions
    .filter((t) => t.type === "Expense")
    .forEach((t) => {
      expenseMap[t.category] = (expenseMap[t.category] || 0) + Number(t.amount);
    });
  const expenseChartData = Object.keys(expenseMap).map((key) => ({
    name: key,
    value: expenseMap[key],
  }));

  // Monthly Bar Chart Data
  const monthlyMap = {};
  transactions.forEach((t) => {
    const m = t.date ? t.date.slice(0, 7) : "Unknown";
    if (!monthlyMap[m]) monthlyMap[m] = { income: 0, expense: 0 };
    if (t.type === "Income") monthlyMap[m].income += Number(t.amount);
    if (t.type === "Expense") monthlyMap[m].expense += Number(t.amount);
  });
  const monthlyChartData = Object.keys(monthlyMap)
    .sort()
    .slice(-6)
    .map((k) => ({
      month: k,
      Income: monthlyMap[k].income,
      Expense: monthlyMap[k].expense,
    }));

  const sortedTxns = useMemo(() => {
    return [...transactions]
      .filter((t) => txnTypeFilter === "All" || t.type === txnTypeFilter)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, txnTypeFilter]);

  return (
    <div className="pb-12">
      <Topbar
        title="Canteen & Mess Management"
        subtitle="Manage daily food menu, weekly mess schedule, pricing, and sales"
      />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Navigation Tabs Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex items-center gap-2 bg-parchment p-1.5 rounded-xl border border-line">
            <button
              onClick={() => setActiveTab("menu-list")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "menu-list"
                  ? "bg-navy text-white shadow-sm"
                  : "text-ink/70 hover:text-ink hover:bg-white/50"
              }`}
            >
              <UtensilsCrossed size={16} />
              Canteen Menu List
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === "menu-list" ? "bg-tag text-navy" : "bg-navy/10 text-navy"
              }`}>
                {menuItems.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("mess-schedule")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "mess-schedule"
                  ? "bg-navy text-white shadow-sm"
                  : "text-ink/70 hover:text-ink hover:bg-white/50"
              }`}
            >
              <CalendarDays size={16} />
              Weekly Mess Menu
            </button>

            <button
              onClick={() => setActiveTab("sales-ledger")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "sales-ledger"
                  ? "bg-navy text-white shadow-sm"
                  : "text-ink/70 hover:text-ink hover:bg-white/50"
              }`}
            >
              <ShoppingCart size={16} />
              Sales & Ledger
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "analytics"
                  ? "bg-navy text-white shadow-sm"
                  : "text-ink/70 hover:text-ink hover:bg-white/50"
              }`}
            >
              <TrendingUp size={16} />
              Financial Overview
            </button>
          </div>

          {/* Quick Action Button */}
          {isAdminOrManager && activeTab === "menu-list" && (
            <button
              onClick={openAddItem}
              className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-navy/90 transition shadow-sm hover:shadow"
            >
              <Plus size={16} /> Add Food Item
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: CANTEEN MENU LIST (PRIMARY MODULE)                                */}
        {/* ========================================================================= */}
        {activeTab === "menu-list" && (
          <div className="space-y-6">
            {/* Quick Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Total Dishes" value={totalItemsCount} sub="in canteen catalog" icon={UtensilsCrossed} />
              <StatCard
                label="Available Right Now"
                value={availableItemsCount}
                sub={`${totalItemsCount ? Math.round((availableItemsCount / totalItemsCount) * 100) : 0}% in stock`}
                icon={Check}
                accent="tag"
              />
              <StatCard label="Pure Vegetarian" value={vegItemsCount} sub="veg friendly dishes" icon={Leaf} />
              <StatCard label="Average Price" value={`₹${avgPrice}`} sub="per dish / item" icon={IndianRupee} accent="tag" />
            </div>

            {/* Filter & Search Bar */}
            <Card className="p-5 space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input
                    type="text"
                    placeholder="Search food by name, ingredients, or description..."
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-line bg-white text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:border-navy"
                  />
                  {itemSearch && (
                    <button
                      onClick={() => setItemSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Secondary Filter Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Diet Filter */}
                  <div className="flex items-center bg-parchment p-1 rounded-lg border border-line text-xs font-medium">
                    <button
                      onClick={() => setDietFilter("All")}
                      className={`px-2.5 py-1 rounded-md transition ${dietFilter === "All" ? "bg-white font-bold text-navy shadow-xs" : "text-ink/60"}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setDietFilter("Veg")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${dietFilter === "Veg" ? "bg-white font-bold text-ok shadow-xs" : "text-ink/60"}`}
                    >
                      <span className="w-2 h-2 rounded-full bg-ok inline-block" /> Veg
                    </button>
                    <button
                      onClick={() => setDietFilter("NonVeg")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${dietFilter === "NonVeg" ? "bg-white font-bold text-warn shadow-xs" : "text-ink/60"}`}
                    >
                      <span className="w-2 h-2 rounded-full bg-warn inline-block" /> Non-Veg
                    </button>
                  </div>

                  {/* Stock Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-line rounded-lg text-xs font-medium text-ink focus:outline-none focus:border-navy"
                  >
                    <option value="All">All Stock Status</option>
                    <option value="Available">Available Only</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>

                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-parchment p-1 rounded-lg border border-line">
                    <button
                      onClick={() => setViewMode("grid")}
                      title="Card Grid View"
                      className={`p-1.5 rounded-md transition ${viewMode === "grid" ? "bg-white text-navy shadow-xs" : "text-ink/50"}`}
                    >
                      <LayoutGrid size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      title="Dense Table View"
                      className={`p-1.5 rounded-md transition ${viewMode === "table" ? "bg-white text-navy shadow-xs" : "text-ink/50"}`}
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Pills Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
                <span className="text-xs font-bold text-ink/40 uppercase tracking-wider shrink-0 mr-1">Categories:</span>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-navy text-white border-navy shadow-xs"
                        : "bg-white text-ink/70 border-line hover:border-navy/40"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </Card>

            {/* Results Count & Current Active Filters info */}
            <div className="flex items-center justify-between text-xs text-ink/60 px-1">
              <p>
                Showing <strong className="text-ink">{filteredItems.length}</strong> of {totalItemsCount} dishes
                {selectedCategory !== "All" && ` in ${selectedCategory}`}
                {dietFilter !== "All" && ` • ${dietFilter === "Veg" ? "Pure Veg" : "Non-Veg"}`}
                {statusFilter !== "All" && ` • ${statusFilter}`}
              </p>
              {(itemSearch || selectedCategory !== "All" || dietFilter !== "All" || statusFilter !== "All") && (
                <button
                  onClick={() => {
                    setItemSearch("");
                    setSelectedCategory("All");
                    setDietFilter("All");
                    setStatusFilter("All");
                  }}
                  className="text-navy font-semibold hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* ================= GRID VIEW ================= */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between hover:shadow-md ${
                      item.status === "Available" ? "border-line hover:border-navy/30" : "border-line/60 bg-parchment/30 opacity-80"
                    }`}
                  >
                    <div className="p-5 space-y-3">
                      {/* Top Bar: Diet Icon, Category & Stock Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {/* Standard Indian Veg / Non-Veg Indicator */}
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                              item.isVeg ? "border-ok bg-ok/5" : "border-warn bg-warn/5"
                            }`}
                            title={item.isVeg ? "Pure Vegetarian" : "Non-Vegetarian"}
                          >
                            <div className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-ok" : "bg-warn"}`} />
                          </div>

                          <span className="text-[11px] font-semibold text-ink/50 uppercase tracking-wide">
                            {item.category}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                            item.status === "Available"
                              ? "bg-ok/10 text-ok border border-ok/20"
                              : "bg-warn/10 text-warn border border-warn/20"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.status === "Available" ? "bg-ok" : "bg-warn"}`} />
                          {item.status}
                        </span>
                      </div>

                      {/* Dish Title & Description */}
                      <div>
                        <h4 className="text-base font-bold text-ink leading-snug tracking-tight">
                          {item.name}
                        </h4>
                        <p className="text-xs text-ink/60 mt-1 line-clamp-2 leading-relaxed">
                          {item.description || "Freshly prepared in hostel canteen with hygienic ingredients."}
                        </p>
                      </div>

                      {/* Meal Timing Pill & ID */}
                      <div className="flex items-center justify-between text-xs text-ink/50 pt-1">
                        <span className="flex items-center gap-1 bg-parchment px-2 py-0.5 rounded-md text-[11px] font-medium text-ink/70">
                          <Clock size={12} /> {item.mealTiming || "All Day"}
                        </span>
                        <KeyTag>{item.id}</KeyTag>
                      </div>
                    </div>

                    {/* Bottom Pricing & Actions Strip */}
                    <div className="px-5 py-3.5 bg-parchment/60 border-t border-line flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-ink/40 uppercase font-bold block -mb-0.5">Price</span>
                        <span className="text-lg font-black text-navy font-display">
                          ₹{Number(item.price).toLocaleString("en-IN")}
                        </span>
                      </div>

                      {isAdminOrManager && (
                        <div className="flex items-center gap-1.5">
                          {/* Quick Stock Toggle */}
                          <button
                            onClick={() => toggleItemStock(item)}
                            title={item.status === "Available" ? "Mark Out of Stock" : "Mark Available"}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
                              item.status === "Available"
                                ? "bg-white text-ink/70 border-line hover:border-warn hover:text-warn"
                                : "bg-ok text-white border-ok hover:bg-ok/90"
                            }`}
                          >
                            {item.status === "Available" ? "Mark Sold Out" : "Set In Stock"}
                          </button>

                          <button
                            onClick={() => openEditItem(item)}
                            title="Edit Item"
                            className="p-1.5 text-ink/60 hover:text-navy hover:bg-white rounded-lg transition"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            onClick={() => setDeleteItemId(item.id)}
                            title="Delete Item"
                            className="p-1.5 text-ink/60 hover:text-warn hover:bg-white rounded-lg transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ================= TABLE VIEW ================= */}
            {viewMode === "table" && (
              <Card className="overflow-hidden">
                <Table headers={["ID", "Dish Name", "Category", "Diet", "Serving Time", "Price", "Status", "Actions"]}>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-parchment/60 transition-colors">
                      <td className="py-3 px-4"><KeyTag>{item.id}</KeyTag></td>
                      <td className="py-3 px-4 font-semibold text-ink">
                        {item.name}
                        {item.description && (
                          <span className="block text-xs font-normal text-ink/50 truncate max-w-xs">{item.description}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-ink/70">{item.category}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
                          item.isVeg ? "bg-ok/10 text-ok" : "bg-warn/10 text-warn"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-ok" : "bg-warn"}`} />
                          {item.isVeg ? "Veg" : "Non-Veg"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-ink/70">{item.mealTiming || "All Day"}</td>
                      <td className="py-3 px-4 font-bold text-navy font-display">₹{Number(item.price).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => isAdminOrManager && toggleItemStock(item)}
                          title={isAdminOrManager ? "Click to toggle status" : undefined}
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold cursor-pointer ${
                            item.status === "Available"
                              ? "bg-ok/10 text-ok border border-ok/20 hover:bg-ok/20"
                              : "bg-warn/10 text-warn border border-warn/20 hover:bg-warn/20"
                          }`}
                        >
                          {item.status}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <RowActions
                          onView={() => setViewItem(item)}
                          onEdit={isAdminOrManager ? () => openEditItem(item) : undefined}
                          onDelete={isAdminOrManager ? () => setDeleteItemId(item.id) : undefined}
                        />
                      </td>
                    </tr>
                  ))}
                </Table>
              </Card>
            )}

            {filteredItems.length === 0 && (
              <div className="bg-white rounded-2xl border border-line p-12 text-center space-y-3">
                <UtensilsCrossed size={40} className="mx-auto text-ink/30" />
                <h3 className="text-base font-bold text-ink">No menu dishes found</h3>
                <p className="text-sm text-ink/50 max-w-md mx-auto">
                  Try adjusting your search query, diet filter, or category selector to see available canteen food items.
                </p>
                {isAdminOrManager && (
                  <button
                    onClick={openAddItem}
                    className="mt-2 inline-flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-navy/90 transition"
                  >
                    <Plus size={15} /> Add a new dish
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: WEEKLY MESS MENU                                                  */}
        {/* ========================================================================= */}
        {activeTab === "mess-schedule" && (
          <div className="space-y-6">
            {/* Day Selector Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`text-sm font-semibold px-4 py-2 rounded-xl border transition-all ${
                    selectedDay === d
                      ? "bg-navy text-white border-navy shadow-sm"
                      : "bg-white text-ink/70 border-line hover:border-navy/40"
                  }`}
                >
                  {d}
                  {d === today && (
                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      selectedDay === d ? "bg-tag text-navy" : "bg-navy/10 text-navy"
                    }`}>
                      Today
                    </span>
                  )}
                </button>
              ))}
            </div>

            <SectionHeader
              eyebrow={selectedDay === today ? "Today's Schedule" : "Viewing Schedule"}
              title={`${selectedDay}'s Hostel Mess Menu`}
              action={
                isAdminOrManager && (
                  <button
                    onClick={openEditMess}
                    className="flex items-center gap-1.5 bg-navy text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-navy/90 transition shadow-sm"
                  >
                    <Pencil size={14} /> Edit {selectedDay}'s Menu
                  </button>
                )
              }
            />

            {/* Meal Time Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Breakfast Card */}
              <Card className="p-6 space-y-4 border-t-4 border-t-[#D96B4E]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#D96B4E]/10 text-[#D96B4E] flex items-center justify-center">
                      <Coffee size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Morning</p>
                      <h4 className="text-base font-bold text-ink">Breakfast</h4>
                    </div>
                  </div>
                  <span className="text-xs text-ink/50 bg-parchment px-2.5 py-1 rounded-md font-medium">
                    7:30 AM – 9:30 AM
                  </span>
                </div>
                <div className="bg-parchment/60 rounded-xl p-4 border border-line">
                  <p className="text-sm font-medium text-ink leading-relaxed">
                    {currentMeal.breakfast || "No breakfast scheduled"}
                  </p>
                </div>
              </Card>

              {/* Lunch Card */}
              <Card className="p-6 space-y-4 border-t-4 border-t-[#68A678]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#68A678]/10 text-[#68A678] flex items-center justify-center">
                      <Sun size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Afternoon</p>
                      <h4 className="text-base font-bold text-ink">Lunch</h4>
                    </div>
                  </div>
                  <span className="text-xs text-ink/50 bg-parchment px-2.5 py-1 rounded-md font-medium">
                    12:30 PM – 2:30 PM
                  </span>
                </div>
                <div className="bg-parchment/60 rounded-xl p-4 border border-line">
                  <p className="text-sm font-medium text-ink leading-relaxed">
                    {currentMeal.lunch || "No lunch scheduled"}
                  </p>
                </div>
              </Card>

              {/* Dinner Card */}
              <Card className="p-6 space-y-4 border-t-4 border-t-[#542A52]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#542A52]/10 text-[#542A52] flex items-center justify-center">
                      <Moon size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Night</p>
                      <h4 className="text-base font-bold text-ink">Dinner</h4>
                    </div>
                  </div>
                  <span className="text-xs text-ink/50 bg-parchment px-2.5 py-1 rounded-md font-medium">
                    7:30 PM – 9:30 PM
                  </span>
                </div>
                <div className="bg-parchment/60 rounded-xl p-4 border border-line">
                  <p className="text-sm font-medium text-ink leading-relaxed">
                    {currentMeal.dinner || "No dinner scheduled"}
                  </p>
                </div>
              </Card>
            </div>

            {/* Full 7-Day Table Overview */}
            <Card className="p-6 space-y-4">
              <SectionHeader eyebrow="Weekly Overview" title="Complete 7-Day Meal Calendar" />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs font-bold text-ink/40 uppercase tracking-wider">
                      <th className="py-3 px-4">Day</th>
                      <th className="py-3 px-4">Breakfast (7:30 - 9:30 AM)</th>
                      <th className="py-3 px-4">Lunch (12:30 - 2:30 PM)</th>
                      <th className="py-3 px-4">Dinner (7:30 - 9:30 PM)</th>
                      {isAdminOrManager && <th className="py-3 px-4 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {DAYS.map((day) => {
                      const m = messMenu[day] || {};
                      const isToday = day === today;
                      return (
                        <tr
                          key={day}
                          className={`hover:bg-parchment/60 transition ${isToday ? "bg-tag/10 font-medium" : ""}`}
                        >
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-bold text-ink">{day}</span>
                            {isToday && (
                              <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-tag text-navy font-bold uppercase">
                                Today
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-ink/80">{m.breakfast || "—"}</td>
                          <td className="py-3 px-4 text-ink/80">{m.lunch || "—"}</td>
                          <td className="py-3 px-4 text-ink/80">{m.dinner || "—"}</td>
                          {isAdminOrManager && (
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedDay(day);
                                  setMessForm(m);
                                  setMessModalOpen(true);
                                }}
                                className="text-xs font-semibold text-navy hover:underline"
                              >
                                Edit
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SALES & LEDGER                                                    */}
        {/* ========================================================================= */}
        {activeTab === "sales-ledger" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-ink/50 uppercase">Filter by Type:</span>
                <div className="flex items-center bg-parchment p-1 rounded-lg border border-line text-xs font-medium">
                  {["All", "Income", "Expense"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTxnTypeFilter(t)}
                      className={`px-3 py-1 rounded-md transition ${txnTypeFilter === t ? "bg-white font-bold text-navy shadow-xs" : "text-ink/60"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {isAdminOrManager && (
                <button
                  onClick={openAddTxn}
                  className="flex items-center gap-1.5 bg-navy text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-navy/90 transition shadow-sm"
                >
                  <Plus size={15} /> Add Transaction
                </button>
              )}
            </div>

            <Card className="p-6">
              <SectionHeader eyebrow="Ledger" title="Canteen Income & Expense Records" />
              <Table headers={["ID", "Date", "Description", "Category", "Type", "Amount", "Actions"]}>
                {sortedTxns.map((t) => (
                  <tr key={t.id} className="hover:bg-parchment/60 transition">
                    <td className="py-3 px-4"><KeyTag>{t.id}</KeyTag></td>
                    <td className="py-3 px-4 text-ink/70">{t.date}</td>
                    <td className="py-3 px-4 font-semibold text-ink">{t.description}</td>
                    <td className="py-3 px-4 text-xs font-medium text-ink/70">{t.category}</td>
                    <td className="py-3 px-4"><StatusPill status={t.type} /></td>
                    <td className={`py-3 px-4 font-bold ${t.type === "Income" ? "text-ok" : "text-warn"}`}>
                      {t.type === "Income" ? "+" : "-"}₹{Number(t.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <RowActions
                        onView={() => setViewTxn(t)}
                        onEdit={isAdminOrManager ? () => openEditTxn(t) : undefined}
                        onDelete={isAdminOrManager ? () => setDeleteTxnId(t.id) : undefined}
                      />
                    </td>
                  </tr>
                ))}
                {sortedTxns.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-ink/45">
                      No transactions found for the selected filter.
                    </td>
                  </tr>
                )}
              </Table>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: FINANCIAL ANALYTICS                                               */}
        {/* ========================================================================= */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Sales/Income" value={`₹${totalIncome.toLocaleString("en-IN")}`} icon={TrendingUp} />
              <StatCard label="Total Expenses" value={`₹${totalExpense.toLocaleString("en-IN")}`} icon={TrendingDown} accent="tag" />
              <StatCard
                label="Net Profit/Loss"
                value={`${netProfit >= 0 ? "+" : "-"}₹${Math.abs(netProfit).toLocaleString("en-IN")}`}
                sub={netProfit >= 0 ? "Profitable" : "Deficit"}
                icon={ShoppingCart}
              />
              <StatCard label="Total Transactions" value={transactions.length} icon={UtensilsCrossed} accent="tag" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Expense Pie Chart */}
              <Card className="lg:col-span-1 p-6">
                <SectionHeader eyebrow="Analysis" title="Expense Breakdown" />
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={expenseChartData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expenseChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 11, color: "#2F172E99" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Monthly Trend Bar Chart */}
              <Card className="lg:col-span-2 p-6">
                <SectionHeader eyebrow="Revenue Trend" title="Monthly Income vs Expense" />
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={monthlyChartData} margin={{ left: -10, top: 10 }}>
                      <CartesianGrid stroke="#EADBE6" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#2F172E99" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: "#2F172E99" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: "1px solid #EADBE6", fontSize: 13 }}
                        formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Income" fill="#68A678" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Expense" fill="#D95B5B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* 1. Add / Edit Menu Item Modal */}
      <Modal
        open={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title={editingItemId ? "Edit Menu Dish" : "Add New Dish to Menu"}
      >
        <form onSubmit={handleItemSubmit} className="space-y-4">
          <Field label="Dish Name">
            <Input
              required
              placeholder="e.g. Masala Dosa, Cold Coffee, Veg Biryani"
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Category">
              <Select
                options={ITEM_CATEGORIES}
                value={itemForm.category}
                onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
              />
            </Field>

            <Field label="Price (₹)">
              <Input
                type="number"
                min={0}
                required
                placeholder="e.g. 50"
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Diet Type">
              <Select
                options={["Pure Veg", "Non-Veg"]}
                value={itemForm.isVeg ? "Pure Veg" : "Non-Veg"}
                onChange={(e) => setItemForm({ ...itemForm, isVeg: e.target.value === "Pure Veg" })}
              />
            </Field>

            <Field label="Serving Timing">
              <Select
                options={MEAL_TIMINGS}
                value={itemForm.mealTiming}
                onChange={(e) => setItemForm({ ...itemForm, mealTiming: e.target.value })}
              />
            </Field>

            <Field label="Stock Status">
              <Select
                options={["Available", "Out of Stock"]}
                value={itemForm.status}
                onChange={(e) => setItemForm({ ...itemForm, status: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Description / Key Ingredients">
            <TextArea
              rows={3}
              placeholder="Crispy crepe with spiced potato masala, served with sambar and coconut chutney..."
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
            />
          </Field>

          <FormActions
            onCancel={() => setItemModalOpen(false)}
            submitLabel={editingItemId ? "Update Dish" : "Save to Menu"}
          />
        </form>
      </Modal>

      {/* 2. Detail Modal for Food Item */}
      <DetailModal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem?.name}
        subtitle={viewItem?.category}
        rows={
          viewItem
            ? [
                { label: "Item ID", value: <KeyTag>{viewItem.id}</KeyTag> },
                { label: "Price", value: `₹${Number(viewItem.price).toLocaleString("en-IN")}` },
                {
                  label: "Diet",
                  value: (
                    <span className={`inline-flex items-center gap-1 font-semibold ${viewItem.isVeg ? "text-ok" : "text-warn"}`}>
                      <span className={`w-2 h-2 rounded-full ${viewItem.isVeg ? "bg-ok" : "bg-warn"}`} />
                      {viewItem.isVeg ? "Pure Veg" : "Non-Veg"}
                    </span>
                  ),
                },
                { label: "Timing", value: viewItem.mealTiming || "All Day" },
                { label: "Status", value: <StatusPill status={viewItem.status} /> },
                { label: "Description", value: viewItem.description || "—" },
              ]
            : []
        }
      />

      {/* 3. Confirm Delete Item Modal */}
      <Modal open={!!deleteItemId} onClose={() => setDeleteItemId(null)} title="Delete Menu Dish">
        <p className="text-sm text-ink/70 mb-5">
          Are you sure you want to remove this dish from the canteen menu? Students will no longer see it.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setDeleteItemId(null)}
            className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => handleDeleteItem(deleteItemId)}
            className="px-4 py-2 text-sm font-semibold bg-warn text-white rounded-lg hover:bg-warn/90"
          >
            Delete Dish
          </button>
        </div>
      </Modal>

      {/* 4. Edit Mess Day Menu Modal */}
      <Modal open={messModalOpen} onClose={() => setMessModalOpen(false)} title={`Edit ${selectedDay}'s Mess Menu`}>
        <form onSubmit={handleMessSubmit} className="space-y-4">
          <Field label="Breakfast (7:30 - 9:30 AM)">
            <TextArea
              required
              rows={2}
              placeholder="e.g. Idli, Sambar, Chutney, Tea / Coffee"
              value={messForm.breakfast}
              onChange={(e) => setMessForm({ ...messForm, breakfast: e.target.value })}
            />
          </Field>
          <Field label="Lunch (12:30 - 2:30 PM)">
            <TextArea
              required
              rows={2}
              placeholder="e.g. Rice, Dal Tadka, Seasonal Veg Curry, Curd, Papad"
              value={messForm.lunch}
              onChange={(e) => setMessForm({ ...messForm, lunch: e.target.value })}
            />
          </Field>
          <Field label="Dinner (7:30 - 9:30 PM)">
            <TextArea
              required
              rows={2}
              placeholder="e.g. Chapati, Paneer Butter Masala, Jeera Rice"
              value={messForm.dinner}
              onChange={(e) => setMessForm({ ...messForm, dinner: e.target.value })}
            />
          </Field>
          <FormActions onCancel={() => setMessModalOpen(false)} submitLabel="Save Menu" />
        </form>
      </Modal>

      {/* 5. Add / Edit Transaction Modal */}
      <Modal open={txnModalOpen} onClose={() => setTxnModalOpen(false)} title={editingTxnId ? "Edit Transaction" : "Record Canteen Transaction"}>
        <form onSubmit={handleTxnSubmit} className="space-y-4">
          <Field label="Date">
            <Input
              type="date"
              required
              value={txnForm.date}
              onChange={(e) => setTxnForm({ ...txnForm, date: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <Input
              required
              placeholder="e.g. Daily student meal sales / Rice bulk purchase"
              value={txnForm.description}
              onChange={(e) => setTxnForm({ ...txnForm, description: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Category">
              <Select
                options={TXN_CATEGORIES}
                value={txnForm.category}
                onChange={(e) => setTxnForm({ ...txnForm, category: e.target.value })}
              />
            </Field>
            <Field label="Transaction Type">
              <Select
                options={["Income", "Expense"]}
                value={txnForm.type}
                onChange={(e) => setTxnForm({ ...txnForm, type: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Amount (₹)">
            <Input
              type="number"
              min={0}
              required
              placeholder="e.g. 15000"
              value={txnForm.amount}
              onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })}
            />
          </Field>
          <FormActions onCancel={() => setTxnModalOpen(false)} submitLabel={editingTxnId ? "Save Changes" : "Record Transaction"} />
        </form>
      </Modal>

      {/* 6. Transaction Detail Modal */}
      <DetailModal
        open={!!viewTxn}
        onClose={() => setViewTxn(null)}
        title={viewTxn?.id}
        subtitle={viewTxn?.description}
        rows={
          viewTxn
            ? [
                { label: "Transaction ID", value: <KeyTag>{viewTxn.id}</KeyTag> },
                { label: "Date", value: viewTxn.date },
                { label: "Description", value: viewTxn.description },
                { label: "Category", value: viewTxn.category },
                { label: "Type", value: <StatusPill status={viewTxn.type} /> },
                { label: "Amount", value: `₹${Number(viewTxn.amount).toLocaleString("en-IN")}` },
              ]
            : []
        }
      />

      {/* 7. Confirm Delete Transaction Modal */}
      <Modal open={!!deleteTxnId} onClose={() => setDeleteTxnId(null)} title="Delete Transaction">
        <p className="text-sm text-ink/70 mb-5">
          Are you sure you want to delete this canteen transaction? This will adjust your financial totals.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setDeleteTxnId(null)}
            className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => handleDeleteTxn(deleteTxnId)}
            className="px-4 py-2 text-sm font-semibold bg-warn text-white rounded-lg hover:bg-warn/90"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
