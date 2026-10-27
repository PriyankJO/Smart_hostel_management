import { useState } from "react";
import { Plus, LogOut } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, Table, KeyTag, SectionHeader, RowActions } from "../components/ui";
import Modal, { Field, Input, Select, FormActions, DetailModal } from "../components/Modal";
import { useLocalStorage, nextId } from "../hooks/useLocalStorage";
import { visitors as seedVisitors, students as seedStudents } from "../data/mockData";

const emptyForm = { name: "", toMeet: "", purpose: "", in: "", out: "—" };

function nowStr() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

export default function Visitors() {
  const [visitors, setVisitors] = useLocalStorage("shms:visitors", seedVisitors);
  const [students] = useLocalStorage("shms:students", seedStudents);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmId, setConfirmId] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  const openAdd = () => { setEditingId(null); setForm({ ...emptyForm, in: nowStr() }); setModalOpen(true); };
  const openEdit = (v) => { setEditingId(v.id); setForm(v); setModalOpen(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setVisitors((prev) => prev.map((v) => (v.id === editingId ? { ...form, id: editingId } : v)));
    } else {
      const id = nextId(visitors, "VIS", 4);
      setVisitors((prev) => [...prev, { ...form, id }]);
    }
    setModalOpen(false);
  };

  const markExit = (id) => {
    setVisitors((prev) => prev.map((v) => (v.id === id ? { ...v, out: nowStr() } : v)));
  };

  const handleDelete = (id) => {
    setVisitors((prev) => prev.filter((v) => v.id !== id));
    setConfirmId(null);
  };

  return (
    <div>
      <Topbar title="Visitors" subtitle="Entry / exit log at the gate" />
      <div className="p-8">
        <Card className="p-6">
          <SectionHeader
            eyebrow="Gate log"
            title="Visitor records"
            action={
              <button onClick={openAdd} className="flex items-center gap-1.5 bg-navy text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-navy-light transition-colors">
                <Plus size={15} /> Log visitor
              </button>
            }
          />
          <Table headers={["Visitor ID", "Name", "Meeting", "Purpose", "Time in", "Time out", "Actions"]}>
            {visitors.map((v) => (
              <tr key={v.id} className="hover:bg-parchment/60">
                <td className="py-3 px-4"><KeyTag>{v.id}</KeyTag></td>
                <td className="py-3 px-4 font-medium text-ink">{v.name}</td>
                <td className="py-3 px-4 text-ink/70">{v.toMeet}</td>
                <td className="py-3 px-4 text-ink/70">{v.purpose}</td>
                <td className="py-3 px-4 text-ink/70">{v.in}</td>
                <td className="py-3 px-4 text-ink/70">{v.out}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-1.5 justify-end">
                    {v.out === "—" && (
                      <button onClick={() => markExit(v.id)} className="text-xs font-medium text-ok bg-ok/10 hover:bg-ok/20 px-2.5 py-1.5 rounded-md flex items-center gap-1">
                        <LogOut size={12} /> Exit
                      </button>
                    )}
                    <RowActions onView={() => setViewItem(v)} onEdit={() => openEdit(v)} onDelete={() => setConfirmId(v.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit visitor entry" : "Log visitor"}>
        <form onSubmit={handleSubmit}>
          <Field label="Visitor name">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Meeting (student)">
            <Select
              required
              options={students.map((s) => `${s.name} — ${s.id}`)}
              value={(() => {
                const match = students.find((s) => s.name === form.toMeet);
                return match ? `${match.name} — ${match.id}` : "";
              })()}
              onChange={(e) => setForm({ ...form, toMeet: e.target.value.split(" — ")[0] })}
            />
          </Field>
          <Field label="Purpose">
            <Input required value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
          </Field>
          <Field label="Time in">
            <Input required value={form.in} onChange={(e) => setForm({ ...form, in: e.target.value })} />
          </Field>
          <FormActions onCancel={() => setModalOpen(false)} submitLabel={editingId ? "Save changes" : "Log entry"} />
        </form>
      </Modal>

      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Delete visitor entry">
        <p className="text-sm text-ink/70 mb-5">This will remove this visitor log entry permanently.</p>
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
          { label: "Visitor ID", value: <KeyTag>{viewItem.id}</KeyTag> },
          { label: "Name", value: viewItem.name },
          { label: "Meeting", value: viewItem.toMeet },
          { label: "Purpose", value: viewItem.purpose },
          { label: "Time in", value: viewItem.in },
          { label: "Time out", value: viewItem.out },
        ] : []}
      />
    </div>
  );
}
