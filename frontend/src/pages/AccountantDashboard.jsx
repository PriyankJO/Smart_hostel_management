import { useState, useEffect, useMemo } from "react";
import {
  Wallet, TrendingUp, TrendingDown, Activity, Plus, Search,
  Filter, FileText, ArrowUpRight, ArrowDownLeft, Calendar,
  CreditCard, CheckCircle2, Clock, Landmark, IndianRupee, Trash2, Pencil, Eye, X
} from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, SectionHeader, StatCard, Table, StatusPill, KeyTag, RowActions } from "../components/ui";
import Modal, { Field, Input, Select, TextArea, FormActions, DetailModal } from "../components/Modal";
import { useLocalStorage, nextId } from "../hooks/useLocalStorage";
import { useAuth } from "../context/AuthContext";
import { fees as seedFees, salaryRecords as seedSalaries, financeTransactions as seedFinanceTxns } from "../data/mockData";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend } from "recharts";
import api from "../services/api";

const CATEGORIES_BY_TYPE = {
  Income: [
    "Admission & Registration",
    "Hostel Fee Collections",
    "Canteen Revenue",
    "Fines & Penalties",
    "Guest Room Rent",
    "Sponsorship / Donations",
    "Other Income"
  ],
  Expense: [
    "Utilities & Bills",
    "Mess & Groceries",
    "Facility Maintenance",
    "Staff Wages & Salaries",
    "Internet & Wi-Fi",
    "Security & Guard Services",
    "Pest Control & Sanitization",
    "Equipment & Furniture",
    "Other Expense"
  ]
};

const ALL_CATEGORIES = [
  "All",
  "Utilities & Bills",
  "Admission & Registration",
  "Mess & Groceries",
  "Facility Maintenance",
  "Internet & Wi-Fi",
  "Canteen Revenue",
  "Fines & Penalties",
  "Guest Room Rent",
  "Hostel Fee Collections",
  "Other Expense"
];

const PAYMENT_METHODS = [
  "UPI",
  "UPI Transaction",
  "UPI / QR",
  "Bank Transfer / NEFT",
  "Cash",
  "Cheque",
  "Card",
  "Other"
];

function todayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

const emptyTransactionForm = {
  title: "",
  type: "Expense",
  category: "Utilities & Bills",
  amount: "",
  date: todayDateStr(),
  paymentMethod: "UPI",
  payerPayee: "",
  reference: "",
  status: "Paid",
  notes: ""
};

