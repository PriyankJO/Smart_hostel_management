import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus, TrendingUp, TrendingDown, Wallet, IndianRupee } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, SectionHeader, StatCard, KeyTag, StatusPill, RowActions, Table } from "../components/ui";
import Modal, { Field, Input, Select, FormActions, DetailModal } from "../components/Modal";
import { useLocalStorage, nextId } from "../hooks/useLocalStorage";
import { canteenTransactions as seedCanteen } from "../data/mockData";

const CATEGORIES = ["Meal Sales", "Groceries", "Wages", "Utilities", "Maintenance", "Other"];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const emptyTxn = { date: todayStr(), description: "", category: "Meal Sales", type: "Income", amount: "" };
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function CanteenSales() {
  const [transactions, setTransactions] = useLocalStorage("shms:canteen", seedCanteen);
  const [txnModalOpen, setTxnModalOpen] = useState(false);
  const [editingTxnId, setEditingTxnId] = useState(null);
  const [txnForm, setTxnForm] = useState(emptyTxn);
  const [confirmTxnId, setConfirmTxnId] = useState(null);
  const [viewTxn, setViewTxn] = useState(null);

  const openAddTxn = () => { setEditingTxnId(null); setTxnForm(emptyTxn); setTxnModalOpen(true); };
  const openEditTxn = (t) => { setEditingTxnId(t.id); setTxnForm(t); setTxnModalOpen(true); };

  const handleTxnSubmit = (e) => {
    e.preventDefault();
    const clean = { ...txnForm, amount: Number(txnForm.amount) };
    if (editingTxnId) {
      setTransactions((prev) => prev.map((t) => (t.id === editingTxnId ? { ...clean, id: editingTxnId } : t)));
    } else {
      const id = nextId(transactions, "CNT");
      setTransactions((prev) => [...prev, { ...clean, id }]);
    }
    setTxnModalOpen(false);
  };

  const handleTxnDelete = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setConfirmTxnId(null);
  };

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisYear = String(now.getFullYear());

  const sortedTxns = useMemo(
    () => [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [transactions]
  );

  const monthTxns = transactions.filter((t) => t.date.startsWith(thisMonthKey));
  const yearTxns = transactions.filter((t) => t.date.startsWith(thisYear));

  const sumBy = (list, type) => list.filter((t) => t.type === type).reduce((s, t) => s + Number(t.amount), 0);

  const monthIncome = sumBy(monthTxns, "Income");
  const monthExpense = sumBy(monthTxns, "Expense");
  const monthPL = monthIncome - monthExpense;

  const yearIncome = sumBy(yearTxns, "Income");
  const yearExpense = sumBy(yearTxns, "Expense");
  const yearPL = yearIncome - yearExpense;

  const chartData = useMemo(() => {
    const byMonth = {};
    yearTxns.forEach((t) => {
      const m = t.date.slice(5, 7);
      if (!byMonth[m]) byMonth[m] = { income: 0, expense: 0 };
      byMonth[m][t.type === "Income" ? "income" : "expense"] += Number(t.amount);
    });
    return Object.keys(byMonth)
      .sort()
      .map((m) => ({
        month: MONTH_NAMES[Number(m) - 1],
        Income: byMonth[m].income,
        Expense: byMonth[m].expense,
      }));
  }, [yearTxns]);

  return (
    <div>
      <Topbar title="Sales & Finances" subtitle="Manage canteen income and expenses" />
      <div className="p-8 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="This month income" value={`₹${monthIncome.toLocaleString("en-IN")}`} icon={TrendingUp} />
          <StatCard label="This month expense" value={`₹${monthExpense.toLocaleString("en-IN")}`} icon={TrendingDown} accent="tag" />
          <StatCard
            label="This month P&L"
            value={`${monthPL >= 0 ? "+" : "-"}₹${Math.abs(monthPL).toLocaleString("en-IN")}`}
            sub={monthPL >= 0 ? "Profit" : "Loss"}
            icon={Wallet}
          />
          <StatCard
            label={`This year P&L (${thisYear})`}
            value={`${yearPL >= 0 ? "+" : "-"}₹${Math.abs(yearPL).toLocaleString("en-IN")}`}
            sub={yearPL >= 0 ? "Profit" : "Loss"}
            icon={IndianRupee}
            accent="tag"
          />
        </div>

        <Card className="p-6">
          <SectionHeader eyebrow="Trend" title={`Monthly income vs expense — ${thisYear}`} />
          {chartData.length === 0 ? (
            <p className="text-sm text-ink/45 py-8 text-center">No canteen transactions recorded for {thisYear} yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ left: -10, top: 5 }}>
                <CartesianGrid stroke="#EADBE6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#2F172E99" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#2F172E99" }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: 8, border: "1px solid #EADBE6", fontSize: 13 }} 
                  cursor={{ fill: "transparent" }}
                  formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Income" fill="#68A678" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#D95B5B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <SectionHeader
            eyebrow="Ledger"
            title="Canteen transactions"
            action={
              <button
                onClick={openAddTxn}
                className="flex items-center gap-1.5 bg-navy text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-navy-light transition-colors"
              >
                <Plus size={15} /> Add transaction
              </button>
            }
          />
          <Table headers={["ID", "Date", "Description", "Category", "Type", "Amount", "Actions"]}>
            {sortedTxns.map((t) => (
              <tr key={t.id} className="hover:bg-parchment/60">
                <td className="py-3 px-4"><KeyTag>{t.id}</KeyTag></td>
                <td className="py-3 px-4 text-ink/70">{t.date}</td>
                <td className="py-3 px-4 font-medium text-ink">{t.description}</td>
                <td className="py-3 px-4 text-ink/70">{t.category}</td>
                <td className="py-3 px-4"><StatusPill status={t.type} /></td>
                <td className={`py-3 px-4 font-medium ${t.type === "Income" ? "text-ok" : "text-warn"}`}>
                  {t.type === "Income" ? "+" : "-"}₹{Number(t.amount).toLocaleString("en-IN")}
                </td>
                <td className="py-3 px-4">
                  <RowActions
                    onView={() => setViewTxn(t)}
                    onEdit={() => openEditTxn(t)}
                    onDelete={() => setConfirmTxnId(t.id)}
                  />
                </td>
              </tr>
            ))}
            {sortedTxns.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-ink/45">No canteen transactions recorded yet.</td>
              </tr>
            )}
          </Table>
        </Card>
      </div>

      <Modal open={txnModalOpen} onClose={() => setTxnModalOpen(false)} title={editingTxnId ? "Edit transaction" : "Add canteen transaction"}>
        <form onSubmit={handleTxnSubmit}>
          <Field label="Date">
            <Input type="date" required value={txnForm.date} onChange={(e) => setTxnForm({ ...txnForm, date: e.target.value })} />
          </Field>
          <Field label="Description">
            <Input required placeholder="e.g. Vegetables & groceries" value={txnForm.description} onChange={(e) => setTxnForm({ ...txnForm, description: e.target.value })} />
          </Field>
          <Field label="Category">
            <Select options={CATEGORIES} value={txnForm.category} onChange={(e) => setTxnForm({ ...txnForm, category: e.target.value })} />
          </Field>
          <Field label="Type">
            <Select options={["Income", "Expense"]} value={txnForm.type} onChange={(e) => setTxnForm({ ...txnForm, type: e.target.value })} />
          </Field>
          <Field label="Amount (₹)">
            <Input type="number" min={0} required value={txnForm.amount} onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })} />
          </Field>
          <FormActions onCancel={() => setTxnModalOpen(false)} submitLabel={editingTxnId ? "Save changes" : "Add transaction"} />
        </form>
      </Modal>

      <DetailModal
        open={!!viewTxn}
        onClose={() => setViewTxn(null)}
        title={viewTxn?.id}
        subtitle={viewTxn?.description}
        rows={viewTxn ? [
          { label: "ID", value: <KeyTag>{viewTxn.id}</KeyTag> },
          { label: "Date", value: viewTxn.date },
          { label: "Description", value: viewTxn.description },
          { label: "Category", value: viewTxn.category },
          { label: "Type", value: <StatusPill status={viewTxn.type} /> },
          { label: "Amount", value: `₹${Number(viewTxn.amount).toLocaleString("en-IN")}` },
        ] : []}
      />

      <Modal open={!!confirmTxnId} onClose={() => setConfirmTxnId(null)} title="Delete transaction">
        <p className="text-sm text-ink/70 mb-5">This will remove this canteen transaction permanently.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmTxnId(null)} className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink rounded-lg">Cancel</button>
          <button onClick={() => handleTxnDelete(confirmTxnId)} className="px-4 py-2 text-sm font-medium bg-warn text-white rounded-lg hover:bg-warn/90">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
