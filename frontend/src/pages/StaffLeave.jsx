import { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, Table, KeyTag, StatusPill, SectionHeader, RowActions } from "../components/ui";
import Modal, { Field, Input, TextArea, FormActions, DetailModal } from "../components/Modal";
import { useLocalStorage, nextId } from "../hooks/useLocalStorage";
import { useAuth } from "../context/AuthContext";
import { leaveRequests as seedLeave } from "../data/mockData";

export default function StaffLeave() {
  const { user } = useAuth();
  const [requests, setRequests] = useLocalStorage("shms:leave", seedLeave);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");

  const [form, setForm] = useState({ from: "", to: "", reason: "" });

  const myRequests = requests.filter((r) => r.isStaff && r.student === user.name);
  const visibleRequests = myRequests.filter((r) => filterStatus === "All" || r.status === filterStatus);
  const viewItem = myRequests.find((r) => r.id === viewId) || null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const id = nextId(requests, "LR", 3);
    setRequests((prev) => [
      ...prev,
      {
        ...form,
        id,
        student: user.name, // Reusing student field for compatibility with backend/warden
        studentId: user.name, // Simplified since staff might not have full IDs in user object
        status: "Pending",
        isStaff: true
      }
    ]);
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setConfirmId(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] animate-fade-in-up">
      <Topbar title="Leave Requests" subtitle="Apply for and track your leaves" />
      <div className="p-8 space-y-6 max-w-6xl mx-auto">
        <Card className="p-6">
          <SectionHeader
            eyebrow="My Leaves"
            title="Leave History"
            action={
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-navy/5 p-1 rounded-lg">
                  {["All", "Pending", "Approved", "Rejected"].map((status) => (
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
                <button onClick={() => { setForm({ from: "", to: "", reason: "" }); setModalOpen(true); }} className="flex items-center gap-1.5 bg-navy text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-navy-light transition-colors">
                  <Plus size={15} /> Apply Leave
                </button>
              </div>
            }
          />
          
          {visibleRequests.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-ink/50">No {filterStatus !== "All" ? filterStatus.toLowerCase() : ""} leave requests found.</p>
            </div>
          ) : (
            <Table headers={["Request ID", "From", "To", "Reason", "Status", "Actions"]}>
              {visibleRequests.map((r) => (
                <tr key={r.id} className="hover:bg-parchment/60 transition-colors">
                  <td className="py-3 px-4"><KeyTag>{r.id}</KeyTag></td>
                  <td className="py-3 px-4 text-ink/70">{r.from}</td>
                  <td className="py-3 px-4 text-ink/70">{r.to}</td>
                  <td className="py-3 px-4 text-ink/70 max-w-xs">{r.reason}</td>
                  <td className="py-3 px-4"><StatusPill status={r.status} /></td>
                  <td className="py-3 px-4">
                    <RowActions
                      onView={() => setViewId(r.id)}
                      onDelete={r.status === "Pending" ? () => setConfirmId(r.id) : undefined}
                    />
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Apply for Leave">
        <form onSubmit={handleSubmit}>
          <Field label="From Date">
            <Input type="date" required value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
          </Field>
          <Field label="To Date">
            <Input type="date" required value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
          </Field>
          <Field label="Reason">
            <TextArea required placeholder="Why are you taking leave?" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </Field>
          <FormActions onCancel={() => setModalOpen(false)} submitLabel="Submit Request" />
        </form>
      </Modal>

      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Delete request">
        <p className="text-sm text-ink/70 mb-5">This will remove your pending leave request permanently.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmId(null)} className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink rounded-lg">Cancel</button>
          <button onClick={() => handleDelete(confirmId)} className="px-4 py-2 text-sm font-medium bg-warn text-white rounded-lg hover:bg-warn/90">Delete</button>
        </div>
      </Modal>

      <DetailModal
        open={!!viewItem}
        onClose={() => setViewId(null)}
        title={viewItem?.id}
        subtitle="Leave Details"
        rows={viewItem ? [
          { label: "Request ID", value: <KeyTag>{viewItem.id}</KeyTag> },
          { label: "From", value: viewItem.from },
          { label: "To", value: viewItem.to },
          { label: "Reason", value: viewItem.reason },
          { label: "Status", value: <StatusPill status={viewItem.status} /> },
        ] : []}
      />
    </div>
  );
}