export default function AccountantDashboard() {
  const { user } = useAuth();
  const isAdminOrAccountant = user?.role === "admin" || user?.role === "accountant";

  // Persistent storage states
  const [fees] = useLocalStorage("shms:fees", seedFees);
  const [salaries] = useLocalStorage("shms:salary", seedSalaries);
  const [transactions, setTransactions] = useLocalStorage("shms:financeTransactions", seedFinanceTxns);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All"); // All, Income, Expense
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyTransactionForm);
  const [viewItem, setViewItem] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Fetch backend finance transactions if available
  useEffect(() => {
    api.get("/finance/transactions")
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped = res.data.data.map((t) => ({
            _id: t._id,
            id: t.transactionId || t._id,
            title: t.title,
            category: t.category,
            type: t.type,
            amount: t.amount,
            date: t.date ? t.date.split("T")[0] : todayDateStr(),
            paymentMethod: t.paymentMethod || "UPI",
            payerPayee: t.payerPayee || "",
            reference: t.reference || "",
            status: t.status || "Paid",
            notes: t.notes || ""
          }));
          setTransactions(mapped);
        }
      })
      .catch((err) => console.log("Using local/cached finance transactions", err.message));
  }, []);

  // Aggregated Financial Totals
  const collectedFees = fees.filter((f) => f.status === "Paid").reduce((s, f) => s + Number(f.amount), 0);
  const pendingFees = fees.filter((f) => f.status !== "Paid").reduce((s, f) => s + Number(f.amount), 0);
  const totalSalariesPaid = salaries.filter((s) => s.status === "Paid").reduce((s, f) => s + Number(f.netPay), 0);

  // Operational Transactions totals
  const txnIncome = transactions
    .filter((t) => t.type === "Income" && t.status === "Paid")
    .reduce((s, t) => s + Number(t.amount), 0);

  const txnExpense = transactions
    .filter((t) => t.type === "Expense" && t.status === "Paid")
    .reduce((s, t) => s + Number(t.amount), 0);

  const pendingTxnsAmount = transactions
    .filter((t) => t.status === "Pending")
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalGrossIncome = collectedFees + txnIncome;
  const totalGrossExpense = totalSalariesPaid + txnExpense;
  const netHostelBalance = totalGrossIncome - totalGrossExpense;

  // Filtered Ledger Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.payerPayee && t.payerPayee.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.reference && t.reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.paymentMethod && t.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = typeFilter === "All" || t.type === typeFilter;
      const matchCategory = categoryFilter === "All" || t.category === categoryFilter;
      const matchStatus = statusFilter === "All" || t.status === statusFilter;
      const matchMethod =
        methodFilter === "All" ||
        (methodFilter === "UPI (All)"
          ? String(t.paymentMethod || "").toLowerCase().includes("upi")
          : t.paymentMethod === methodFilter);

      return matchSearch && matchType && matchCategory && matchStatus && matchMethod;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, searchQuery, typeFilter, categoryFilter, statusFilter, methodFilter]);

  // Monthly trend chart data
  const monthlyTrendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
    return months.map((m, index) => {
      // baseline trend plus actual July operational data
      const monthPrefix = `2026-0${index + 1}`;
      const mTxnIncome = transactions
        .filter((t) => t.type === "Income" && t.date.startsWith(monthPrefix))
        .reduce((s, t) => s + Number(t.amount), 0);
      const mTxnExpense = transactions
        .filter((t) => t.type === "Expense" && t.date.startsWith(monthPrefix))
        .reduce((s, t) => s + Number(t.amount), 0);

      const baseIncome = [140000, 160000, 190000, 150000, 210000, 195000, 220000, 180000][index] || 150000;
      const baseExpense = [85000, 90000, 88000, 92000, 95000, 89000, 105000, 90000][index] || 90000;

      return {
        month: m,
        income: baseIncome + mTxnIncome,
        expense: baseExpense + mTxnExpense
      };
    });
  }, [transactions]);

  // Add / Edit Handlers
  const openAddTransaction = () => {
    setEditingId(null);
    setForm(emptyTransactionForm);
    setModalOpen(true);
  };

  const openEditTransaction = (t) => {
    setEditingId(t.id);
    setForm({
      title: t.title,
      type: t.type,
      category: t.category,
      amount: t.amount,
      date: t.date,
      paymentMethod: t.paymentMethod || "UPI",
      payerPayee: t.payerPayee || "",
      reference: t.reference || "",
      status: t.status || "Paid",
      notes: t.notes || ""
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const clean = {
      title: form.title,
      type: form.type,
      category: form.category,
      amount: Number(form.amount),
      date: form.date,
      paymentMethod: form.paymentMethod,
      payerPayee: form.payerPayee,
      reference: form.reference,
      status: form.status,
      notes: form.notes
    };

    if (editingId) {
      const existing = transactions.find((t) => t.id === editingId);
      const updated = { ...existing, ...clean };
      setTransactions((prev) => prev.map((t) => (t.id === editingId ? updated : t)));

      if (existing?._id) {
        try {
          await api.put(`/finance/transactions/${existing._id}`, clean);
        } catch (err) {
          console.error("Failed to update transaction in DB", err);
        }
      }
    } else {
      const newId = nextId(transactions, "TXN", 3);
      const newTxn = { ...clean, id: newId };
      setTransactions((prev) => [newTxn, ...prev]);

      try {
        const res = await api.post("/finance/transactions", clean);
        if (res.data?.success && res.data.data?._id) {
          newTxn._id = res.data.data._id;
          newTxn.id = res.data.data.transactionId || newId;
          setTransactions((prev) => prev.map((t) => (t.id === newId ? newTxn : t)));
        }
      } catch (err) {
        console.error("Failed to save transaction to DB", err);
      }
    }

    setModalOpen(false);
  };

  const handleDeleteTransaction = async (id) => {
    const target = transactions.find((t) => t.id === id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setDeleteConfirmId(null);

    if (target?._id) {
      try {
        await api.delete(`/finance/transactions/${target._id}`);
      } catch (err) {
        console.error("Failed to delete transaction from DB", err);
      }
    }
  };

  return (
    <div className="pb-12">
      <Topbar
        title="Finance & Accounts"
        subtitle="Manage hostel transactions, general ledger, fees, and operational cash flows"
      />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Top Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-line shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-tag text-navy">
                General Ledger
              </span>
              <span className="text-xs text-ink/50">Fiscal Year 2026</span>
            </div>
            <h2 className="text-xl font-bold text-ink mt-1 font-display">
              Hostel Financial Ledger & Transactions
            </h2>
          </div>

          {isAdminOrAccountant && (
            <button
              onClick={openAddTransaction}
              className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-navy/90 transition shadow-sm hover:shadow"
            >
              <Plus size={17} /> Add Transaction
            </button>
          )}
        </div>

        {/* 4 Core Financial KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Gross Income"
            value={`₹${totalGrossIncome.toLocaleString("en-IN")}`}
            sub={`₹${collectedFees.toLocaleString("en-IN")} fees + ₹${txnIncome.toLocaleString("en-IN")} other`}
            icon={TrendingUp}
          />
          <StatCard
            label="Gross Expenses"
            value={`₹${totalGrossExpense.toLocaleString("en-IN")}`}
            sub={`₹${totalSalariesPaid.toLocaleString("en-IN")} wages + ₹${txnExpense.toLocaleString("en-IN")} bills`}
            icon={TrendingDown}
            accent="tag"
          />
          <StatCard
            label="Net Balance"
            value={`${netHostelBalance >= 0 ? "+" : "-"}₹${Math.abs(netHostelBalance).toLocaleString("en-IN")}`}
            sub={netHostelBalance >= 0 ? "Surplus / In Reserve" : "Operating Deficit"}
            icon={Wallet}
          />
          <StatCard
            label="Pending Receivables"
            value={`₹${(pendingFees + pendingTxnsAmount).toLocaleString("en-IN")}`}
            sub={`${fees.filter(f => f.status !== 'Paid').length} pending fee dues`}
            icon={Activity}
            accent="tag"
          />
        </div>

        {/* Visual Analytics Chart */}
        <Card className="p-6">
          <SectionHeader
            eyebrow="Financial Flow"
            title="Monthly Revenue vs Expenditure Trends"
            action={
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-navy">
                  <span className="w-3 h-3 rounded-full bg-[#542A52]" /> Total Income
                </span>
                <span className="flex items-center gap-1.5 text-warn">
                  <span className="w-3 h-3 rounded-full bg-[#FFB39A]" /> Total Expense
                </span>
              </div>
            }
          />
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyTrendData} margin={{ left: -10, top: 10 }}>
                <defs>
                  <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#542A52" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#542A52" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFB39A" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#FFB39A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#EADBE6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#2F172E99" }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(val) => `₹${val / 1000}k`}
                  tick={{ fontSize: 12, fill: "#2F172E99" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #EADBE6", fontSize: 13 }}
                  formatter={(val) => `₹${Number(val).toLocaleString("en-IN")}`}
                />
                <Area type="monotone" dataKey="income" stroke="#542A52" strokeWidth={2.5} fill="url(#fillIncome)" name="Income" />
                <Area type="monotone" dataKey="expense" stroke="#FFB39A" strokeWidth={2.5} fill="url(#fillExpense)" name="Expense" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* ========================================================================= */}
        {/* TRANSACTIONS LEDGER TABLE                                                */}
        {/* ========================================================================= */}
        <Card className="p-6 space-y-5">
          <SectionHeader
            eyebrow="Transactions Ledger"
            title="All Recorded Financial Transactions"
            action={
              isAdminOrAccountant && (
                <button
                  onClick={openAddTransaction}
                  className="flex items-center gap-1.5 bg-navy text-white text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-navy/90 transition shadow-xs"
                >
                  <Plus size={14} /> Add Transaction
                </button>
              )
            }
          />

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                placeholder="Search transactions by title, vendor/payee, reference, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-line bg-white text-xs text-ink placeholder:text-ink/40 focus:outline-none focus:border-navy"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Pills & Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <div className="flex items-center bg-parchment p-1 rounded-lg border border-line text-xs font-medium">
                {["All", "Income", "Expense"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1 rounded-md transition ${
                      typeFilter === t
                        ? "bg-white font-bold text-navy shadow-xs"
                        : "text-ink/60 hover:text-ink"
                    }`}
                  >
                    {t === "Income" ? "+ Income" : t === "Expense" ? "- Expense" : "All"}
                  </button>
                ))}
              </div>

              {/* Category Dropdown */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-line rounded-lg text-xs font-medium text-ink focus:outline-none focus:border-navy"
              >
                {ALL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c === "All" ? "All Categories" : c}
                  </option>
                ))}
              </select>

              {/* Status Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-line rounded-lg text-xs font-medium text-ink focus:outline-none focus:border-navy"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>

              {/* Payment Method Filter */}
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-line rounded-lg text-xs font-medium text-ink focus:outline-none focus:border-navy"
              >
                <option value="All">All Payment Modes</option>
                <option value="UPI (All)">All UPI Transactions</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs text-ink/50 px-0.5">
            <p>
              Showing <strong className="text-ink">{filteredTransactions.length}</strong> transactions
              {typeFilter !== "All" && ` • ${typeFilter}s`}
              {categoryFilter !== "All" && ` • ${categoryFilter}`}
              {statusFilter !== "All" && ` • ${statusFilter}`}
              {methodFilter !== "All" && ` • Mode: ${methodFilter}`}
            </p>
            {(searchQuery || typeFilter !== "All" || categoryFilter !== "All" || statusFilter !== "All" || methodFilter !== "All") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("All");
                  setCategoryFilter("All");
                  setStatusFilter("All");
                  setMethodFilter("All");
                }}
                className="text-navy font-semibold hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table headers={["Voucher ID", "Date", "Description / Vendor", "Category", "Payment Mode", "Type & Amount", "Status", "Actions"]}>
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-parchment/60 transition">
                  {/* ID */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <KeyTag>{t.id}</KeyTag>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-4 whitespace-nowrap text-xs text-ink/70">
                    {t.date}
                  </td>

                  {/* Description & Payee */}
                  <td className="py-3 px-4">
                    <p className="font-semibold text-ink text-sm leading-tight">{t.title}</p>
                    {t.payerPayee && (
                      <p className="text-[11px] text-ink/50 mt-0.5">
                        Party: <span className="font-medium text-ink/70">{t.payerPayee}</span>
                        {t.reference && ` • Ref: ${t.reference}`}
                      </p>
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-navy/5 text-navy/80 font-medium">
                      {t.category}
                    </span>
                  </td>

                  {/* Payment Method */}
                  <td className="py-3 px-4 whitespace-nowrap text-xs text-ink/70">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-parchment border border-line text-xs font-medium">
                      {String(t.paymentMethod || "").toLowerCase().includes("upi") ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded tracking-wide">
                          UPI
                        </span>
                      ) : (
                        <CreditCard size={13} className="text-ink/40" />
                      )}
                      <span>{t.paymentMethod || "UPI"}</span>
                    </span>
                  </td>

                  {/* Amount with +/- & Color */}
                  <td className="py-3 px-4 whitespace-nowrap font-bold text-sm">
                    <span
                      className={`inline-flex items-center gap-1 font-display ${
                        t.type === "Income" ? "text-ok" : "text-warn"
                      }`}
                    >
                      {t.type === "Income" ? (
                        <ArrowUpRight size={14} />
                      ) : (
                        <ArrowDownLeft size={14} />
                      )}
                      {t.type === "Income" ? "+" : "-"}₹{Number(t.amount).toLocaleString("en-IN")}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusPill status={t.status} />
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <RowActions
                      onView={() => setViewItem(t)}
                      onEdit={isAdminOrAccountant ? () => openEditTransaction(t) : undefined}
                      onDelete={isAdminOrAccountant ? () => setDeleteConfirmId(t.id) : undefined}
                    />
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-ink/40">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              )}
            </Table>
          </div>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* MODALS: ADD / EDIT / VIEW / DELETE                                        */}
      {/* ========================================================================= */}

      {/* 1. Add / Edit Transaction Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Finance Transaction" : "Record New Finance Transaction"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Field label="Transaction Title / Purpose">
            <Input
              required
              placeholder="e.g. Campus Electricity Bill, Groceries Bulk Consignment, Room Fee Penalty"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Transaction Type">
              <Select
                options={["Income", "Expense"]}
                value={form.type}
                onChange={(e) => {
                  const newType = e.target.value;
                  const availableCats = CATEGORIES_BY_TYPE[newType] || [];
                  setForm({
                    ...form,
                    type: newType,
                    category: availableCats[0] || "Other"
                  });
                }}
              />
            </Field>

            <Field label="Category">
              <Select
                options={CATEGORIES_BY_TYPE[form.type] || CATEGORIES_BY_TYPE.Expense}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Amount (₹)">
              <Input
                type="number"
                min={1}
                required
                placeholder="e.g. 25000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>

            <Field label="Transaction Date">
              <Input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Payment Method">
              <Select
                options={PAYMENT_METHODS}
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              />
            </Field>

            <Field label="Status">
              <Select
                options={["Paid", "Pending", "Under Review"]}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Payer / Payee Vendor Name">
              <Input
                placeholder="e.g. BESCOM Power Ltd, APMC Wholesalers, Student Name"
                value={form.payerPayee}
                onChange={(e) => setForm({ ...form, payerPayee: e.target.value })}
              />
            </Field>

            <Field label="Reference / Receipt / Voucher #">
              <Input
                placeholder="e.g. NEFT-99120, BES-JUL-22, UPI-8821"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Notes / Remarks (Optional)">
            <TextArea
              rows={2}
              placeholder="Additional information or audit remarks..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>

          <FormActions
            onCancel={() => setModalOpen(false)}
            submitLabel={editingId ? "Update Transaction" : "Record Transaction"}
          />
        </form>
      </Modal>

      {/* 2. Detail Receipt Modal */}
      <DetailModal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem?.id}
        subtitle={viewItem?.title}
        rows={
          viewItem
            ? [
                { label: "Voucher ID", value: <KeyTag>{viewItem.id}</KeyTag> },
                { label: "Date", value: viewItem.date },
                {
                  label: "Amount",
                  value: (
                    <span className={`font-bold font-display text-base ${viewItem.type === "Income" ? "text-ok" : "text-warn"}`}>
                      {viewItem.type === "Income" ? "+" : "-"}₹{Number(viewItem.amount).toLocaleString("en-IN")}
                    </span>
                  ),
                },
                { label: "Type", value: <StatusPill status={viewItem.type} /> },
                { label: "Category", value: viewItem.category },
                { label: "Party / Payee", value: viewItem.payerPayee || "—" },
                { label: "Reference Code", value: viewItem.reference || "—" },
                { label: "Payment Mode", value: viewItem.paymentMethod || "UPI" },
                { label: "Status", value: <StatusPill status={viewItem.status} /> },
                { label: "Notes", value: viewItem.notes || "—" },
              ]
            : []
        }
      />

      {/* 3. Confirm Delete Transaction Modal */}
      <Modal open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Delete Finance Transaction">
        <p className="text-sm text-ink/70 mb-5">
          Are you sure you want to delete this financial record? This will adjust your ledger balances and financial audit reports.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setDeleteConfirmId(null)}
            className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => handleDeleteTransaction(deleteConfirmId)}
            className="px-4 py-2 text-sm font-semibold bg-warn text-white rounded-lg hover:bg-warn/90"
          >
            Delete Transaction
          </button>
        </div>
      </Modal>
    </div>
  );
}
