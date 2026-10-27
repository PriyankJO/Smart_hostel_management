import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, X, Plus } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, Table, KeyTag, StatusPill, SectionHeader, RowActions } from "../components/ui";
import Modal, { Field, Input, Select, TextArea, FormActions, DetailModal } from "../components/Modal";
import { useLocalStorage, nextId } from "../hooks/useLocalStorage";
import { useAuth } from "../context/AuthContext";
import { leaveRequests as seedLeave, students as seedStudents } from "../data/mockData";

const emptyForm = { student: "", studentId: "", from: "", to: "", reason: "" };

export default function Leave() {
  const { user } = useAuth();
  const isStaff = user.role !== "student";
  const isAdmin = user.role === "admin";
  const canApprove = isStaff && !isAdmin;
  const location = useLocation();
  const navigate = useNavigate();
  const [requests, setRequests] = useLocalStorage("shms:leave", seedLeave);
  const [students] = useLocalStorage("shms:students", seedStudents);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirmId, setConfirmId] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");

  const viewItem = requests.find((r) => r.id === viewId) || null;

  // Arriving here from the Dashboard's "Pending leave requests" list — open
  // that specific request automatically instead of just landing on the list.
  useEffect(() => {
    const openId = location.state?.openId;
    if (openId) {
      setViewId(openId);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const baseRequests = isStaff
    ? requests
    : requests.filter((r) => r.studentId === user.studentId || r.student === user.name);

  const visibleRequests = baseRequests.filter(
    (r) => filterStatus === "All" || r.status === filterStatus
  );

  const decide = (id, status) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const openAdd = () => {
    setForm(isStaff ? emptyForm : { ...emptyForm, student: user.name, studentId: user.studentId || "" });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const id = nextId(requests, "LR", 3);
    setRequests((prev) => [...prev, { ...form, id, status: "Pending" }]);
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setConfirmId(null);
  };

  return (
    <div>
      <Topbar title="Leave & Outpass" subtitle="Approve or reject student requests" />
      <div className="p-8">
        <Card className="p-6">
          <SectionHeader
            eyebrow="Requests"
            title={isStaff ? "All leave / outpass requests" : "My leave / outpass requests"}
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
                      {status === "Pending" && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-warn text-white text-[9px]">
                          {baseRequests.filter((r) => r.status === "Pending").length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {!isStaff && (
                  <button onClick={openAdd} className="flex items-center gap-1.5 bg-navy text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-navy-light transition-colors">
                    <Plus size={15} /> New request
                  </button>
                )}
              </div>
            }
          />
          
          {visibleRequests.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-ink/50">No {filterStatus !== "All" ? filterStatus.toLowerCase() : ""} leave requests found.</p>
            </div>
          ) : (
            <Table headers={["Request", "Student", "From", "To", "Reason", "Status", "Actions"]}>
            {visibleRequests.map((r) => (
              <tr key={r.id} className="hover:bg-parchment/60">
                <td className="py-3 px-4"><KeyTag>{r.id}</KeyTag></td>
                <td className="py-3 px-4 font-medium text-ink">{r.student}</td>
                <td className="py-3 px-4 text-ink/70">{r.from}</td>
                <td className="py-3 px-4 text-ink/70">{r.to}</td>
                <td className="py-3 px-4 text-ink/70 max-w-xs">{r.reason}</td>
                <td className="py-3 px-4"><StatusPill status={r.status} /></td>
                <td className="py-3 px-4">
                  <div className="flex gap-1.5 justify-end items-center">
                    {canApprove && r.status === "Pending" && (
                      <>
                        <button onClick={() => decide(r.id, "Approved")} className="w-7 h-7 rounded-md bg-ok/10 text-ok flex items-center justify-center hover:bg-ok/20" aria-label="Approve">
                          <Check size={14} />
                        </button>
                        <button onClick={() => decide(r.id, "Rejected")} className="w-7 h-7 rounded-md bg-warn/10 text-warn flex items-center justify-center hover:bg-warn/20" aria-label="Reject">
                          <X size={14} />
                        </button>
                      </>
                    )}
                    <RowActions
                      onView={() => setViewId(r.id)}
                      onDelete={(canApprove || (!isStaff && r.status === "Pending")) ? () => setConfirmId(r.id) : undefined}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          )}
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New leave / outpass request">
        <form onSubmit={handleSubmit}>
          {isStaff ? (
            <Field label="Student">
              <Select
                required
                options={students.map((s) => `${s.name} — ${s.id}`)}
                value={form.studentId && students.some((s) => s.id === form.studentId) ? `${form.student} — ${form.studentId}` : ""}
                onChange={(e) => {
                  const id = e.target.value.split(" — ").pop();
                  const match = students.find((s) => s.id === id);
                  setForm({ ...form, student: match?.name || "", studentId: id });
                }}
              />
            </Field>
          ) : (
            <>
              <Field label="Student name">
                <Input required disabled value={form.student} />
              </Field>
              <Field label="Student ID">
                <Input required disabled value={form.studentId} />
              </Field>
            </>
          )}
          <Field label="From">
            <Input type="date" required value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
          </Field>
          <Field label="To">
            <Input type="date" required value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
          </Field>
          <Field label="Reason">
            <TextArea required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </Field>
          <FormActions onCancel={() => setModalOpen(false)} submitLabel="Submit request" />
        </form>
      </Modal>

      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Delete request">
        <p className="text-sm text-ink/70 mb-5">This will remove this leave request permanently.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmId(null)} className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink rounded-lg">Cancel</button>
          <button onClick={() => handleDelete(confirmId)} className="px-4 py-2 text-sm font-medium bg-warn text-white rounded-lg hover:bg-warn/90">Delete</button>
        </div>
      </Modal>

      <DetailModal
        open={!!viewItem}
        onClose={() => setViewId(null)}
        title={viewItem?.id}
        subtitle={viewItem?.student}
        rows={viewItem ? [
          { label: "Request", value: <KeyTag>{viewItem.id}</KeyTag> },
          { label: "Student", value: viewItem.student },
          { label: "Student ID", value: viewItem.studentId ? <KeyTag>{viewItem.studentId}</KeyTag> : "—" },
          { label: "From", value: viewItem.from },
          { label: "To", value: viewItem.to },
          { label: "Reason", value: viewItem.reason },
          {
            label: "Status",
            value: canApprove ? (
              <Select
                className="!w-32 text-sm"
                options={["Pending", "Approved", "Rejected"]}
                value={viewItem.status}
                onChange={(e) => decide(viewItem.id, e.target.value)}
              />
            ) : (
              <StatusPill status={viewItem.status} />
            ),
          },
        ] : []}
      />
    </div>
  );
}
