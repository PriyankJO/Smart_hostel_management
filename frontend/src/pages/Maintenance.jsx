import { useState } from "react";
import { Plus, Wrench, CheckCircle2, AlertTriangle, IndianRupee } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, Table, KeyTag, StatusPill, SectionHeader, StatCard, RowActions } from "../components/ui";
import Modal, { Field, Input, Select, TextArea, FormActions, DetailModal } from "../components/Modal";
import { useLocalStorage, nextId } from "../hooks/useLocalStorage";

const seedMaintenance = [
  { id: "MNT-101", asset: "Water Tanks", description: "Quarterly cleaning of all block overhead tanks", date: "2026-07-28", cost: 12000, status: "Scheduled" },
  { id: "MNT-102", asset: "Block A Corridors", description: "Pest control and fumigation", date: "2026-07-15", cost: 4500, status: "Completed" },
  { id: "MNT-103", asset: "Main Generator", description: "Oil change and routine servicing", date: "2026-07-20", cost: 8000, status: "In Progress" },
  { id: "MNT-104", asset: "Lift - Block C", description: "Annual safety inspection by Otis", date: "2026-08-05", cost: 15000, status: "Scheduled" },
];

const emptyForm = { asset: "", description: "", date: "", cost: "", status: "Scheduled" };

export default function Maintenance() {
  const [tasks, setTasks] = useLocalStorage("shms:maintenance", seedMaintenance);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmId, setConfirmId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");

  const visibleTasks = tasks.filter(t => filterStatus === "All" || t.status === filterStatus);

  const completed = tasks.filter((t) => t.status === "Completed").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const scheduled = tasks.filter((t) => t.status === "Scheduled").length;
  const totalCost = tasks.filter((t) => t.status === "Completed").reduce((s, t) => s + Number(t.cost), 0);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (t) => { setEditingId(t.id); setForm(t); setModalOpen(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = { ...form, cost: Number(form.cost) };
    if (editingId) {
      setTasks((prev) => prev.map((t) => (t.id === editingId ? { ...clean, id: editingId } : t)));
    } else {
      const id = nextId(tasks, "MNT", 3);
      setTasks((prev) => [...prev, { ...clean, id }]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setConfirmId(null);
  };

  return (
    <div>
      <Topbar title="Facility Maintenance" subtitle="Manage routine maintenance and repairs" />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Scheduled Tasks" value={scheduled} icon={Wrench} />
          <StatCard label="In Progress" value={inProgress} icon={AlertTriangle} accent="tag" />
          <StatCard label="Completed" value={completed} icon={CheckCircle2} accent="tag" />
          <StatCard label="Total Spent (Completed)" value={`₹${totalCost.toLocaleString("en-IN")}`} icon={IndianRupee} />
        </div>

        <Card className="p-6">
          <SectionHeader
            eyebrow="Log"
            title="Maintenance Schedule"
            action={
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-navy/5 p-1 rounded-lg">
                  {["All", "Scheduled", "In Progress", "Completed"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                        filterStatus === status ? "bg-white text-navy shadow-sm" : "text-ink/60 hover:text-ink"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <button onClick={openAdd} className="flex items-center gap-1.5 bg-navy text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-navy-light transition-colors">
                  <Plus size={15} /> New Task
                </button>
              </div>
            }
          />

          {visibleTasks.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-ink/50">No {filterStatus !== "All" ? filterStatus.toLowerCase() : ""} maintenance tasks found.</p>
            </div>
          ) : (
            <Table headers={["Task ID", "Asset / Area", "Description", "Date", "Est. Cost", "Status", "Actions"]}>
              {visibleTasks.map((t) => (
                <tr key={t.id} className="hover:bg-parchment/60">
                  <td className="py-3 px-4"><KeyTag>{t.id}</KeyTag></td>
                  <td className="py-3 px-4 font-medium text-ink">{t.asset}</td>
                  <td className="py-3 px-4 text-ink/70 max-w-xs">{t.description}</td>
                  <td className="py-3 px-4 text-ink/70">{t.date}</td>
                  <td className="py-3 px-4 text-ink/70">₹{Number(t.cost).toLocaleString("en-IN")}</td>
                  <td className="py-3 px-4"><StatusPill status={t.status} /></td>
                  <td className="py-3 px-4">
                    <RowActions
                      onView={() => setViewItem(t)}
                      onEdit={() => openEdit(t)}
                      onDelete={() => setConfirmId(t.id)}
                    />
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit maintenance task" : "New maintenance task"}>
        <form onSubmit={handleSubmit}>
          <Field label="Asset / Area">
            <Input required placeholder="e.g. Block A Water Tank" value={form.asset} onChange={(e) => setForm({ ...form, asset: e.target.value })} />
          </Field>
          <Field label="Description">
            <TextArea required placeholder="What needs to be done?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Scheduled Date">
            <Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Estimated Cost (₹)">
            <Input type="number" min={0} required value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          </Field>
          <Field label="Status">
            <Select options={["Scheduled", "In Progress", "Completed"]} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          </Field>
          <FormActions onCancel={() => setModalOpen(false)} submitLabel={editingId ? "Save changes" : "Create task"} />
        </form>
      </Modal>

      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Delete task">
        <p className="text-sm text-ink/70 mb-5">This will remove this maintenance task permanently.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmId(null)} className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink rounded-lg">Cancel</button>
          <button onClick={() => handleDelete(confirmId)} className="px-4 py-2 text-sm font-medium bg-warn text-white rounded-lg hover:bg-warn/90">Delete</button>
        </div>
      </Modal>

      <DetailModal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem?.id}
        subtitle={viewItem?.asset}
        rows={viewItem ? [
          { label: "Task ID", value: <KeyTag>{viewItem.id}</KeyTag> },
          { label: "Asset / Area", value: viewItem.asset },
          { label: "Description", value: viewItem.description },
          { label: "Scheduled Date", value: viewItem.date },
          { label: "Estimated Cost", value: `₹${Number(viewItem.cost).toLocaleString("en-IN")}` },
          { label: "Status", value: <StatusPill status={viewItem.status} /> },
        ] : []}
      />
    </div>
  );
}
