import { useMemo, useState } from "react";
import { Download, Banknote, CalendarDays, Printer, X, Building2 } from "lucide-react";
import Topbar from "../components/Topbar";
import { Card, SectionHeader, StatusPill, Table } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { salaryRecords as seedSalaries, staffAccounts as seedStaff } from "../data/mockData";

export default function StaffSalary() {
  const { user } = useAuth();
  const [salaries] = useLocalStorage("shms:salary", seedSalaries);
  const [staff] = useLocalStorage("shms:staff", seedStaff);

  const [selectedSlip, setSelectedSlip] = useState(null);

  const myDetails = useMemo(() => {
    return staff.find(s => s.name === user.name) || {
      id: "STF-XXX",
      name: user.name,
      role: user.role,
    };
  }, [user, staff]);

  const mySalaries = useMemo(() => {
    return salaries.filter(s => s.staffName === user.name || s.staffId === myDetails.id);
  }, [salaries, user, myDetails]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] animate-fade-in-up">
      <div className="print:hidden">
        <Topbar title="My Salary Slips" subtitle="View and download your monthly pay slips" />
        <div className="p-8 space-y-6 max-w-6xl mx-auto">

          {/* Summary Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="p-6 bg-gradient-to-br from-navy to-navy-light text-white border-none relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Banknote size={64} />
              </div>
              <div className="relative z-10">
                <p className="text-white/70 text-sm font-semibold uppercase tracking-widest mb-1">YTD Net Earnings</p>
                <p className="font-display text-3xl font-bold">
                  ₹{mySalaries.reduce((sum, sal) => sum + sal.netPay, 0).toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-white/50 mt-1">Total received this year</p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-navy/5 text-navy flex items-center justify-center">
                  <Banknote size={16} />
                </div>
                <p className="text-ink/60 text-sm font-semibold uppercase tracking-widest">Current Basic Pay</p>
              </div>
              <p className="font-display text-2xl font-bold text-ink">
                ₹{(mySalaries[mySalaries.length - 1]?.basic || 0).toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-ink/40 mt-1">Subject to standard deductions</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-navy/5 text-navy flex items-center justify-center">
                  <CalendarDays size={16} />
                </div>
                <p className="text-ink/60 text-sm font-semibold uppercase tracking-widest">Last Payout</p>
              </div>
              <p className="font-display text-2xl font-bold text-ink">
                {mySalaries.find(sal => sal.status === "Paid")?.paidOn || "Pending"}
              </p>
              <p className="text-xs text-ink/40 mt-1">Direct bank transfer</p>
            </Card>
          </div>

          <Card className="p-6">
            <SectionHeader
              eyebrow="Finances"
              title="Detailed Salary History"
              action={<Banknote size={20} className="text-navy/50" />}
            />

            {mySalaries.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-ink/50">No salary records found.</p>
              </div>
            ) : (
              <Table headers={["Month", "Basic Pay", "Allowances", "Deductions", "Net Pay", "Status", "Action"]}>
                {mySalaries.map((sal) => (
                  <tr key={sal.id} className="hover:bg-parchment/60 transition-colors">
                    <td className="py-3 px-4 font-medium text-ink flex items-center gap-2">
                      <CalendarDays size={14} className="text-ink/50" />
                      {sal.month}
                    </td>
                    <td className="py-3 px-4 text-ink/70">₹{sal.basic.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4 text-ok font-medium">+₹{sal.allowances.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4 text-warn font-medium">-₹{sal.deductions.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4 font-bold text-navy">₹{sal.netPay.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4">
                      <StatusPill status={sal.status} />
                      {sal.status === "Paid" && sal.paidOn && (
                        <div className="text-[10px] text-ink/40 mt-1">On {sal.paidOn}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedSlip(sal)}
                        className="flex items-center gap-1.5 bg-navy/10 hover:bg-navy/20 text-navy px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Download size={14} /> Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </div>
      </div>

      {/* SALARY SLIP MODAL & PRINT VIEW */}
      {selectedSlip && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/60 backdrop-blur-sm print:bg-white print:backdrop-blur-none p-4 sm:p-6 print:p-0 transition-all">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto print:overflow-visible print:max-h-none print:w-full print:max-w-none print:rounded-none shadow-2xl print:shadow-none flex flex-col relative animate-fade-in-up">

            {/* Modal Controls (Hidden in Print) */}
            <div className="sticky top-0 right-0 p-4 flex justify-end gap-3 border-b border-line bg-white/80 backdrop-blur-md z-10 print:hidden rounded-t-2xl">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-navy-light transition-colors shadow-md"
              >
                <Printer size={16} /> Print / Download
              </button>
              <button
                onClick={() => setSelectedSlip(null)}
                className="w-9 h-9 flex items-center justify-center bg-ink/5 hover:bg-ink/10 text-ink rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="p-8 sm:p-12 print:p-8 bg-white text-ink">

              {/* Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between border-b-2 border-navy/10 pb-6 mb-8 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-navy text-white rounded-xl flex items-center justify-center shadow-lg">
                    <Building2 size={28} />
                  </div>
                  <div className="text-center sm:text-left">
                    <h1 className="font-display text-2xl font-bold text-navy tracking-tight">Hosteller System</h1>
                    <p className="text-sm text-ink/60 font-medium">Smart Hostel Management</p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <h2 className="text-xl font-bold text-ink uppercase tracking-widest opacity-20">Salary Slip</h2>
                  <p className="font-semibold text-navy mt-1">Month: <span className="text-ink">{selectedSlip.month}</span></p>
                  <p className="text-xs text-ink/50 mt-1">Receipt ID: {selectedSlip.id}</p>
                </div>
              </div>

              {/* Employee Details */}
              <div className="bg-parchment/40 rounded-xl p-5 mb-8 border border-line">
                <h3 className="text-xs font-bold text-navy uppercase tracking-wider mb-4 border-b border-line/50 pb-2">Employee Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-ink/50 mb-1">Employee Name</p>
                    <p className="font-semibold text-ink">{myDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink/50 mb-1">Employee ID</p>
                    <p className="font-semibold text-ink">{myDetails.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink/50 mb-1">Designation</p>
                    <p className="font-semibold text-ink">{myDetails.role}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink/50 mb-1">Payment Status</p>
                    <div className="font-semibold text-ink flex items-center gap-2">
                      <span className={selectedSlip.status === "Paid" ? "text-ok" : "text-warn"}>{selectedSlip.status}</span>
                      {selectedSlip.status === "Paid" && <span className="text-xs font-normal text-ink/50">(On {selectedSlip.paidOn})</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Salary Details */}
              <h3 className="text-xs font-bold text-navy uppercase tracking-wider mb-4 border-b border-line/50 pb-2">Earnings & Deductions</h3>
              <div className="flex flex-col sm:flex-row gap-6 mb-8">
                {/* Earnings */}
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-ink/70">Basic Pay</span>
                    <span className="font-medium">₹{selectedSlip.basic.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink/70">Allowances (HRA, DA)</span>
                    <span className="font-medium text-ok">+ ₹{selectedSlip.allowances.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="border-t border-dashed border-line pt-2 flex justify-between font-semibold">
                    <span>Total Earnings</span>
                    <span>₹{(selectedSlip.basic + selectedSlip.allowances).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px bg-line/50"></div>

                {/* Deductions */}
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-ink/70">Tax / TDS</span>
                    <span className="font-medium text-warn">- ₹{selectedSlip.deductions.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="border-t border-dashed border-line pt-2 flex justify-between font-semibold mt-auto">
                    <span>Total Deductions</span>
                    <span className="text-warn">₹{selectedSlip.deductions.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="bg-gradient-to-r from-navy to-navy-light text-white rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Banknote size={80} />
                </div>
                <div className="relative z-10 text-center sm:text-left mb-2 sm:mb-0">
                  <p className="text-white/70 text-sm font-medium uppercase tracking-widest">Net Salary Payable</p>
                  <p className="text-3xl font-display font-bold mt-1">₹{selectedSlip.netPay.toLocaleString("en-IN")}</p>
                </div>
                <div className="relative z-10 text-right">
                  <div className="w-24 border-b-2 border-white/20 mb-8 mx-auto sm:mx-0"></div>
                  <p className="text-xs text-white/50 uppercase tracking-widest">Authorized Signatory</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-12 text-center text-xs text-ink/40 font-medium print:mt-16">
                <p>This is a computer-generated document. No signature is required.</p>
                <p>Smart Hostel Management System &copy; 2026</p>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
