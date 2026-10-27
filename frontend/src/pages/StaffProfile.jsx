import { useMemo } from "react";
import { User, Phone, Briefcase, Mail, MapPin, Calendar } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, SectionHeader, KeyTag } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { staffAccounts as seedStaff } from "../data/mockData";

export default function StaffProfile() {
  const { user } = useAuth();
  const [staff] = useLocalStorage("shms:staff", seedStaff);

  const myDetails = useMemo(() => {
    return staff.find(s => s.name === user.name) || {
      id: "STF-XXX",
      name: user.name,
      role: user.role,
      shift: "Day Shift",
      phone: "+91 9876543210",
      email: "staff@hostel.com",
      dob: "1990-01-01",
      address: "Hostel Staff Quarters, Block D"
    };
  }, [user, staff]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] animate-fade-in-up">
      <Topbar title="My Profile" subtitle="Manage your personal details" />
      
      <div className="p-4 lg:p-8 space-y-6 max-w-4xl mx-auto">
        <Card className="p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-tag to-tag-dark opacity-30"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 mt-12">
            <div className="w-24 h-24 rounded-full bg-navy flex items-center justify-center text-white border-4 border-white shadow-lg shrink-0">
              <User size={48} />
            </div>
            
            <div className="text-center sm:text-left flex-1">
              <h1 className="font-display text-2xl font-bold text-ink">{myDetails.name}</h1>
              <p className="text-ink/60 font-medium mb-3">{myDetails.role}</p>
              <KeyTag>{myDetails.id || "STF-102"}</KeyTag>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <SectionHeader title="Contact Information" />
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-parchment flex items-center justify-center text-navy shrink-0">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-ink/50 font-semibold uppercase tracking-wide">Phone Number</p>
                    <p className="text-sm font-medium text-ink">{myDetails.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-parchment flex items-center justify-center text-navy shrink-0">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-ink/50 font-semibold uppercase tracking-wide">Email Address</p>
                    <p className="text-sm font-medium text-ink">{myDetails.email || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-parchment flex items-center justify-center text-navy shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-ink/50 font-semibold uppercase tracking-wide">Address</p>
                    <p className="text-sm font-medium text-ink">{myDetails.address || "Hostel Staff Quarters"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <SectionHeader title="Employment Details" />
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-parchment flex items-center justify-center text-navy shrink-0">
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-ink/50 font-semibold uppercase tracking-wide">Department / Role</p>
                    <p className="text-sm font-medium text-ink">{myDetails.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-parchment flex items-center justify-center text-navy shrink-0">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-ink/50 font-semibold uppercase tracking-wide">Date of Birth</p>
                    <p className="text-sm font-medium text-ink">{myDetails.dob || "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
