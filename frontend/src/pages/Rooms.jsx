import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, UserPlus, BedDouble, Users, Eye } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, KeyTag, SectionHeader, RowActions, StatCard } from "../components/ui";
import Modal, { Field, Input, Select, FormActions, DetailModal } from "../components/Modal";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { rooms as seedRooms, students as seedStudents } from "../data/mockData";
import { makeRoomChangeEntry, historyForRoom } from "../utils/roomHistory";

const emptyForm = { number: "", block: "A", capacity: 2, type: "Double Sharing" };

function occupancyColor(occupied, capacity) {
  if (occupied === 0) return "bg-ok/10 text-ok border-ok/20";
  if (occupied < capacity) return "bg-tag/15 text-tag-dark border-tag/25";
  return "bg-navy/8 text-navy border-navy/15";
}

function statusLabel(occupied, capacity) {
  return occupied === 0 ? "Vacant" : occupied < capacity ? `${capacity - occupied} bed${capacity - occupied > 1 ? "s" : ""} free` : "Fully occupied";
}

export default function Rooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useLocalStorage("shms:rooms", seedRooms);
  const [students, setStudents] = useLocalStorage("shms:students", seedStudents);
  const [roomHistory, setRoomHistory] = useLocalStorage("shms:roomHistory", []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNumber, setEditingNumber] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmNumber, setConfirmNumber] = useState(null);
  const [viewNumber, setViewNumber] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignStudentId, setAssignStudentId] = useState("");
  const [filter, setFilter] = useState("all");
  const [formError, setFormError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  // Occupied bed count always reflects the actual list of students assigned
  // to that room, so "occupied" and "occupants" can never fall out of sync.
  const occupantsOf = (roomNumber) => students.filter((s) => s.room === roomNumber);

  // Keep the stored occupied count on each room in sync with real assignments
  // (this also fixes any rooms whose occupied count was previously out of date).
  useEffect(() => {
    setRooms((prev) => {
      let changed = false;
      const next = prev.map((r) => {
        const count = occupantsOf(r.number).length;
        if (r.occupied !== count) { changed = true; return { ...r, occupied: count }; }
        return r;
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students]);

  const viewItem = rooms.find((r) => r.number === viewNumber) || null;
  const viewOccupants = viewItem ? occupantsOf(viewItem.number) : [];

  const totalBeds = rooms.reduce((s, r) => s + Number(r.capacity), 0);
  const occupiedBeds = rooms.reduce((s, r) => s + Number(r.occupied), 0);
  const vacantBeds = totalBeds - occupiedBeds;
  const singleBedsCount = rooms.filter(r => r.type === "Single").reduce((s, r) => s + Number(r.capacity), 0);
  const doubleBedsCount = rooms.filter(r => r.type === "Double Sharing").reduce((s, r) => s + Number(r.capacity), 0);

  const unassignedStudents = students.filter((s) => !s.room || !rooms.some((r) => r.number === s.room));

  const filteredRooms = rooms.filter((r) => {
    if (filter === "vacant") return r.occupied === 0;
    if (filter === "partial") return r.occupied > 0 && r.occupied < r.capacity;
    if (filter === "full") return r.occupied >= r.capacity;
    return true;
  });

  const openAdd = () => { setEditingNumber(null); setForm(emptyForm); setFormError(""); setModalOpen(true); };
  const openEdit = (r) => { setEditingNumber(r.number); setForm({ number: r.number, block: r.block, capacity: r.capacity, type: r.type }); setFormError(""); setModalOpen(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = { ...form, capacity: Number(form.capacity) };
    if (editingNumber) {
      const current = rooms.find((r) => r.number === editingNumber);
      if (current && clean.capacity < current.occupied) {
        setFormError(`Can't set capacity below ${current.occupied} — this room already has ${current.occupied} student${current.occupied > 1 ? "s" : ""} assigned. Remove a student first.`);
        return;
      }
      setRooms((prev) => prev.map((r) => (r.number === editingNumber ? { ...r, ...clean, occupied: r.occupied } : r)));
    } else {
      setRooms((prev) => [...prev, { ...clean, occupied: 0 }]);
    }
    setModalOpen(false);
  };

  const handleDelete = (number) => {
    const occupants = occupantsOf(number);
    setRooms((prev) => prev.filter((r) => r.number !== number));
    // Don't leave students pointing at a room that no longer exists — clear
    // their room assignment so Students/Rooms stay consistent everywhere.
    setStudents((prev) => prev.map((s) => (s.room === number ? { ...s, room: "" } : s)));
    if (occupants.length > 0) {
      setRoomHistory((prev) => [
        ...prev,
        ...occupants.map((s) =>
          makeRoomChangeEntry({ studentId: s.id, studentName: s.name, fromRoom: number, toRoom: "", note: "Room deleted" })
        ),
      ]);
    }
    setConfirmNumber(null);
  };

  const openAssign = () => {
    setAssignStudentId("");
    setAssignOpen(true);
  };

  const assignStudent = (e) => {
    e.preventDefault();
    if (!assignStudentId || !viewItem) return;
    const student = students.find((s) => s.id === assignStudentId);
    setStudents((prev) => prev.map((s) => (s.id === assignStudentId ? { ...s, room: viewItem.number } : s)));
    setRoomHistory((prev) => [
      ...prev,
      makeRoomChangeEntry({ studentId: assignStudentId, studentName: student?.name || "", fromRoom: student?.room || "", toRoom: viewItem.number }),
    ]);
    setAssignOpen(false);
  };

  const unassignStudent = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, room: "" } : s)));
    setRoomHistory((prev) => [
      ...prev,
      makeRoomChangeEntry({ studentId, studentName: student?.name || "", fromRoom: student?.room || "", toRoom: "" }),
    ]);
  };

  const roomHistoryList = viewItem ? historyForRoom(roomHistory, viewItem.number) : [];

  return (
    <div>
      <Topbar title="Rooms" subtitle={`${rooms.length} rooms across Blocks A–C`} />
      <div className="p-8">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <StatCard label="Total beds" value={totalBeds} sub={`across ${rooms.length} rooms`} icon={BedDouble} />
          <StatCard label="Single beds" value={singleBedsCount} sub="in Single rooms" icon={BedDouble} />
          <StatCard label="Double beds" value={doubleBedsCount} sub="in Double rooms" icon={BedDouble} />
          <StatCard label="Occupied" value={occupiedBeds} sub={`${totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0}% occupancy`} icon={Users} accent="tag" />
          <StatCard label="Vacant beds" value={vacantBeds} sub="available right now" icon={BedDouble} />
        </div>

        <SectionHeader
          eyebrow="Allocation"
          title="Room availability"
          action={
            <button onClick={openAdd} className="flex items-center gap-1.5 bg-navy text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-navy-light transition-colors">
              <Plus size={15} /> Add room
            </button>
          }
        />

        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { key: "all", label: `All (${rooms.length})` },
            { key: "vacant", label: `Vacant (${rooms.filter((r) => r.occupied === 0).length})` },
            { key: "partial", label: `Partially occupied (${rooms.filter((r) => r.occupied > 0 && r.occupied < r.capacity).length})` },
            { key: "full", label: `Fully occupied (${rooms.filter((r) => r.occupied >= r.capacity).length})` },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors ${
                filter === f.key ? "bg-navy text-white border-navy" : "bg-white text-ink/60 border-line hover:border-navy/30"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filteredRooms.length === 0 ? (
          <p className="text-sm text-ink/45 py-8 text-center">No rooms match this filter.</p>
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredRooms.map((r) => (
            <Card key={r.number} className={`p-5 border-2 ${occupancyColor(r.occupied, r.capacity)}`}>
              <div className="flex items-center justify-between mb-2">
                <KeyTag>{r.number}</KeyTag>
                <span className="text-xs font-semibold text-ink/50">Block {r.block}</span>
              </div>
              <p className="font-display font-bold text-xl text-ink">{r.occupied}/{r.capacity}</p>
              <p className="text-xs text-ink/50 mt-1">{r.type}</p>
              <p className="text-xs mt-2 mb-3 font-medium">{statusLabel(r.occupied, r.capacity)}</p>
              <RowActions onView={() => setViewNumber(r.number)} onEdit={() => openEdit(r)} onDelete={() => setConfirmNumber(r.number)} />
            </Card>
          ))}
        </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingNumber ? "Edit room" : "Add room"}>
        <form onSubmit={handleSubmit}>
          <Field label="Room number">
            <Input required disabled={!!editingNumber} placeholder="e.g. D-401" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
          </Field>
          <Field label="Block">
            <Select options={["A", "B", "C", "D"]} value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} />
          </Field>
          <Field label="Room type">
            <Select options={["Single", "Double Sharing", "Triple Sharing"]} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          </Field>
          <Field label="Capacity">
            <Input type="number" min={1} required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          </Field>
          {formError && <p className="text-xs text-warn font-medium -mt-2 mb-4">{formError}</p>}
          <p className="text-xs text-ink/40 -mt-2 mb-4">Occupied beds are tracked automatically from student room assignments.</p>
          <FormActions onCancel={() => setModalOpen(false)} submitLabel={editingNumber ? "Save changes" : "Add room"} />
        </form>
      </Modal>

      <Modal open={!!confirmNumber} onClose={() => setConfirmNumber(null)} title="Delete room">
        <p className="text-sm text-ink/70 mb-5">
          This will remove room {confirmNumber} from the system.
          {confirmNumber && occupantsOf(confirmNumber).length > 0 && (
            <> Its {occupantsOf(confirmNumber).length} current occupant{occupantsOf(confirmNumber).length > 1 ? "s" : ""} ({occupantsOf(confirmNumber).map((s) => s.name).join(", ")}) will be unassigned and will need a new room.</>
          )}
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmNumber(null)} className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink rounded-lg">Cancel</button>
          <button onClick={() => handleDelete(confirmNumber)} className="px-4 py-2 text-sm font-medium bg-warn text-white rounded-lg hover:bg-warn/90">Delete</button>
        </div>
      </Modal>

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title={`Assign student to ${viewItem?.number ?? ""}`} z="z-[60]">
        <form onSubmit={assignStudent}>
          {unassignedStudents.length === 0 ? (
            <p className="text-sm text-ink/60 mb-4">No unassigned students available. Every student already has a room.</p>
          ) : (
            <Field label="Student">
              <Select
                required
                options={unassignedStudents.map((s) => `${s.id} — ${s.name}`)}
                value={assignStudentId ? `${assignStudentId} — ${unassignedStudents.find((s) => s.id === assignStudentId)?.name ?? ""}` : ""}
                onChange={(e) => setAssignStudentId(e.target.value.split(" — ")[0])}
              />
            </Field>
          )}
          <FormActions onCancel={() => setAssignOpen(false)} submitLabel="Assign" />
        </form>
      </Modal>

      <DetailModal
        open={!!viewItem}
        onClose={() => setViewNumber(null)}
        title={viewItem?.number}
        subtitle={viewItem ? `Block ${viewItem.block} · ${viewItem.type}` : ""}
        extraAction={{ label: "Details", onClick: () => setHistoryOpen(true) }}
        rows={viewItem ? [
          { label: "Room number", value: <KeyTag>{viewItem.number}</KeyTag> },
          { label: "Block", value: viewItem.block },
          { label: "Type", value: viewItem.type },
          { label: "Capacity", value: viewItem.capacity },
          { label: "Occupied beds", value: viewItem.occupied },
          { label: "Status", value: statusLabel(viewItem.occupied, viewItem.capacity) },
          {
            label: "Occupants",
            value: (
              <div className="flex flex-col items-end gap-1.5">
                {viewOccupants.length === 0 && <span>None</span>}
                {viewOccupants.map((s) => (
                  <span key={s.id} className="flex items-center gap-1.5">
                    {s.name}
                    <button
                      type="button"
                      onClick={() => unassignStudent(s.id)}
                      className="w-4 h-4 rounded-full bg-warn/10 text-warn flex items-center justify-center hover:bg-warn/20"
                      aria-label={`Remove ${s.name}`}
                      title="Remove from room"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {viewItem.occupied < viewItem.capacity && (
                  <button
                    type="button"
                    onClick={openAssign}
                    className="flex items-center gap-1 text-navy font-medium hover:underline mt-0.5"
                  >
                    <UserPlus size={13} /> Add student
                  </button>
                )}
              </div>
            ),
          },
        ] : []}
      />

      <Modal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title={viewItem ? `${viewItem.number} — room history` : ""}
        z="z-[60]"
      >
        <p className="text-xs text-ink/45 -mt-2 mb-4">Every student who has ever moved into or out of this room, most recent first.</p>
        {roomHistoryList.length === 0 ? (
          <p className="text-sm text-ink/50 py-4">No move-in / move-out history recorded for this room yet.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {roomHistoryList.map((h) => {
              const stillEnrolled = students.some((s) => s.id === h.studentId);
              return (
                <div key={h.id} className="flex items-start justify-between gap-3 bg-parchment rounded-lg px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{h.studentName || "Unknown student"}</p>
                    <p className="text-xs text-ink/50 mt-0.5">
                      {h.label}
                      {h.note ? ` · ${h.note}` : ""} · {h.date}
                    </p>
                  </div>
                  {stillEnrolled ? (
                    <button
                      type="button"
                      onClick={() => { setHistoryOpen(false); setViewNumber(null); navigate("/students", { state: { viewId: h.studentId } }); }}
                      className="shrink-0 text-xs font-medium text-navy bg-navy/8 hover:bg-navy/15 px-2.5 py-1.5 rounded-md flex items-center gap-1"
                    >
                      <Eye size={12} /> View
                    </button>
                  ) : (
                    <span className="shrink-0 text-xs text-ink/35 italic px-1">No longer enrolled</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="flex justify-end pt-4 mt-2 border-t border-line">
          <button onClick={() => setHistoryOpen(false)} className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink rounded-lg">
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
