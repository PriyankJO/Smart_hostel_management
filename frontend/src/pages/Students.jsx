import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, Phone, GraduationCap, BedDouble, Wallet, Activity, User, MapPin, Cake, Calendar, LogOut, CheckCircle } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, Table, KeyTag, RoomTag, StatusPill, SectionHeader, RowActions } from "../components/ui";
import Modal, { Field, Input, Select, FormActions } from "../components/Modal";
import { useLocalStorage, nextId } from "../hooks/useLocalStorage";
import { students as seedStudents, rooms as seedRooms } from "../data/mockData";
import { computeAttendancePct, computeStudentAttendanceStats, formatAttendanceDisplay } from "../utils/attendance";
import { makeRoomChangeEntry } from "../utils/roomHistory";
import api from "../services/api";

const todayIso = new Date().toISOString().slice(0, 10);
const emptyForm = { 
  name: "", 
  room: "", 
  course: "", 
  year: "1st Year", 
  dob: "", 
  phone: "", 
  feeStatus: "Paid", 
  fatherName: "", 
  address: "",
  dateOfJoining: todayIso,
  dateOfVacating: ""
};

const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function splitCourseYear(student) {
  if (student.year) return { course: student.course || "", year: student.year };
  const raw = student.course || "";
  const m = raw.match(/^(.*?),?\s*(\d)(?:st|nd|rd|th)\s*(?:yr\.?|year)$/i);
  if (m) {
    const n = m[2];
    const suffix = n === "1" ? "st" : n === "2" ? "nd" : n === "3" ? "rd" : "th";
    return { course: m[1].trim(), year: `${n}${suffix} Year` };
  }
  return { course: raw, year: YEAR_OPTIONS[0] };
}

function courseDisplay(student) {
  if (!student.course) return "—";
  return student.year ? `${student.course}, ${student.year}` : student.course;
}

