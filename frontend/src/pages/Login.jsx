import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { KeyRound, IdCard, User, Cake, Mail, AlertCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { students as seedStudents } from "../data/mockData";
import { ROLES, ROLE_LABELS } from "../utils/roles";

export default function Login() {
  const [tab, setTab] = useState("staff"); // "staff" | "student"
  const { user, loginStaff, loginStudent } = useAuth();
  const [students] = useLocalStorage("shms:students", seedStudents);
  const navigate = useNavigate();

  // If already logged in, redirect them to the dashboard automatically
  if (user) {
    return <Navigate to="/" replace />;
  }

  const [staffForm, setStaffForm] = useState({ username: "", email: "", role: ROLES.ADMIN });
  const [studentForm, setStudentForm] = useState({ studentId: "", dob: "" });
  const [error, setError] = useState("");

  const submitStaff = async (e) => {
    e.preventDefault();
    setError("");
    const res = await loginStaff(staffForm.username, staffForm.email, staffForm.role);
    if (!res.ok) return setError(res.error);
    navigate("/");
  };

  const submitStudent = async (e) => {
    e.preventDefault();
    setError("");
    const res = await loginStudent(studentForm.studentId, studentForm.dob);
    if (!res.ok) return setError(res.error);
    navigate("/");
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-navy overflow-hidden">
      {/* Animated Decorative Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-tag rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse"></div>
        <div className="absolute top-1/2 -right-32 w-[30rem] h-[30rem] bg-navy-light rounded-full mix-blend-multiply filter blur-[128px] opacity-60 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-40 left-1/4 w-80 h-80 bg-parchment rounded-full mix-blend-overlay filter blur-[100px] opacity-20"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl flex items-center justify-center text-tag mb-4">
            <KeyRound size={26} strokeWidth={2.5} />
          </div>
          <h1 className="font-display font-bold text-3xl text-white tracking-tight drop-shadow-md">Hosteller</h1>
          <p className="text-sm text-white/70 mt-1 font-medium">Smart Hostel Management</p>
        </div>

        <div className="backdrop-blur-xl bg-white/95 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/50 overflow-hidden">
          <div className="grid grid-cols-2 bg-navy/5">
            <button
              onClick={() => { setTab("staff"); setError(""); }}
              className={`py-3.5 text-sm font-semibold transition-colors ${tab === "staff" ? "bg-navy text-white" : "bg-parchment text-ink/50 hover:text-ink"
                }`}
            >
              Staff Login
            </button>
            <button
              onClick={() => { setTab("student"); setError(""); }}
              className={`py-3.5 text-sm font-semibold transition-colors ${tab === "student" ? "bg-navy text-white" : "bg-parchment text-ink/50 hover:text-ink"
                }`}
            >
              Student Login
            </button>
          </div>

          <div className="p-7 min-h-[380px]">
            {tab === "staff" ? (
              <form onSubmit={submitStaff}>
                <p className="text-sm text-ink/60 mb-5">Sign in to the staff portal with your username and registered email.</p>
                <label className="block mb-4">
                  <span className="block text-xs font-semibold text-ink/60 uppercase tracking-wide mb-1.5">Role</span>
                  <div className="flex items-center gap-2 border border-line rounded-lg px-3 py-2.5 focus-within:border-navy/40">
                    <ShieldCheck size={16} className="text-ink/40" />
                    <select
                      value={staffForm.role}
                      onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                      className="text-sm outline-none bg-transparent w-full appearance-none cursor-pointer"
                    >
                      {Object.values(ROLES).filter(r => r !== "student").map(r => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </div>
                </label>
                <label className="block mb-4">
                  <span className="block text-xs font-semibold text-ink/60 uppercase tracking-wide mb-1.5">Username</span>
                  <div className="flex items-center gap-2 border border-line rounded-lg px-3 py-2.5 focus-within:border-navy/40">
                    <User size={16} className="text-ink/40" />
                    <input
                      autoFocus
                      value={staffForm.username}
                      onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                      placeholder="e.g. admin"
                      className="text-sm outline-none bg-transparent w-full"
                    />
                  </div>
                </label>
                <label className="block mb-5">
                  <span className="block text-xs font-semibold text-ink/60 uppercase tracking-wide mb-1.5">Email</span>
                  <div className="flex items-center gap-2 border border-line rounded-lg px-3 py-2.5 focus-within:border-navy/40">
                    <Mail size={16} className="text-ink/40" />
                    <input
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      placeholder="e.g. admin@hostel.com"
                      className="text-sm outline-none bg-transparent w-full"
                    />
                  </div>
                </label>
                {error && (
                  <div className="flex items-center gap-2 text-warn text-xs font-medium mb-4 bg-warn/10 px-3 py-2 rounded-lg">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}
                <button type="submit" className="w-full bg-navy text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-navy-light transition-colors">
                  Sign in
                </button>
              </form>
            ) : (
              <form onSubmit={submitStudent}>
                <p className="text-sm text-ink/60 mb-5">Sign in with your Student ID and date of birth.</p>
                <label className="block mb-4">
                  <span className="block text-xs font-semibold text-ink/60 uppercase tracking-wide mb-1.5">Student ID</span>
                  <div className="flex items-center gap-2 border border-line rounded-lg px-3 py-2.5 focus-within:border-navy/40">
                    <IdCard size={16} className="text-ink/40" />
                    <input
                      autoFocus
                      value={studentForm.studentId}
                      onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                      placeholder="e.g. STU-1042"
                      className="text-sm outline-none bg-transparent w-full"
                    />
                  </div>
                </label>
                <label className="block mb-5">
                  <span className="block text-xs font-semibold text-ink/60 uppercase tracking-wide mb-1.5">Date of birth</span>
                  <div className="flex items-center gap-2 border border-line rounded-lg px-3 py-2.5 focus-within:border-navy/40">
                    <Cake size={16} className="text-ink/40" />
                    <input
                      type="date"
                      value={studentForm.dob}
                      onChange={(e) => setStudentForm({ ...studentForm, dob: e.target.value })}
                      className="text-sm outline-none bg-transparent w-full"
                    />
                  </div>
                </label>
                {error && (
                  <div className="flex items-center gap-2 text-warn text-xs font-medium mb-4 bg-warn/10 px-3 py-2 rounded-lg">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}
                <button type="submit" className="w-full bg-navy text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-navy-light transition-colors">
                  Sign in
                </button>

                <div className="mt-8 p-4 rounded-xl bg-navy/5 border border-navy/10 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-tag/20 text-tag-dark flex items-center justify-center shrink-0">
                    <User size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-ink/80 mb-1">Student Portal</h3>
                    <p className="text-[11px] text-ink/50 leading-relaxed">
                      Access your accommodation details, submit maintenance requests, and track your attendance and leave all in one place.
                    </p>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
