import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, Table, KeyTag, RoomTag, StatusPill, SectionHeader, RowActions } from "../components/ui";
import Modal, { Field, Input, Select, TextArea, FormActions, DetailModal } from "../components/Modal";
import { useLocalStorage, nextId } from "../hooks/useLocalStorage";
import { useAuth } from "../context/AuthContext";
import { complaints as seedComplaints, students as seedStudents } from "../data/mockData";

const emptyForm = { student: "", room: "", category: "Electrical", detail: "", status: "Open", date: "" };

export default function Complaints() {
  const { user } = useAuth();
  const isStaff = user.role !== "student";
  const location = useLocation();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useLocalStorage("shms:complaints", seedComplaints);
  const [students] = useLocalStorage("shms:students", seedStudents);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmId, setConfirmId] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  // Arriving here from the Dashboard's "Recent complaints" list — open that
  // specific ticket automatically instead of just landing on the plain list.
  useEffect(() => {
    const openId = location.state?.openId;
    if (openId) {
      const match = complaints.find((c) => c.id === openId);
      if (match) setViewItem(match);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const visibleComplaints = isStaff ? complaints : complaints.filter((c) => c.student === user.name);
  const me = !isStaff ? students.find((s) => s.id === user.studentId) : null;

  const openAdd = () => {
    setEditingId(null);
    setForm(
      isStaff
        ? { ...emptyForm, date: new Date().toISOString().slice(0, 10) }
        : { ...emptyForm, student: user.name, room: me?.room || "", date: new Date().toISOString().slice(0, 10) }
    );
    setModalOpen(true);
  };
  const openEdit = (c) => { setEditingId(c.id); setForm(c); setModalOpen(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = isStaff ? form : { ...form, status: "Open" };
    if (editingId) {
      setComplaints((prev) => prev.map((c) => (c.id === editingId ? { ...clean, id: editingId } : c)));
    } else {
      const id = nextId(complaints, "CMP", 3);
      setComplaints((prev) => [...prev, { ...clean, id }]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    setComplaints((prev) => prev.filter((c) => c.id !== id));
    setConfirmId(null);
  };

  return (
    <div>
      <Topbar title="Complaints" subtitle="Maintenance and facility requests" />
      <div className="p-8">
        <Card className="p-6">
          <SectionHeader
            eyebrow="Tickets"
            title={isStaff ? "All complaints" : "My complaints"}
            action={
              <button onClick={openAdd} className="flex items-center gap-1.5 bg-navy text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-navy-light transition-colors">
                <Plus size={15} /> New complaint
              </button>
            }
          />
          <Table headers={["Ticket", "Student", "Room", "Category", "Detail", "Date", "Status", "Actions"]}>
            {visibleComplaints.map((c) => (
              <tr key={c.id} className="hover:bg-parchment/60">
                <td className="py-3 px-4"><KeyTag>{c.id}</KeyTag></td>
                <td className="py-3 px-4 font-medium text-ink">{c.student}</td>
                <td className="py-3 px-4"><RoomTag room={c.room} /></td>
                <td className="py-3 px-4 text-ink/70">{c.category}</td>
                <td className="py-3 px-4 text-ink/70 max-w-xs">{c.detail}</td>
                <td className="py-3 px-4 text-ink/70">{c.date}</td>
                <td className="py-3 px-4"><StatusPill status={c.status} /></td>
                <td className="py-3 px-4">
                  <RowActions
                    onView={() => setViewItem(c)}
                    onEdit={isStaff ? () => openEdit(c) : undefined}
                    onDelete={(isStaff || c.status === "Open") ? () => setConfirmId(c.id) : undefined}
                  />
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit complaint" : "New complaint"}>
        <form onSubmit={handleSubmit}>
          {isStaff ? (
            <Field label="Student">
              <Select
                required
                options={students.map((s) => `${s.name} — ${s.id}`)}
                value={(() => {
                  const match = students.find((s) => s.name === form.student);
                  return match ? `${match.name} — ${match.id}` : "";
                })()}
                onChange={(e) => {
                  const id = e.target.value.split(" — ").pop();
                  const match = students.find((s) => s.id === id);
                  setForm({ ...form, student: match?.name || "", room: match?.room || "" });
                }}
              />
            </Field>
          ) : (
            <Field label="Student name">
              <Input required disabled value={form.student} />
            </Field>
          )}
          <Field label="Room number">
            <Input required disabled value={form.room} placeholder="Auto-filled from student" />
          </Field>
          <Field label="Category">
            <Select options={["Electrical", "Plumbing", "Cleaning", "Internet", "Furniture", "Other"]} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </Field>
          <Field label="Detail">
            <TextArea required value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} />
          </Field>
          <Field label="Date">
            <Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          {isStaff && (
            <Field label="Status">
              <Select options={["Open", "In Progress", "Resolved"]} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
            </Field>
          )}
          <FormActions onCancel={() => setModalOpen(false)} submitLabel={editingId ? "Save changes" : "Submit complaint"} />
        </form>
      </Modal>

      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Delete complaint">
        <p className="text-sm text-ink/70 mb-5">This will remove this ticket permanently.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmId(null)} className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink rounded-lg">Cancel</button>
          <button onClick={() => handleDelete(confirmId)} className="px-4 py-2 text-sm font-medium bg-warn text-white rounded-lg hover:bg-warn/90">Delete</button>
        </div>
      </Modal>

      <DetailModal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem?.id}
        subtitle={viewItem?.category}
        rows={viewItem ? [
          { label: "Ticket", value: <KeyTag>{viewItem.id}</KeyTag> },
          { label: "Student", value: viewItem.student },
          { label: "Room", value: <RoomTag room={viewItem.room} /> },
          { label: "Category", value: viewItem.category },
          { label: "Detail", value: viewItem.detail },
          { label: "Date", value: viewItem.date },
          { label: "Status", value: <StatusPill status={viewItem.status} /> },
        ] : []}
      />
    </div>
  );
}
