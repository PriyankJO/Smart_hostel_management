import { useState, useEffect, useMemo } from "react";
import { Users, Plus, UserPlus } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, SectionHeader, StatusPill, KeyTag, RowActions, Table } from "../components/ui";
import Modal, { Field, Input, FormActions } from "../components/Modal";
import api from "../services/api";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { staffAccounts } from "../data/mockData";

export default function StaffList() {
  const [storedStaff, setStoredStaff] = useLocalStorage("shms:staff", staffAccounts);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    staffId: "",
    username: "",
    name: "",
    role: "",
    phone: "",
    email: "",
    dob: "",
    shift: ""
  });

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/staff');
      if (res.data && res.data.success) {
        setStaffList(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch staff", err);
      if (storedStaff && storedStaff.length > 0) {
        setStaffList(storedStaff);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Get unique roles for the datalist (so admin can select existing or type new)
  const existingRoles = useMemo(() => {
    const roles = staffList.map(s => s.role).filter(Boolean);
    return [...new Set(roles)];
  }, [staffList]);

  const groupedStaff = useMemo(() => {
    const groups = {};
    staffList.forEach(staff => {
      const r = staff.role || 'Uncategorized';
      if (!groups[r]) groups[r] = [];
      groups[r].push(staff);
    });
    return groups;
  }, [staffList]);

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/staff', formData);
      const newStaff = {
        id: formData.staffId,
        staffId: formData.staffId,
        username: formData.username,
        name: formData.name,
        role: formData.role,
        phone: formData.phone,
        email: formData.email,
        dob: formData.dob,
        shift: formData.shift,
        status: "Active"
      };
      setStoredStaff(prev => [...(prev || []).filter(s => s.staffId !== formData.staffId && s.id !== formData.staffId), newStaff]);
      setIsAddOpen(false);
      setFormData({
        staffId: "", username: "", name: "", role: "", phone: "", email: "", dob: "", shift: ""
      });
      fetchStaff();
    } catch (err) {
      console.error("Failed to add staff", err);
      alert(err.response?.data?.message || "Failed to add staff");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Topbar title="Staff Directory" subtitle="Manage all staff and their roles" />
      
      <div className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 animate-fade-in-up">
          <Card className="flex-1 p-8 bg-gradient-to-br from-navy to-navy-light text-white relative overflow-hidden border-none">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Users size={120} />
            </div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-6">
                <Users size={32} />
              </div>
              <h1 className="font-display text-3xl font-bold mb-1">Staff Management</h1>
              <p className="text-white/70 font-medium tracking-wide text-sm mb-6">Add staff, assign roles, and view staff categories.</p>
              
              <button 
                onClick={() => setIsAddOpen(true)}
                className="bg-white text-navy px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-white/90 transition-colors"
              >
                <Plus size={18} />
                Add New Staff
              </button>
            </div>
          </Card>
        </div>

        {loading ? (
          <div className="p-8 text-center text-ink/50">Loading staff...</div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedStaff).length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-ink/50">No staff found in the system.</p>
              </Card>
            ) : (
              Object.entries(groupedStaff).map(([category, staffArray], i) => (
                <div key={category} className="animate-fade-in-up" style={{ animationDelay: `${(i + 1) * 100}ms` }}>
                  <Card className="p-6">
                    <SectionHeader title={`${category} (${staffArray.length})`} />
                    <Table headers={["ID", "Name", "Username", "Phone", "Shift", "Status"]}>
                      {staffArray.map(staff => (
                        <tr key={staff._id} className="hover:bg-ink/5">
                          <td className="py-3 px-4"><KeyTag>{staff.staffId}</KeyTag></td>
                          <td className="py-3 px-4 font-medium text-ink">{staff.name}</td>
                          <td className="py-3 px-4 text-ink/70">{staff.username}</td>
                          <td className="py-3 px-4 text-ink/70">{staff.phone || '—'}</td>
                          <td className="py-3 px-4 text-ink/70">{staff.shift || '—'}</td>
                          <td className="py-3 px-4">
                            <StatusPill status={staff.status === 'Active' ? 'Present' : 'Absent'} />
                          </td>
                        </tr>
                      ))}
                    </Table>
                  </Card>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Modal open={isAddOpen} onClose={() => !submitting && setIsAddOpen(false)} title="Add New Staff">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Staff ID *">
              <Input required name="staffId" value={formData.staffId} onChange={handleChange} placeholder="e.g. STF-001" />
            </Field>
            <Field label="Name *">
              <Input required name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" />
            </Field>
            <Field label="Username *">
              <Input required name="username" value={formData.username} onChange={handleChange} placeholder="Login username" />
            </Field>
            <Field label="Role * (Select or Type new)">
              <input 
                required 
                name="role" 
                value={formData.role} 
                onChange={handleChange} 
                placeholder="e.g. Cleaner, Guard"
                list="role-list"
                className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-navy/40 bg-white"
              />
              <datalist id="role-list">
                {existingRoles.map(r => <option key={r} value={r} />)}
              </datalist>
            </Field>
            <Field label="Phone">
              <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone number" />
            </Field>
            <Field label="Email">
              <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email address" />
            </Field>
            <Field label="Date of Birth">
              <Input type="date" name="dob" value={formData.dob} onChange={handleChange} />
            </Field>
            <Field label="Shift">
              <Input name="shift" value={formData.shift} onChange={handleChange} placeholder="e.g. Morning, Night" />
            </Field>
          </div>
          <div className="mt-4 text-xs text-ink/50 bg-tag/30 p-3 rounded-lg border border-tag-dark/10">
            Note: Default password for new staff is <strong>Staff@123</strong>
          </div>
          <FormActions onCancel={() => setIsAddOpen(false)} submitLabel={submitting ? "Adding..." : "Add Staff"} />
        </form>
      </Modal>
    </div>
  );
}
