import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, SectionHeader, RowActions } from "../components/ui";
import Modal, { Field, Input, Select, FormActions, DetailModal } from "../components/Modal";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useAuth } from "../context/AuthContext";
import { notices as seedNotices } from "../data/mockData";

const emptyForm = { title: "", date: "", tag: "Event" };

export default function Notices() {
  const { user } = useAuth();
  const isStaff = user.role !== "student";
  const location = useLocation();
  const navigate = useNavigate();
  const [notices, setNotices] = useLocalStorage("shms:notices", seedNotices);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmId, setConfirmId] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  // Arriving here from the Dashboard's "Latest notices" list — open that
  // specific announcement automatically instead of just landing on the list.
  useEffect(() => {
    const openId = location.state?.openId;
    if (openId != null) {
      const match = notices.find((n) => n.id === openId);
      if (match) setViewItem(match);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const openAdd = () => { setEditingId(null); setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) }); setModalOpen(true); };
  const openEdit = (n) => { setEditingId(n.id); setForm(n); setModalOpen(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isStaff) return;
    if (editingId) {
      setNotices((prev) => prev.map((n) => (n.id === editingId ? { ...form, id: editingId } : n)));
    } else {
      const id = (notices.reduce((max, n) => Math.max(max, n.id), 0)) + 1;
      setNotices((prev) => [{ ...form, id }, ...prev]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
    setConfirmId(null);
  };

  return (
    <div>
      <Topbar title="Notices" subtitle="Announcements visible to all students" />
      <div className="p-8">
        <SectionHeader
          eyebrow="Notice board"
          title="All announcements"
          action={
            isStaff && (
              <button onClick={openAdd} className="flex items-center gap-1.5 bg-navy text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-navy-light transition-colors">
                <Plus size={15} /> New notice
              </button>
            )
          }
        />
        <div className="space-y-3">
          {notices.map((n) => (
            <Card key={n.id} className="p-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-ink">{n.title}</p>
                <p className="text-xs text-ink/45 mt-1">{n.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-navy/70 bg-navy/8 px-2.5 py-1 rounded-md whitespace-nowrap">{n.tag}</span>
                <RowActions
                  onView={() => setViewItem(n)}
                  onEdit={isStaff ? () => openEdit(n) : undefined}
                  onDelete={isStaff ? () => setConfirmId(n.id) : undefined}
                />
              </div>
            </Card>
          ))}
          {notices.length === 0 && <p className="text-sm text-ink/40">No notices yet.</p>}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit notice" : "New notice"}>
        <form onSubmit={handleSubmit}>
          <Field label="Title">
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Date">
            <Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Tag">
            <Select options={["Fees", "Maintenance", "Event", "Facility", "General"]} value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} />
          </Field>
          <FormActions onCancel={() => setModalOpen(false)} submitLabel={editingId ? "Save changes" : "Post notice"} />
        </form>
      </Modal>

      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Delete notice">
        <p className="text-sm text-ink/70 mb-5">This will remove this announcement permanently.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmId(null)} className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink rounded-lg">Cancel</button>
          <button onClick={() => handleDelete(confirmId)} className="px-4 py-2 text-sm font-medium bg-warn text-white rounded-lg hover:bg-warn/90">Delete</button>
        </div>
      </Modal>

      <DetailModal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem?.title}
        rows={viewItem ? [
          { label: "Title", value: viewItem.title },
          { label: "Date", value: viewItem.date },
          { label: "Tag", value: viewItem.tag },
        ] : []}
      />
    </div>
  );
}
