import { useState, useEffect } from "react";
import { Plus, Wallet, CheckCircle2, AlertTriangle, MessageCircle, Landmark } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, Table, KeyTag, StatusPill, SectionHeader, StatCard, RowActions } from "../components/ui";
import Modal, { Field, Input, Select, FormActions, DetailModal } from "../components/Modal";
import { useLocalStorage, nextId } from "../hooks/useLocalStorage";
import { useAuth } from "../context/AuthContext";
import { fees as seedFees, students as seedStudents } from "../data/mockData";
import api from "../services/api";

const emptyForm = { student: "", studentId: "", amount: "", date: "", status: "Paid", phone: "", paymentMethod: "UPI", transactionReference: "" };

function cleanPhone(raw) {
  const digits = String(raw || "").replace(/[^\d]/g, "");
  if (!digits) return null;
  // if already has country code (11-13 digits starting 91), keep as is; else prefix 91 (India)
  if (digits.length === 10) return "91" + digits;
  return digits;
}

function buildWhatsAppLink(phone, message) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export default function Fees() {
  const { user } = useAuth();
  const isStaff = user.role !== "student";
  const [fees, setFees] = useLocalStorage("shms:fees", seedFees);
  const [students] = useLocalStorage("shms:students", seedStudents);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmId, setConfirmId] = useState(null);
  const [noPhoneFor, setNoPhoneFor] = useState(null);
  const [manualPhone, setManualPhone] = useState("");
  const [viewItem, setViewItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFees = async () => {
    try {
      const res = await api.get('/fees');
      if (res.data && res.data.success) {
        const mapped = res.data.data.map(f => ({
          _id: f._id,
          id: f.receiptId,
          student: f.studentId ? f.studentId.name : "Unknown",
          studentId: f.studentId ? f.studentId.studentId : "Unknown",
          amount: f.amount,
          date: f.date ? f.date.split('T')[0] : "",
          status: f.status,
          paymentMethod: f.paymentMethod || "",
          transactionReference: f.transactionReference || ""
        }));
        setFees(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch fees", error);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const visibleFees = isStaff ? fees : fees.filter((f) => f.studentId === user.studentId);
  const collected = visibleFees.filter((f) => f.status === "Paid").reduce((s, f) => s + Number(f.amount), 0);
  const pendingFees = visibleFees.filter((f) => f.status !== "Paid");
  const pendingAmount = pendingFees.reduce((s, f) => s + Number(f.amount), 0);
  const due = pendingFees.length;
  const overdue = visibleFees.filter((f) => f.status === "Overdue").length;

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (f) => { setEditingId(f.id); setForm({ phone: "", ...f }); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Find mongo object id for student
    const matchStudent = students.find(s => s.id === form.studentId);
    
    const apiPayload = {
      amount: Number(form.amount),
      date: form.date,
      status: form.status,
      studentId: matchStudent ? matchStudent._id : undefined,
      paymentMethod: form.paymentMethod,
      transactionReference: form.transactionReference
    };

    try {
      if (editingId) {
        const existing = fees.find(f => f.id === editingId);
        if (existing && existing._id) {
          await api.put(`/fees/${existing._id}`, apiPayload);
        }
      } else {
        await api.post('/fees', apiPayload);
      }
      await fetchFees();
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save fee record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const fee = fees.find((f) => f.id === id);
    try {
      if (fee && fee._id) {
        await api.delete(`/fees/${fee._id}`);
      }
      await fetchFees();
      setConfirmId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete fee");
    }
  };

  const getPhoneFor = (f) => {
    if (f.phone) return cleanPhone(f.phone);
    const match = students.find((s) => s.id === f.studentId);
    return match ? cleanPhone(match.phone) : null;
  };

  const sendReminder = (f) => {
    const phone = getPhoneFor(f);
    if (!phone) {
      setManualPhone("");
      setNoPhoneFor(f.id);
      return;
    }
    openWhatsApp(f, phone);
  };

  const openWhatsApp = (f, phone) => {
    const s = students.find((x) => x.id === f.studentId);
    let details = `\n\n*Fee Details:*\n- Student ID: ${f.studentId}\n- Amount: ₹${Number(f.amount).toLocaleString("en-IN")}\n- Status: ${f.status}`;
    if (s) {
      details += `\n- Room: ${s.room}\n- Course: ${s.course}`;
    }
    
    const message = `Hi ${f.student}, this is a reminder from the Hostel Admin regarding your pending fees. ${details}\n\nPlease clear the pending amount at the earliest to avoid late penalties. Thank you.`;
    window.open(buildWhatsAppLink(phone, message), "_blank");
  };

  const confirmManualPhone = (e) => {
    e.preventDefault();
    const phone = cleanPhone(manualPhone);
    const f = fees.find((x) => x.id === noPhoneFor);
    if (phone && f) {
      setFees((prev) => prev.map((x) => (x.id === f.id ? { ...x, phone: manualPhone } : x)));
      openWhatsApp(f, phone);
    }
    setNoPhoneFor(null);
  };

  return (
    <div>
      <Topbar title="Fees" subtitle="Payment records" />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label={isStaff ? "Collected" : "Paid so far"} value={`₹${collected.toLocaleString("en-IN")}`} icon={Wallet} />
          {isStaff ? (
            <>
              <StatCard label="Payments pending" value={due} icon={CheckCircle2} accent="tag" />
              <StatCard label="Overdue accounts" value={overdue} icon={AlertTriangle} accent="tag" />
            </>
          ) : (
            <>
              <StatCard
                label="Amount due"
                value={pendingAmount > 0 ? `₹${pendingAmount.toLocaleString("en-IN")}` : "₹0"}
                sub={due > 0 ? `${due} payment${due > 1 ? "s" : ""} pending` : "You're all caught up"}
                icon={CheckCircle2}
                accent="tag"
              />
              <StatCard
                label="Account status"
                value={overdue > 0 ? "Overdue" : due > 0 ? "Due" : "Clear"}
                icon={AlertTriangle}
                accent="tag"
              />
            </>
          )}
        </div>

        {!isStaff && pendingAmount > 0 && (
          <Card className="p-5 bg-tag/10 border-tag/30">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-tag/20 text-tag-dark flex items-center justify-center shrink-0">
                <Landmark size={17} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">How to pay your pending fees</p>
                <p className="text-sm text-ink/70 mt-1">
                  You have <span className="font-semibold">₹{pendingAmount.toLocaleString("en-IN")}</span> pending
                  {overdue > 0 ? " and it's currently overdue — please clear it as soon as possible." : "."} Pay via
                  bank transfer / UPI to the hostel account, or in person at the Admin Office (Ground Floor, 9 AM –
                  5 PM, Mon–Sat). Once received, staff will update your payment status here and you'll see a new
                  receipt in your transaction list below.
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <SectionHeader
            eyebrow="Ledger"
            title={isStaff ? "Transactions" : "My transactions"}
            action={
              isStaff ? (
                <button onClick={openAdd} className="flex items-center gap-1.5 bg-navy text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-navy-light transition-colors">
                  <Plus size={15} /> Record payment
                </button>
              ) : null
            }
          />
          <Table headers={["Receipt", "Student", "Student ID", "Amount", "Date", "Status", "Method", "Actions"]}>
            {visibleFees.map((f) => (
              <tr key={f.id} className="hover:bg-parchment/60">
                <td className="py-3 px-4"><KeyTag>{f.id}</KeyTag></td>
                <td className="py-3 px-4 font-medium text-ink">{f.student}</td>
                <td className="py-3 px-4"><KeyTag>{f.studentId}</KeyTag></td>
                <td className="py-3 px-4 text-ink/70">₹{Number(f.amount).toLocaleString("en-IN")}</td>
                <td className="py-3 px-4 text-ink/70">{f.date || "—"}</td>
                <td className="py-3 px-4"><StatusPill status={f.status} /></td>
                <td className="py-3 px-4 text-ink/70 whitespace-nowrap">
                  {f.paymentMethod ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-parchment border border-line text-xs font-medium">
                      {String(f.paymentMethod).toLowerCase().includes("upi") && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-1 py-0.2 rounded">
                          UPI
                        </span>
                      )}
                      <span>{f.paymentMethod}</span>
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-1.5 justify-end items-center">
                    {isStaff && f.status !== "Paid" && (
                      <button
                        onClick={() => sendReminder(f)}
                        title="Send WhatsApp reminder"
                        className="text-xs font-medium text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 px-2.5 py-1.5 rounded-md flex items-center gap-1"
                      >
                        <MessageCircle size={13} /> Remind
                      </button>
                    )}
                    <RowActions
                      onView={() => setViewItem(f)}
                      onEdit={isStaff ? () => openEdit(f) : undefined}
                      onDelete={isStaff ? () => setConfirmId(f.id) : undefined}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {visibleFees.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-ink/45">
                  {isStaff
                    ? "No fee records yet."
                    : "No fee records found for your account yet. If you believe this is an error, please contact the hostel Admin Office."}
                </td>
              </tr>
            )}
          </Table>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit transaction" : "Record payment"}>
        <form onSubmit={handleSubmit}>
          <Field label="Student">
            <Select
              required
              options={students.map((s) => `${s.name} — ${s.id}`)}
              value={form.studentId ? (students.some((s) => s.id === form.studentId) ? `${form.student} — ${form.studentId}` : "") : ""}
              onChange={(e) => {
                const id = e.target.value.split(" — ").pop();
                const match = students.find((s) => s.id === id);
                setForm({ ...form, student: match?.name || "", studentId: id, phone: form.phone || match?.phone || "" });
              }}
            />
          </Field>
          <Field label="Amount (₹)">
            <Input type="number" min={0} required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </Field>
          <Field label="Date paid">
            <Input type="date" value={form.date === "—" ? "" : form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Status">
            <Select options={["Paid", "Due", "Overdue"]} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          </Field>
          <Field label="Payment Method">
            <Select
              options={["UPI", "UPI Transaction", "UPI / QR", "Cash", "Bank Transfer", "Cheque", "Card", "Other"]}
              value={form.paymentMethod || "UPI"}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            />
          </Field>
          <Field label="Transaction Reference (if applicable)">
            <Input placeholder="e.g. UPI Ref / Cheque No" value={form.transactionReference || ""} onChange={(e) => setForm({ ...form, transactionReference: e.target.value })} />
          </Field>
          <Field label="Phone (for WhatsApp reminders, optional)">
            <Input placeholder="e.g. 98765 43210" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <FormActions onCancel={() => setModalOpen(false)} submitLabel={editingId ? "Save changes" : "Record payment"} />
        </form>
      </Modal>

      <Modal open={!!noPhoneFor} onClose={() => setNoPhoneFor(null)} title="Add phone number">
        <p className="text-sm text-ink/70 mb-4">No phone number found for this student. Enter one to send the WhatsApp reminder — it'll be saved for next time.</p>
        <form onSubmit={confirmManualPhone}>
          <Field label="Phone number">
            <Input required autoFocus placeholder="e.g. 98765 43210" value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} />
          </Field>
          <FormActions onCancel={() => setNoPhoneFor(null)} submitLabel="Send reminder" />
        </form>
      </Modal>

      <DetailModal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem?.id}
        subtitle={viewItem?.student}
        rows={viewItem ? [
          { label: "Receipt", value: <KeyTag>{viewItem.id}</KeyTag> },
          { label: "Student", value: viewItem.student },
          { label: "Student ID", value: <KeyTag>{viewItem.studentId}</KeyTag> },
          { label: "Amount", value: `₹${Number(viewItem.amount).toLocaleString("en-IN")}` },
          { label: "Date", value: viewItem.date || "—" },
          { label: "Status", value: <StatusPill status={viewItem.status} /> },
          { label: "Method", value: viewItem.paymentMethod || "—" },
          { label: "Transaction Ref", value: viewItem.transactionReference || "—" },
          { label: "Phone", value: viewItem.phone || "Not on file" },
        ] : []}
      />

      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Delete transaction">
        <p className="text-sm text-ink/70 mb-5">This will remove this fee record permanently.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmId(null)} className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink rounded-lg">Cancel</button>
          <button onClick={() => handleDelete(confirmId)} className="px-4 py-2 text-sm font-medium bg-warn text-white rounded-lg hover:bg-warn/90">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