function formatDob(dob) {
  if (!dob) return "—";
  const d = new Date(dob + "T00:00:00");
  if (isNaN(d)) return dob;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Students() {
  const location = useLocation();
  const navigate = useNavigate();
  const [students, setStudents] = useLocalStorage("shms:students", seedStudents);
  const [rooms, setRooms] = useLocalStorage("shms:rooms", seedRooms);
  const [, setRoomHistory] = useLocalStorage("shms:roomHistory", []);
  const [records, setRecords] = useLocalStorage("shms:attendanceRecords", {});
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmId, setConfirmId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [dbStudents, setDbStudents] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students?limit=1000'); // Fetch all for now
      if (res.data && res.data.success) {
        const mapped = res.data.data.map(s => ({
          _id: s._id, // Keep mongo id for PUT/DELETE
          id: s.studentId, // For local compat
          name: s.name,
          room: s.roomId ? s.roomId.roomNumber : "", // populate gives room object, use roomNumber
          course: s.course,
          year: s.year,
          phone: s.phone,
          dob: s.dob ? s.dob.split('T')[0] : "",
          feeStatus: s.feeStatus,
          fatherName: s.fatherName,
          address: s.address,
          dateOfJoining: s.dateOfJoining ? s.dateOfJoining.split('T')[0] : (s.admissionDate ? s.admissionDate.split('T')[0] : ""),
          dateOfVacating: s.dateOfVacating ? s.dateOfVacating.split('T')[0] : "",
          status: s.status || "Active",
        }));
        setStudents(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch students from DB", err);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms?limit=1000');
      if (res.data && res.data.success) {
        const mapped = res.data.data.map(r => ({
          _id: r._id,
          id: r._id, // map id to _id for mock compatibility if needed
          number: r.roomNumber,
          block: r.block,
          capacity: r.capacity,
          occupied: r.occupied,
          type: r.type,
          status: r.status
        }));
        setRooms(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch rooms from DB", err);
    }
  };

  useEffect(() => {
    fetchRooms().then(() => fetchStudents());
  }, []);

  useEffect(() => {
    const viewId = location.state?.viewId;
    if (viewId) {
      const match = students.find((s) => s.id === viewId);
      if (match) setViewItem(match);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, students]);

  const filtered = students.filter((s) =>
    (s.name + s.room + s.course + (s.year || "")).toLowerCase().includes(query.toLowerCase())
  );

  const vacantRooms = rooms
    .map((r) => ({
      ...r,
      free: r.capacity - students.filter((s) => s.room === r.number && s.id !== editingId).length,
    }))
    .filter((r) => r.free > 0);

  const roomLabel = (r) => `${r.number} — Block ${r.block} · ${r.type} · ${r.free} bed${r.free === 1 ? "" : "s"} free`;
  const selectedRoomLabel = form.room
    ? (() => {
        const match = vacantRooms.find((r) => r.number === form.room);
        return match ? roomLabel(match) : form.room;
      })()
    : "";

  const openAdd = () => {
    setEditingId(null);
    const firstVacant = vacantRooms[0];
    setForm({ 
      ...emptyForm, 
      id: nextId(students, "STU"), 
      room: firstVacant ? firstVacant.number : "",
      dateOfJoining: todayIso,
      dateOfVacating: ""
    });
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditingId(s.id);
    const stillExists = s.room && rooms.some((r) => r.number === s.room);
    const fallback = vacantRooms[0];
    const { course, year } = splitCourseYear(s);
    setForm({ 
      ...s, 
      course, 
      year, 
      dob: s.dob || "", 
      room: stillExists ? s.room : (fallback ? fallback.number : ""),
      dateOfJoining: s.dateOfJoining ? s.dateOfJoining.slice(0, 10) : todayIso,
      dateOfVacating: s.dateOfVacating ? s.dateOfVacating.slice(0, 10) : ""
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Find mongo room ID
    const matchRoom = form.room ? rooms.find(r => r.number === form.room) : null;
    const roomId = matchRoom ? matchRoom._id : null;
    
    const apiPayload = {
      ...form,
      studentId: form.id,
      roomId,
      dateOfJoining: form.dateOfJoining || todayIso,
      dateOfVacating: form.dateOfVacating || null,
      status: form.dateOfVacating ? 'Vacated' : 'Active'
    };

    try {
      if (editingId) {
        const existing = students.find(s => s.id === editingId);
        if (existing?._id) {
          await api.put(`/students/${existing._id}`, apiPayload);
        }
        
        setStudents((prev) =>
          prev.map((s) => (s.id === editingId ? { ...s, ...apiPayload, room: form.room } : s))
        );

        if (existing && existing.room !== form.room) {
          setRoomHistory((prev) => [
            ...prev,
            makeRoomChangeEntry({ studentId: editingId, studentName: form.name, fromRoom: existing.room, toRoom: form.room }),
          ]);
        }
      } else {
        const res = await api.post('/students', apiPayload);
        const newStu = res.data?.data;
        const newEntry = {
          ...apiPayload,
          _id: newStu?._id,
          id: form.id,
          room: form.room,
        };
        setStudents((prev) => [...prev, newEntry]);

        if (form.room) {
          setRoomHistory((prev) => [
            ...prev,
            makeRoomChangeEntry({ studentId: apiPayload.studentId, studentName: form.name, fromRoom: "", toRoom: form.room }),
          ]);
        }
      }
      await fetchStudents();
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const student = students.find((s) => s.id === id);
    try {
      if (student && student._id) {
        await api.delete(`/students/${student._id}`);
      }
      
      setStudents((prev) => prev.filter((s) => s.id !== id));

      if (student?.room) {
        setRoomHistory((prev) => [
          ...prev,
          makeRoomChangeEntry({ studentId: id, studentName: student.name, fromRoom: student.room, toRoom: "", note: "Student removed" }),
        ]);
      }

      // Directly clean up attendance records for deleted student
      setRecords((prev) => {
        let changed = false;
        const updated = { ...prev };
        Object.keys(updated).forEach((d) => {
          if (updated[d] && updated[d][id]) {
            delete updated[d][id];
            changed = true;
          }
        });
        return changed ? updated : prev;
      });

      setConfirmId(null);
      await fetchStudents();
    } catch (err) {
      console.error(err);
      alert("Failed to delete student");
    }
  };

  const handleVacate = async (s) => {
    const confirmed = window.confirm(
      `Mark ${s.name} as vacated? This will release room ${s.room || "assignment"}, record today (${todayIso}) as date of vacating, directly remove all attendance records, and remove this student from the attendance module.`
    );
    if (!confirmed) return;

    try {
      if (s._id) {
        await api.post(`/students/${s._id}/checkout`, {
          checkoutDate: todayIso,
          reason: "Hostel Vacated / Official Checkout"
        });
      }

      // Directly remove all attendance records for vacated student from local cache
      setRecords((prev) => {
        let changed = false;
        const updated = { ...prev };
        Object.keys(updated).forEach((d) => {
          if (updated[d] && updated[d][s.id]) {
            delete updated[d][s.id];
            changed = true;
          }
        });
        return changed ? updated : prev;
      });

      setStudents((prev) =>
        prev.map((item) =>
          item.id === s.id
            ? { ...item, room: "", dateOfVacating: todayIso, status: 'Vacated', attendance: 0 }
            : item
        )
      );
      if (s.room) {
        setRoomHistory((prev) => [
          ...prev,
          makeRoomChangeEntry({ studentId: s.id, studentName: s.name, fromRoom: s.room, toRoom: "", note: "Student vacated room (Attendance removed)" }),
        ]);
      }
      await fetchStudents();
    } catch (err) {
      console.error(err);
      alert("Failed to vacate room");
    }
  };

  return (
    <div>
      <Topbar title="Students" subtitle={`${students.length} students registered`} />
      <div className="p-8">
        <Card className="p-6">
          <SectionHeader
            eyebrow="Directory"
            title="All students"
            action={
              <button onClick={openAdd} className="flex items-center gap-1.5 bg-navy text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-navy-light transition-colors">
                <Plus size={15} /> Add student
              </button>
            }
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name, room, course, or student ID…"
            className="mb-4 w-full sm:w-80 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-navy/40"
          />
          <Table headers={["Student ID", "Name", "Room", "Course", "Phone", "Date of Joining", "Date of Vacating", "Attendance Format", "Fee status", "Actions"]}>
            {filtered.map((s) => {
              const stats = computeStudentAttendanceStats(s, records, students);
              return (
                <tr key={s.id} className="hover:bg-parchment/60">
                  <td className="py-3 px-4"><KeyTag>{s.id}</KeyTag></td>
                  <td className="py-3 px-4 font-medium text-ink">{s.name}</td>
                  <td className="py-3 px-4"><RoomTag room={s.room} /></td>
                  <td className="py-3 px-4 text-ink/70">{courseDisplay(s)}</td>
                  <td className="py-3 px-4 text-ink/70">{s.phone}</td>
                  <td className="py-3 px-4 text-ink/80 whitespace-nowrap">
                    <span className="text-xs flex items-center gap-1.5">
                      <Calendar size={13} className="text-navy shrink-0" />
                      {formatDate(s.dateOfJoining)}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {s.dateOfVacating ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-warn bg-warn/10 px-2 py-0.5 rounded-md border border-warn/20">
                        <LogOut size={11} className="shrink-0" />
                        {formatDate(s.dateOfVacating)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-ok bg-ok/10 px-2 py-0.5 rounded-md border border-ok/20">
                        <CheckCircle size={11} className="shrink-0" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {s.dateOfVacating || s.status === 'Vacated' ? (
                      <div>
                        <span className="text-xs text-ink/40 italic block">0 / 0</span>
                        <span className="text-[10px] font-semibold text-warn bg-warn/15 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                          Vacated (Attendance Removed)
                        </span>
                      </div>
                    ) : stats.rate === null ? (
                      <div>
                        <span className="text-xs text-ink/40 italic block">{stats.format}</span>
                        <span className="text-[10px] font-semibold text-tag-dark bg-tag/15 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                          New Joiner
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1 min-w-[125px]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-ink">{stats.format}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${stats.rate < 75 ? "bg-warn" : stats.rate < 90 ? "bg-navy" : "bg-ok"}`}
                              style={{ width: `${stats.rate}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${stats.badgeColor}`}>
                            {stats.rate >= 90 ? "Excellent" : stats.rate >= 75 ? "Good" : "Low"}
                          </span>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4"><StatusPill status={s.feeStatus} /></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {s.room && !s.dateOfVacating && (
                        <button
                          onClick={() => handleVacate(s)}
                          title={`Vacate ${s.name} from room ${s.room}`}
                          className="text-xs font-medium text-warn bg-warn/10 hover:bg-warn/20 px-2.5 py-1.5 rounded-md transition-colors"
                        >
                          Vacate
                        </button>
                      )}
                      <RowActions onView={() => setViewItem(s)} onEdit={() => openEdit(s)} onDelete={() => setConfirmId(s.id)} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="py-8 text-center text-ink/40 text-sm">No students found.</td></tr>
            )}
          </Table>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit student" : "Add student"}>
        <form onSubmit={handleSubmit}>
          <Field label="Student ID *">
            <Input required value={form.id || ""} onChange={(e) => setForm({ ...form, id: e.target.value })} disabled={!!editingId} placeholder="e.g. STU-001" />
          </Field>
          <Field label="Full name *">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Room number">
            {vacantRooms.length === 0 && !form.room ? (
              <p className="text-xs text-warn font-medium bg-warn/10 rounded-lg px-3 py-2.5">
                No vacant rooms right now. Free up a bed or add a new room first.
              </p>
            ) : (
              <Select
                required
                options={[
                  ...(form.room && !vacantRooms.some((r) => r.number === form.room) ? [selectedRoomLabel] : []),
                  ...vacantRooms.map(roomLabel),
                ]}
                value={selectedRoomLabel}
                onChange={(e) => setForm({ ...form, room: e.target.value.split(" — ")[0] })}
              />
            )}
          </Field>
          <Field label="Course *">
            <Input required placeholder="e.g. B.Tech CSE" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
          </Field>
          <Field label="Year *">
            <Select required options={YEAR_OPTIONS} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
          </Field>
          <Field label="Date of birth">
            <Input required type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          </Field>
          <Field label="Date of joining *">
            <Input required type="date" value={form.dateOfJoining || todayIso} onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })} />
          </Field>
          <Field label="Date of vacating (optional)">
            <Input type="date" value={form.dateOfVacating || ""} onChange={(e) => setForm({ ...form, dateOfVacating: e.target.value })} />
            <span className="text-[11px] text-ink/40 mt-1 block">Leave empty if student is an active resident</span>
          </Field>
          <Field label="Phone">
            <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Father's name">
            <Input required value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} />
          </Field>
          <Field label="Address">
            <Input required placeholder="e.g. 12, Gandhi Street, Chennai" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Fee status">
            <Select options={["Paid", "Due", "Overdue"]} value={form.feeStatus} onChange={(e) => setForm({ ...form, feeStatus: e.target.value })} />
          </Field>
          <p className="text-xs text-ink/40 -mt-2 mb-4">
            Attendance rate is automatically analyzed and increases day-by-day as roll-call is marked from the student's date of joining.
          </p>
          <FormActions onCancel={() => setModalOpen(false)} submitLabel={editingId ? "Save changes" : "Add student"} />
        </form>
      </Modal>

      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Delete student">
        <p className="text-sm text-ink/70 mb-5">This will permanently remove this student record. This can't be undone.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmId(null)} className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink rounded-lg">Cancel</button>
          <button onClick={() => handleDelete(confirmId)} className="px-4 py-2 text-sm font-medium bg-warn text-white rounded-lg hover:bg-warn/90">Delete</button>
        </div>
      </Modal>

      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Student profile" wide>
        {viewItem && (
          <div>
            <div className="flex items-center gap-4 pb-5 mb-5 border-b border-line">
              <div className="w-16 h-16 shrink-0 rounded-full bg-navy text-white flex items-center justify-center font-display font-bold text-xl">
                {initials(viewItem.name)}
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-lg text-ink truncate">{viewItem.name}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <KeyTag>{viewItem.id}</KeyTag>
                  <StatusPill status={viewItem.feeStatus} />
                  {viewItem.dateOfVacating ? (
                    <span className="text-xs font-semibold text-warn bg-warn/10 px-2.5 py-1 rounded-md border border-warn/20 flex items-center gap-1">
                      <LogOut size={12} /> Vacated ({formatDate(viewItem.dateOfVacating)})
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-ok bg-ok/10 px-2.5 py-1 rounded-md border border-ok/20 flex items-center gap-1">
                      <CheckCircle size={12} /> Active Resident
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 bg-parchment rounded-lg p-3.5">
                <GraduationCap size={17} className="text-navy mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Course</p>
                  <p className="text-sm text-ink font-medium mt-0.5">{courseDisplay(viewItem)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-parchment rounded-lg p-3.5">
                <Cake size={17} className="text-navy mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Date of birth</p>
                  <p className="text-sm text-ink font-medium mt-0.5">{formatDob(viewItem.dob)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-parchment rounded-lg p-3.5">
                <Calendar size={17} className="text-navy mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Date of Joining</p>
                  <p className="text-sm text-ink font-semibold mt-0.5">{formatDate(viewItem.dateOfJoining)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-parchment rounded-lg p-3.5">
                <LogOut size={17} className={viewItem.dateOfVacating ? "text-warn mt-0.5 shrink-0" : "text-ok mt-0.5 shrink-0"} />
                <div>
                  <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Date of Vacating</p>
                  <p className="text-sm font-semibold mt-0.5">
                    {viewItem.dateOfVacating ? (
                      <span className="text-warn">{formatDate(viewItem.dateOfVacating)}</span>
                    ) : (
                      <span className="text-ok font-medium">Currently Residing (Active)</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-parchment rounded-lg p-3.5">
                <BedDouble size={17} className="text-navy mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Room</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <RoomTag room={viewItem.room} />
                    {viewItem.room && !viewItem.dateOfVacating && (
                      <button
                        onClick={() => { handleVacate(viewItem); setViewItem({ ...viewItem, room: "", dateOfVacating: todayIso, status: 'Vacated' }); }}
                        className="text-xs font-medium text-tag-dark hover:underline"
                      >
                        Vacate
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-parchment rounded-lg p-3.5">
                <Phone size={17} className="text-navy mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Phone</p>
                  <p className="text-sm text-ink font-medium mt-0.5">{viewItem.phone || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-parchment rounded-lg p-3.5">
                <Wallet size={17} className="text-navy mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Fee status</p>
                  <p className="text-sm text-ink font-medium mt-0.5"><StatusPill status={viewItem.feeStatus} /></p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-parchment rounded-lg p-3.5">
                <User size={17} className="text-navy mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Father's name</p>
                  <p className="text-sm text-ink font-medium mt-0.5">{viewItem.fatherName || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-parchment rounded-lg p-3.5 sm:col-span-2">
                <MapPin size={17} className="text-navy mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Address</p>
                  <p className="text-sm text-ink font-medium mt-0.5">{viewItem.address || "—"}</p>
                </div>
              </div>
            </div>

            <div className="mt-3 bg-parchment rounded-lg p-4 border border-line">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity size={17} className="text-navy shrink-0" />
                  <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">Attendance Rate Analysis</p>
                </div>
                {(() => {
                  const stats = computeStudentAttendanceStats(viewItem, records, students);
                  return (
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${stats.badgeColor}`}>
                      {stats.analysis}
                    </span>
                  );
                })()}
              </div>
              {(() => {
                const stats = computeStudentAttendanceStats(viewItem, records, students);
                if (stats.rate === null) {
                  return (
                    <p className="text-sm text-ink/45 italic">
                      New student — roll call attendance will start tracking and incrementing day-by-day from {formatDate(viewItem.dateOfJoining)}.
                    </p>
                  );
                }
                return (
                  <div>
                    <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                      <div className="bg-white/80 p-2 rounded-lg border border-line">
                        <p className="text-[11px] text-ink/50">Present Days</p>
                        <p className="text-base font-bold text-ok">{stats.presentCount}</p>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg border border-line">
                        <p className="text-[11px] text-ink/50">Absent Days</p>
                        <p className="text-base font-bold text-warn">{stats.absentCount}</p>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg border border-line">
                        <p className="text-[11px] text-ink/50">Present Rate</p>
                        <p className="text-base font-bold text-ink">{stats.rate}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2.5 bg-line rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${stats.rate < 75 ? "bg-warn" : stats.rate < 90 ? "bg-navy" : "bg-ok"}`}
                          style={{ width: `${stats.rate}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-ink">{stats.format}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2 pt-5 mt-2 border-t border-line">
              <button
                onClick={() => { setViewItem(null); openEdit(viewItem); }}
                className="px-4 py-2 text-sm font-medium bg-navy/8 text-navy rounded-lg hover:bg-navy/15"
              >
                Edit student
              </button>
              <button onClick={() => setViewItem(null)} className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink rounded-lg">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
