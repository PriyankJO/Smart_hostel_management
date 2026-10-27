import { useState, useMemo, useEffect } from "react";
import { Plus, Wallet, CheckCircle2, Clock, IndianRupee } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, Table, KeyTag, StatusPill, SectionHeader, StatCard, RowActions } from "../components/ui";
import Modal, { Field, Input, Select, FormActions, DetailModal } from "../components/Modal";
import { useLocalStorage, nextId } from "../hooks/useLocalStorage";
import { salaryRecords as seedSalary, wardens as seedWardens, staffAccounts } from "../data/mockData";
import { ROLE_LABELS } from "../utils/roles";
import api from "../services/api";

function initials(name = "") {
  return name
    .replace(/[\(\)]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function monthLabel(month) {
  if (!month) return "—";
  const d = new Date(month + "-01T00:00:00");
  if (isNaN(d)) return month;
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function thisMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatStaffRole(role = "", name = "") {
  if (!role) return "Staff";
  const rLower = role.toLowerCase().trim();
  if (rLower === "admin") return "Admin";
  if (rLower === "warden") return "Warden";
  if (rLower === "accountant") return "Accountant";
  if (rLower === "canteen" || rLower === "canteen_manager") return "Canteen Manager";
  if (ROLE_LABELS[role]) return ROLE_LABELS[role];
  if (rLower === "staff") {
    const match = name.match(/\((.*?)\)/);
    if (match && match[1]) {
      return match[1].trim();
    }
    return "Staff";
  }
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function Salary() {
  const [wardens] = useLocalStorage("shms:wardens", seedWardens);
  const [storedStaff] = useLocalStorage("shms:staff", staffAccounts);
  const [records, setRecords] = useLocalStorage("shms:salary", seedSalary);

  // Same admin-profile key the Wardens page edits, so the name shown here
  // always matches whatever the admin last saved for themselves.
  const seedAdmin = staffAccounts.find((a) => a.username === "admin") || {};
  const [adminProfile] = useLocalStorage("shms:adminProfile", {
    name: seedAdmin.name || "Admin Office",
    phone: seedAdmin.phone || "",
    dob: seedAdmin.dob || "",
    email: seedAdmin.email || "",
  });

  const [apiStaff, setApiStaff] = useState([]);

  useEffect(() => {
    let isMounted = true;
    api.get("/staff")
      .then((res) => {
        if (isMounted && res.data?.success && Array.isArray(res.data.data)) {
          setApiStaff(res.data.data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch remote staff list, using local staff directory", err);
      });
    return () => { isMounted = false; };
  }, []);

  // Complete live staff directory: Admin + Wardens + All Staff Members
  const staffList = useMemo(() => {
    const list = [];
    const seenKeys = new Set();

    const markSeen = (id, name, username) => {
      if (id) seenKeys.add(String(id).toLowerCase().trim());
      if (name) seenKeys.add(String(name).toLowerCase().trim());
      if (username) seenKeys.add(String(username).toLowerCase().trim());
    };

    const isSeen = (id, name, username) => {
      if (id && seenKeys.has(String(id).toLowerCase().trim())) return true;
      if (name && seenKeys.has(String(name).toLowerCase().trim())) return true;
      if (username && seenKeys.has(String(username).toLowerCase().trim())) return true;
      return false;
    };

    // 1. Admin (always first)
    const adminName = adminProfile.name || seedAdmin.name || "Admin Office";
    const adminId = seedAdmin.id || "STF-001";
    list.push({
      staffId: adminId,
      altIds: ["admin", "stf-001", adminId.toLowerCase()].filter(Boolean),
      staffName: adminName,
      role: "Admin",
    });
    markSeen(adminId, adminName, "admin");
    markSeen("STF-001", "Admin Office", "admin");

    // 2. Wardens from wardens localStorage
    (wardens || []).forEach((w) => {
      const id = w.id || w.staffId || "WRD-001";
      if (!isSeen(id, w.name, "warden")) {
        markSeen(id, w.name, "warden");
        list.push({
          staffId: id,
          altIds: [id, "STF-002", "warden", String(id).toLowerCase()].filter(Boolean),
          staffName: w.name,
          role: "Warden",
        });
      }
    });

    // 3. All other staff accounts from storage and API (Accountant, Canteen, Security, Plumber, Cleaner, Electrician, etc.)
    const combinedStaff = [...(storedStaff || []), ...apiStaff];
    combinedStaff.forEach((s) => {
      const id = s.staffId || s.id;
      const username = s.username;
      const name = s.name;

      if (!name || isSeen(id, name, username)) {
        return;
      }

      markSeen(id, name, username);
      const roleStr = formatStaffRole(s.role, name);

      list.push({
        staffId: id || `STF-${String(list.length + 1).padStart(3, "0")}`,
        altIds: [id, username, s._id, id ? String(id).toLowerCase() : ""].filter(Boolean),
        staffName: name,
        role: roleStr,
      });
    });

    return list;
  }, [adminProfile, wardens, storedStaff, apiStaff, seedAdmin]);

  const findStaff = (idOrName) => {
    if (!idOrName) return null;
    const str = String(idOrName).toLowerCase().trim();
    return staffList.find(
      (s) =>
        String(s.staffId).toLowerCase().trim() === str ||
        s.altIds?.some((a) => String(a).toLowerCase().trim() === str) ||
        s.staffName.toLowerCase().trim() === str
    );
  };

  const [monthFilter, setMonthFilter] = useState(() => {
    const thisMonth = thisMonthKey();
    const hasThisMonth = (records || []).some((r) => r.month === thisMonth);
    if (hasThisMonth) return thisMonth;
    const months = [...new Set((records || []).map((r) => r.month))].sort().reverse();
    return months[0] || thisMonth;
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  const emptyForm = () => {
    const defaultStaff = staffList[0];
    const prevRecord = defaultStaff
      ? records.slice().reverse().find((rec) => rec.staffId === defaultStaff.staffId || rec.staffName === defaultStaff.staffName)
      : null;
    return {
      staffId: defaultStaff?.staffId || "",
      month: thisMonthKey(),
      basic: prevRecord?.basic ?? "",
      allowances: prevRecord?.allowances ?? "",
      deductions: prevRecord?.deductions ?? "",
      status: "Pending",
      paidOn: "",
    };
  };

  const openAdd = () => { setEditingId(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (r) => {
    setEditingId(r.id);
    const matched = findStaff(r.staffId) || findStaff(r.staffName);
    setForm({
      staffId: matched?.staffId || r.staffId,
      month: r.month,
      basic: r.basic,
      allowances: r.allowances,
      deductions: r.deductions,
      status: r.status,
      paidOn: r.paidOn || "",
    });
    setModalOpen(true);
  };

  const netPayOf = (f) => Number(f?.basic || 0) + Number(f?.allowances || 0) - Number(f?.deductions || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const staff = findStaff(form.staffId);
    const clean = {
      staffId: staff?.staffId || form.staffId,
      staffName: staff?.staffName || form.staffId,
      role: staff?.role || "Staff",
      month: form.month,
      basic: Number(form.basic || 0),
      allowances: Number(form.allowances || 0),
      deductions: Number(form.deductions || 0),
      netPay: netPayOf(form),
      status: form.status,
      paidOn: form.status === "Paid" ? (form.paidOn || new Date().toISOString().slice(0, 10)) : "",
    };
    if (editingId) {
      setRecords((prev) => prev.map((r) => (r.id === editingId ? { ...clean, id: editingId } : r)));
    } else {
      const id = nextId(records, "SAL");
      setRecords((prev) => [...prev, { ...clean, id }]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setConfirmId(null);
  };

  const markPaid = (r) => {
    setRecords((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, status: "Paid", paidOn: new Date().toISOString().slice(0, 10) } : x))
    );
  };

  const monthOptions = useMemo(() => {
    const set = new Set(records.map((r) => r.month));
    set.add(thisMonthKey());
    return [...set].sort().reverse();
  }, [records]);

  const visibleRecords = records.filter((r) => r.month === monthFilter).sort((a, b) => a.staffName.localeCompare(b.staffName));
  const monthPaid = visibleRecords.filter((r) => r.status === "Paid").reduce((s, r) => s + Number(r.netPay), 0);
  const monthPending = visibleRecords.filter((r) => r.status !== "Paid").reduce((s, r) => s + Number(r.netPay), 0);
  const pendingCount = visibleRecords.filter((r) => r.status !== "Paid").length;

  const yearOfFilter = monthFilter.slice(0, 4);
  const yearTotal = records
    .filter((r) => r.month.startsWith(yearOfFilter) && r.status === "Paid")
    .reduce((s, r) => s + Number(r.netPay), 0);

  return (
    <div>
      <Topbar title="Salary" subtitle="Staff & warden salary records — admin only" />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Staff on payroll" value={staffList.length} icon={Wallet} />
          <StatCard label={`Paid — ${monthLabel(monthFilter)}`} value={`₹${monthPaid.toLocaleString("en-IN")}`} icon={CheckCircle2} />
          <StatCard
            label={`Pending — ${monthLabel(monthFilter)}`}
            value={`₹${monthPending.toLocaleString("en-IN")}`}
            sub={pendingCount > 0 ? `${pendingCount} record${pendingCount > 1 ? "s" : ""}` : "All caught up"}
            icon={Clock}
            accent="tag"
          />
          <StatCard label={`Total paid — ${yearOfFilter}`} value={`₹${yearTotal.toLocaleString("en-IN")}`} icon={IndianRupee} accent="tag" />
        </div>

        <Card className="p-6">
          <SectionHeader
            eyebrow="Payroll"
            title="Salary records"
            action={
              <div className="flex items-center gap-2">
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-navy/40 bg-white"
                >
                  {monthOptions.map((m) => (
                    <option key={m} value={m}>{monthLabel(m)}</option>
                  ))}
                </select>
                <button onClick={openAdd} className="flex items-center gap-1.5 bg-navy text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-navy-light transition-colors">
                  <Plus size={15} /> Add record
                </button>
              </div>
            }
          />
          <Table headers={["ID", "Staff", "Role", "Basic", "Allowances", "Deductions", "Net pay", "Status", "Actions"]}>
            {visibleRecords.map((r) => (
              <tr key={r.id} className="hover:bg-parchment/60">
                <td className="py-3 px-4"><KeyTag>{r.id}</KeyTag></td>
                <td className="py-3 px-4 font-medium text-ink flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-navy text-white text-[11px] font-display font-bold flex items-center justify-center shrink-0">
                    {initials(r.staffName)}
                  </span>
                  {r.staffName}
                </td>
                <td className="py-3 px-4 text-ink/70">{r.role}</td>
                <td className="py-3 px-4 text-ink/70">₹{Number(r.basic).toLocaleString("en-IN")}</td>
                <td className="py-3 px-4 text-ink/70">₹{Number(r.allowances).toLocaleString("en-IN")}</td>
                <td className="py-3 px-4 text-ink/70">₹{Number(r.deductions).toLocaleString("en-IN")}</td>
                <td className="py-3 px-4 font-semibold text-ink">₹{Number(r.netPay).toLocaleString("en-IN")}</td>
                <td className="py-3 px-4"><StatusPill status={r.status} /></td>
                <td className="py-3 px-4">
                  <div className="flex gap-1.5 justify-end items-center">
                    {r.status !== "Paid" && (
                      <button
                        onClick={() => markPaid(r)}
                        className="text-xs font-medium text-ok bg-ok/10 hover:bg-ok/20 px-2.5 py-1.5 rounded-md transition-colors"
                      >
                        Mark paid
                      </button>
                    )}
                    <RowActions onView={() => setViewItem(r)} onEdit={() => openEdit(r)} onDelete={() => setConfirmId(r.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {visibleRecords.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-sm text-ink/45">No salary records for {monthLabel(monthFilter)} yet.</td>
              </tr>
            )}
          </Table>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit salary record" : "Add salary record"}>
        {form && (
          <form onSubmit={handleSubmit}>
            <Field label="Staff member">
              <Select
                required
                options={staffList.map((s) => ({
                  value: s.staffId,
                  label: `${s.staffName} — ${s.role} (${s.staffId})`,
                }))}
                value={findStaff(form.staffId)?.staffId || form.staffId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const chosen = findStaff(selectedId);
                  const prevRecord = records
                    .slice()
                    .reverse()
                    .find((rec) => rec.staffId === selectedId || rec.staffName === chosen?.staffName);

                  setForm((prev) => ({
                    ...prev,
                    staffId: selectedId,
                    basic: prev?.basic ? prev.basic : (prevRecord?.basic ?? ""),
                    allowances: prev?.allowances ? prev.allowances : (prevRecord?.allowances ?? ""),
                    deductions: prev?.deductions ? prev.deductions : (prevRecord?.deductions ?? ""),
                  }));
                }}
              />
            </Field>
            <Field label="Month">
              <Input type="month" required value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
            </Field>
            <Field label="Basic pay (₹)">
              <Input type="number" min={0} required value={form.basic} onChange={(e) => setForm({ ...form, basic: e.target.value })} />
            </Field>
            <Field label="Allowances (₹)">
              <Input type="number" min={0} value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} />
            </Field>
            <Field label="Deductions (₹)">
              <Input type="number" min={0} value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} />
            </Field>
            <div className="flex items-center justify-between bg-parchment rounded-lg px-3.5 py-2.5 mb-4">
              <span className="text-xs font-semibold text-ink/60 uppercase tracking-wide">Net pay</span>
              <span className="text-sm font-bold text-ink">₹{netPayOf(form).toLocaleString("en-IN")}</span>
            </div>
            <Field label="Status">
              <Select options={["Paid", "Pending"]} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
            </Field>
            {form.status === "Paid" && (
              <Field label="Paid on">
                <Input type="date" value={form.paidOn} onChange={(e) => setForm({ ...form, paidOn: e.target.value })} />
              </Field>
            )}
            <FormActions onCancel={() => setModalOpen(false)} submitLabel={editingId ? "Save changes" : "Add record"} />
          </form>
        )}
      </Modal>

      <DetailModal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem?.id}
        subtitle={viewItem?.staffName}
        rows={viewItem ? [
          { label: "ID", value: <KeyTag>{viewItem.id}</KeyTag> },
          { label: "Staff", value: viewItem.staffName },
          { label: "Role", value: viewItem.role },
          { label: "Month", value: monthLabel(viewItem.month) },
          { label: "Basic pay", value: `₹${Number(viewItem.basic).toLocaleString("en-IN")}` },
          { label: "Allowances", value: `₹${Number(viewItem.allowances).toLocaleString("en-IN")}` },
          { label: "Deductions", value: `₹${Number(viewItem.deductions).toLocaleString("en-IN")}` },
          { label: "Net pay", value: `₹${Number(viewItem.netPay).toLocaleString("en-IN")}` },
          { label: "Status", value: <StatusPill status={viewItem.status} /> },
          { label: "Paid on", value: viewItem.paidOn || "Not paid yet" },
        ] : []}
      />

      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Delete salary record">
        <p className="text-sm text-ink/70 mb-5">This will remove this salary record permanently.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmId(null)} className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink rounded-lg">Cancel</button>
          <button onClick={() => handleDelete(confirmId)} className="px-4 py-2 text-sm font-medium bg-warn text-white rounded-lg hover:bg-warn/90">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
