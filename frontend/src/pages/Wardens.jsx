import { useState } from "react";
import { Plus } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, Table, KeyTag, SectionHeader, RowActions } from "../components/ui";
import Modal, { Field, Input, FormActions, DetailModal } from "../components/Modal";
import { useLocalStorage, nextId } from "../hooks/useLocalStorage";
import { useAuth } from "../context/AuthContext";
import { wardens as seedWardens, staffAccounts } from "../data/mockData";

const emptyForm = { name: "", phone: "", dob: "", email: "" };

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function formatDob(dob) {
  if (!dob) return "—";
  const d = new Date(dob + "T00:00:00");
  if (isNaN(d)) return dob;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Wardens() {
  const { user } = useAuth();
  const [wardens, setWardens] = useLocalStorage("shms:wardens", seedWardens);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmId, setConfirmId] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  // Admin's own profile, editable from this page. Seeded once from the
  // matching staff account, then kept in localStorage so edits persist.
  const seedAdmin = staffAccounts.find((a) => a.username === user?.username) || {};
  const [adminProfile, setAdminProfile] = useLocalStorage("shms:adminProfile", {
    name: seedAdmin.name || user?.name || "",
    phone: seedAdmin.phone || "",
    dob: seedAdmin.dob || "",
    email: seedAdmin.email || "",
  });
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminForm, setAdminForm] = useState(adminProfile);

  const openAdminEdit = () => { setAdminForm(adminProfile); setAdminModalOpen(true); };
  const handleAdminSubmit = (e) => {
    e.preventDefault();
    setAdminProfile(adminForm);
    setAdminModalOpen(false);
  };

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (w) => { setEditingId(w.id); setForm(w); setModalOpen(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setWardens((prev) => prev.map((w) => (w.id === editingId ? { ...form, id: editingId } : w)));
    } else {
      const id = nextId(wardens, "WRD", 3);
      setWardens((prev) => [...prev, { ...form, id }]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    setWardens((prev) => prev.filter((w) => w.id !== id));
    setConfirmId(null);
  };

  return (
    <div>
      <Topbar title="Wardens" subtitle="Hostel warden directory — admin only" />
      <div className="p-8 space-y-6">
        <Card className="p-6">
          <SectionHeader
            eyebrow="Staff"
            title="Admin details"
            action={
              <button onClick={openAdminEdit} className="text-xs font-medium text-navy bg-navy/8 hover:bg-navy/15 px-2.5 py-1.5 rounded-md transition-colors">
                Edit
              </button>
            }
          />
          <div className="flex items-center gap-4">
            <span className="w-11 h-11 rounded-full bg-navy text-white text-sm font-display font-bold flex items-center justify-center shrink-0">
              {initials(adminProfile.name)}
            </span>
            <div className="grid grid-cols-4 gap-x-8 gap-y-1 flex-1">
              <div>
                <p className="text-xs font-medium text-ink/45 uppercase tracking-wide">Name</p>
                <p className="text-sm font-medium text-ink mt-0.5">{adminProfile.name || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-ink/45 uppercase tracking-wide">Mobile no.</p>
                <p className="text-sm font-medium text-ink mt-0.5">{adminProfile.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-ink/45 uppercase tracking-wide">Date of birth</p>
                <p className="text-sm font-medium text-ink mt-0.5">{formatDob(adminProfile.dob)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-ink/45 uppercase tracking-wide">Email ID</p>
                <p className="text-sm font-medium text-ink mt-0.5">{adminProfile.email || "—"}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeader
            eyebrow="Wardens"
            title="All wardens"
            action={
              <button onClick={openAdd} className="flex items-center gap-1.5 bg-navy text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-navy-light transition-colors">
                <Plus size={15} /> Add warden
              </button>
            }
          />
          <Table headers={["Warden ID", "Name", "Mobile no.", "Date of birth", "Email ID", "Actions"]}>
            {wardens.map((w) => (
              <tr key={w.id} className="hover:bg-parchment/60">
                <td className="py-3 px-4"><KeyTag>{w.id}</KeyTag></td>
                <td className="py-3 px-4 font-medium text-ink flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-navy text-white text-[11px] font-display font-bold flex items-center justify-center shrink-0">
                    {initials(w.name)}
                  </span>
                  {w.name}
                </td>
                <td className="py-3 px-4 text-ink/70">{w.phone}</td>
                <td className="py-3 px-4 text-ink/70">{formatDob(w.dob)}</td>
                <td className="py-3 px-4 text-ink/70">{w.email}</td>
                <td className="py-3 px-4">
                  <RowActions onView={() => setViewItem(w)} onEdit={() => openEdit(w)} onDelete={() => setConfirmId(w.id)} />
                </td>
              </tr>
            ))}
            {wardens.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-ink/40 text-sm">No wardens added yet.</td></tr>
            )}
          </Table>
        </Card>
      </div>

      <Modal open={adminModalOpen} onClose={() => setAdminModalOpen(false)} title="Edit admin details">
        <form onSubmit={handleAdminSubmit}>
          <Field label="Name">
            <Input required value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} />
          </Field>
          <Field label="Mobile no.">
            <Input required type="tel" placeholder="e.g. 98765 43210" value={adminForm.phone} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })} />
          </Field>
          <Field label="Date of birth">
            <Input required type="date" value={adminForm.dob} onChange={(e) => setAdminForm({ ...adminForm, dob: e.target.value })} />
          </Field>
          <Field label="Email ID">
            <Input required type="email" placeholder="e.g. admin@hosteller.edu" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
          </Field>
          <FormActions onCancel={() => setAdminModalOpen(false)} submitLabel="Save changes" />
        </form>
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit warden" : "Add warden"}>
        <form onSubmit={handleSubmit}>
          <Field label="Warden name">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Mobile no.">
            <Input required type="tel" placeholder="e.g. 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Date of birth">
            <Input required type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          </Field>
          <Field label="Email ID">
            <Input required type="email" placeholder="e.g. warden@hosteller.edu" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <FormActions onCancel={() => setModalOpen(false)} submitLabel={editingId ? "Save changes" : "Add warden"} />
        </form>
      </Modal>

      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Remove warden">
        <p className="text-sm text-ink/70 mb-5">This will remove this warden's record permanently.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmId(null)} className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink rounded-lg">Cancel</button>
          <button onClick={() => handleDelete(confirmId)} className="px-4 py-2 text-sm font-medium bg-warn text-white rounded-lg hover:bg-warn/90">Delete</button>
        </div>
      </Modal>

      <DetailModal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem?.name}
        subtitle={viewItem?.id}
        rows={viewItem ? [
          { label: "Warden ID", value: <KeyTag>{viewItem.id}</KeyTag> },
          { label: "Name", value: viewItem.name },
          { label: "Mobile no.", value: viewItem.phone || "—" },
          { label: "Date of birth", value: formatDob(viewItem.dob) },
          { label: "Email ID", value: viewItem.email || "—" },
        ] : []}
      />
    </div>
  );
}
