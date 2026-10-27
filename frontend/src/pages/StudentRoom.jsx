import { useState } from "react";
import { BedDouble, Users, ArrowRight, ShieldAlert, X, CheckCircle } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, SectionHeader, StatCard, RoomTag } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { students as seedStudents, rooms as seedRooms, complaints as seedComplaints } from "../data/mockData";

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function StudentRoom() {
  const { user } = useAuth();
  const [students] = useLocalStorage("shms:students", seedStudents);
  const [rooms] = useLocalStorage("shms:rooms", seedRooms);
  const [complaints, setComplaints] = useLocalStorage("shms:complaints", seedComplaints);

  const [showComplaint, setShowComplaint] = useState(false);
  const [complaintForm, setComplaintForm] = useState({ category: "Electrical", detail: "" });
  const [successMsg, setSuccessMsg] = useState("");

  const me = students.find((s) => String(s.id).trim().toLowerCase() === String(user?.studentId || "").trim().toLowerCase());
  const myRoom = rooms.find((r) => r.number === me?.room);

  const handleDownloadForm = () => {
    if (!me || !myRoom) return;
    const text = `SMART HOSTEL MANAGEMENT SYSTEM\nROOM CHANGE REQUEST FORM\n\nDate: ${new Date().toLocaleDateString()}\n\nStudent Name: ${me.name}\nStudent ID: ${me.id}\nCourse: ${me.course}\nCurrent Room: ${myRoom.number} (Block ${myRoom.block})\n\nReason for Change (Please explain in detail):\n\n\n\n\nRequested Room Type (if any):\n\n\nStudent Signature: __________________\n\n---\nOffice Use Only\nApproved By: __________________\nNew Room Assigned: _______________`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Room_Change_Form_${me.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const submitComplaint = (e) => {
    e.preventDefault();
    if (!complaintForm.detail.trim()) return;
    const newCmp = {
      id: `CMP-${Math.floor(1000 + Math.random() * 9000)}`,
      student: me.name,
      room: myRoom.number,
      category: complaintForm.category,
      detail: complaintForm.detail,
      status: "Open",
      date: new Date().toISOString().split('T')[0]
    };
    setComplaints([newCmp, ...complaints]);
    setShowComplaint(false);
    setComplaintForm({ category: "Electrical", detail: "" });
    setSuccessMsg("Maintenance issue reported successfully!");
    setTimeout(() => setSuccessMsg(""), 4000);
  };
  
  // Find other students assigned to this exact same room, excluding the logged-in student
  const roommates = students.filter((s) => s.room === me?.room && s.id !== user.studentId);

  if (!me || !myRoom) {
    return (
      <div>
        <div className="opacity-0 animate-fade-in">
          <Topbar title="My Room" subtitle="Room details" />
        </div>
        <div className="p-8">
          <Card className="p-8 text-center opacity-0 animate-fade-in-up [animation-delay:100ms]">
            <ShieldAlert size={32} className="mx-auto text-warn/50 mb-3" />
            <p className="text-lg font-display font-bold text-ink">No Room Assigned</p>
            <p className="text-sm text-ink/50 mt-1">You are not currently assigned to a room. Please contact the Warden.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative z-50 opacity-0 animate-fade-in">
        <Topbar title="My Room" subtitle="Your accommodation details" />
      </div>
      <div className="p-8 space-y-6 max-w-5xl mx-auto">
        
        {successMsg && (
          <div className="bg-ok/10 text-ok p-4 rounded-lg flex items-center gap-3 animate-fade-in-up">
            <CheckCircle size={20} />
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            className="opacity-0 animate-fade-in-up [animation-delay:100ms]" 
            label="Room Number" 
            value={myRoom.number} 
            sub={`Block ${myRoom.block}`} 
            icon={BedDouble} 
          />
          <StatCard 
            className="opacity-0 animate-fade-in-up [animation-delay:150ms]" 
            label="Room Type" 
            value={myRoom.type} 
            sub="Configuration" 
            icon={Users} 
            accent="tag"
          />
          <StatCard 
            className="opacity-0 animate-fade-in-up [animation-delay:200ms]" 
            label="Occupancy" 
            value={`${myRoom.occupied} / ${myRoom.capacity}`} 
            sub={myRoom.occupied < myRoom.capacity ? "Beds available" : "Fully occupied"} 
            icon={ArrowRight} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 opacity-0 animate-fade-in-up [animation-delay:300ms]">
            <SectionHeader eyebrow="Peers" title="My Roommates" />
            
            {roommates.length === 0 ? (
              <div className="bg-parchment/50 p-6 rounded-lg text-center mt-4 border border-line border-dashed">
                <p className="text-sm text-ink/60 font-medium">You have no roommates currently.</p>
                <p className="text-xs text-ink/40 mt-1">Enjoy the peace and quiet!</p>
              </div>
            ) : (
              <div className="space-y-4 mt-5">
                {roommates.map((rm) => (
                  <div key={rm.id} className="flex items-center gap-4 p-3 hover:bg-parchment/60 rounded-lg transition-colors">
                    <div className="w-10 h-10 rounded-full bg-navy/10 text-navy flex items-center justify-center font-display font-bold text-sm shrink-0">
                      {initials(rm.name)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink">{rm.name}</p>
                      <p className="text-xs text-ink/60 mt-0.5">{rm.course} • {rm.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6 opacity-0 animate-fade-in-up [animation-delay:400ms]">
             <SectionHeader eyebrow="Services" title="Room Actions" />
             <div className="space-y-4 mt-5">
                <div className="p-4 border border-line rounded-lg">
                  <p className="text-sm font-semibold text-ink">Request Room Change</p>
                  <p className="text-xs text-ink/60 mt-1 leading-relaxed">
                    If you wish to change your room due to maintenance issues, roommate conflicts, or preference, you must submit a formal application to the Warden's office.
                  </p>
                  <button 
                    onClick={handleDownloadForm}
                    className="mt-3 text-xs font-semibold text-navy bg-navy/10 hover:bg-navy/20 px-3 py-1.5 rounded transition-colors"
                  >
                    Download Form
                  </button>
                </div>
                
                <div className="p-4 border border-line rounded-lg">
                  <p className="text-sm font-semibold text-ink">Report Maintenance Issue</p>
                  <p className="text-xs text-ink/60 mt-1 leading-relaxed">
                    Facing issues with electrical, plumbing, or furniture? Raise a complaint directly to get it fixed.
                  </p>
                  <button 
                    onClick={() => setShowComplaint(true)}
                    className="mt-3 text-xs font-semibold text-tag-dark bg-tag/15 hover:bg-tag/25 px-3 py-1.5 rounded transition-colors"
                  >
                    Raise Complaint
                  </button>
                </div>
             </div>
          </Card>
        </div>

      </div>

      {showComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-line overflow-hidden flex flex-col animate-fade-in-up">
            <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-parchment/30">
              <h3 className="font-display font-bold text-lg text-ink">Raise Complaint</h3>
              <button 
                onClick={() => setShowComplaint(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-ink/5 hover:bg-ink/10 text-ink/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={submitComplaint} className="p-6 space-y-5">
              <label className="block">
                <span className="block text-xs font-semibold text-ink/60 uppercase tracking-wide mb-1.5">Category</span>
                <select 
                  value={complaintForm.category}
                  onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                  className="w-full text-sm outline-none border border-line rounded-lg px-3 py-2.5 focus:border-navy/40 bg-transparent"
                >
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Internet">Internet</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="block">
                <span className="block text-xs font-semibold text-ink/60 uppercase tracking-wide mb-1.5">Issue Details</span>
                <textarea 
                  required
                  rows={4}
                  value={complaintForm.detail}
                  onChange={(e) => setComplaintForm({ ...complaintForm, detail: e.target.value })}
                  placeholder="Describe the issue you're facing..."
                  className="w-full text-sm outline-none border border-line rounded-lg px-3 py-2.5 focus:border-navy/40 bg-transparent resize-none"
                />
              </label>
              
              <button 
                type="submit"
                className="w-full text-sm font-semibold text-white bg-navy hover:bg-navy-light px-5 py-2.5 rounded-lg transition-colors mt-2"
              >
                Submit Complaint
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
