import { useState, useMemo, useEffect } from "react";
import { Plus, X, Users, Landmark, UserCheck, Calendar, Check, AlertCircle, Save, Banknote, Smartphone, Flame } from "lucide-react";
import type { Staff, AttendanceRecord, SalaryPayment } from "../types";
import { api } from "../api";
import { fmt } from "../utils";

interface AttendanceViewProps {
  staffList: Staff[];
  attendanceRecords: AttendanceRecord[];
  salaryPayments: SalaryPayment[];
  onAddStaff: (s: Omit<Staff, "id">) => void;
  onDeleteStaff: (id: string) => void;
  onUpdateStaff: (id: string, s: Partial<Staff> & { effectiveDate?: string }) => void;
  onSaveAttendance: (staffId: string, date: string, status: "present" | "absent" | "half-day") => void;
  onPaySalary: (p: Omit<SalaryPayment, "id">) => void;
  onDeleteSalaryPayment: (id: string) => void;
}

export function AttendanceView({
  staffList,
  attendanceRecords,
  salaryPayments,
  onAddStaff,
  onDeleteStaff,
  onUpdateStaff,
  onSaveAttendance,
  onPaySalary,
  onDeleteSalaryPayment,
}: AttendanceViewProps) {
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffWage, setNewStaffWage] = useState("");

  // Wage History modal states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryStaff, setSelectedHistoryStaff] = useState<Staff | null>(null);
  const [newWageAmount, setNewWageAmount] = useState("");
  const [newWageEffectiveDate, setNewWageEffectiveDate] = useState(new Date().toISOString().split("T")[0]);

  const activeHistoryStaff = useMemo(() => {
    if (!selectedHistoryStaff) return null;
    return staffList.find(s => s.id === selectedHistoryStaff.id) || selectedHistoryStaff;
  }, [staffList, selectedHistoryStaff]);


  // Salary disburse modal states
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [selectedPayStaff, setSelectedPayStaff] = useState<{ staffId: string; name: string; calculatedSalary: number } | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"cash" | "gpay" | "zomato">("gpay");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payNote, setPayNote] = useState("");

  useEffect(() => {
    if (selectedPayStaff) {
      setPayAmount(selectedPayStaff.calculatedSalary.toString());
      setPayMethod("gpay");
      setPayDate(new Date().toISOString().split("T")[0]);
      setPayNote("");
    }
  }, [selectedPayStaff]);

  const [activeDate, setActiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [activeMonth, setActiveMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
  );

  const [salaryReport, setSalaryReport] = useState<
    { staff: Staff; presentDays: number; halfDays: number; absentDays: number; calculatedSalary: number }[]
  >([]);

  // Load monthly salary report from API
  useEffect(() => {
    async function loadSalaryReport() {
      try {
        const report = await api.getSalaryReport(activeMonth);
        setSalaryReport(report);
      } catch (err) {
        console.error("Error loading salary report:", err);
      }
    }
    loadSalaryReport();
  }, [activeMonth, staffList, attendanceRecords]);

  // Find attendance record for a staff member on the activeDate
  const dailyStatusMap = useMemo(() => {
    const map: Record<string, "present" | "absent" | "half-day" | "none"> = {};
    staffList.forEach((s) => {
      map[s.id] = "none";
    });

    const targetDate = new Date(activeDate);
    targetDate.setHours(0, 0, 0, 0);

    attendanceRecords.forEach((r) => {
      const rDate = new Date(r.date);
      rDate.setHours(0, 0, 0, 0);

      if (rDate.getTime() === targetDate.getTime()) {
        map[r.staffId] = r.status;
      }
    });

    return map;
  }, [attendanceRecords, staffList, activeDate]);

  const isSalaryPaid = (staffId: string) => {
    return (salaryPayments || []).some((p) => p.staffId === staffId && p.monthKey === activeMonth);
  };

  // Compute overall monthly totals
  const monthlyTotalWages = useMemo(() => {
    return salaryReport.reduce((s, r) => s + r.calculatedSalary, 0);
  }, [salaryReport]);

  function handleAddStaffSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newStaffName || !newStaffWage) return;

    onAddStaff({
      name: newStaffName,
      dailyWage: parseFloat(newStaffWage),
    });

    setNewStaffName("");
    setNewStaffWage("");
    setShowAddStaff(false);
  }

  return (
    <div className="space-y-6">
      {/* Upper Info Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-950 rounded-3xl p-6 text-white shadow-lg flex flex-wrap gap-4 items-center justify-between">
        <div className="space-y-1">
          <span className="bg-emerald-600/40 text-emerald-300 text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full border border-emerald-500/20">
            Attendance & Salary Ledger
          </span>
          <h2 className="text-xl font-bold tracking-tight">Staff Attendance & Salaries</h2>
          <p className="text-emerald-100/70 text-xs max-w-md">
            Log daily staff rosters, track present/absent states, and generate automated salary statements based on wages.
          </p>
        </div>
        <button
          onClick={() => setShowAddStaff(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-emerald-900 hover:bg-emerald-50 transition-all shadow-md"
        >
          <Plus size={14} /> Add New Employee
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Total active staff</p>
            <p className="text-xl font-black text-emerald-800 font-[DM_Mono,monospace]">
              {staffList.length} member{staffList.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Landmark size={18} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Calculated Wages (Month)</p>
            <p className="text-xl font-black text-blue-700 font-[DM_Mono,monospace]">
              {fmt(monthlyTotalWages)}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0">
            <UserCheck size={18} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Roster Active Month</p>
            <p className="text-xl font-black text-purple-800 font-[DM_Mono,monospace]">
              {activeMonth}
            </p>
          </div>
        </div>
      </div>

      {/* Two Columns: Daily Roll Call & Monthly Salary Report */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Roll Call Grid */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4 lg:col-span-1">
          <div className="border-b border-border/50 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Daily Attendance Sheet</h3>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Roster Date</label>
            <input
              type="date"
              value={activeDate}
              onChange={(e) => setActiveDate(e.target.value)}
              className="w-full bg-input-background rounded-xl px-3 py-2 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-3 pt-2">
            {staffList.length === 0 ? (
              <p className="text-center text-muted-foreground text-xs py-8 italic">
                No employees registered. Add staff above!
              </p>
            ) : (
              staffList.map((s) => {
                const status = dailyStatusMap[s.id];
                return (
                  <div key={s.id} className="p-3 border border-border/60 rounded-xl bg-muted/10 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-foreground">{s.name}</span>
                      <button
                        onClick={() => {
                          setSelectedHistoryStaff(s);
                          setShowHistoryModal(true);
                          setNewWageAmount("");
                          setNewWageEffectiveDate(new Date().toISOString().split("T")[0]);
                        }}
                        className="text-[10px] font-[DM_Mono] text-muted-foreground hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                        title="View & Manage Wage History"
                      >
                        ₹{s.dailyWage}/day
                      </button>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => onSaveAttendance(s.id, activeDate, "present")}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border flex items-center justify-center gap-1 transition-all ${
                          status === "present"
                            ? "bg-green-700 text-white border-green-700"
                            : "bg-card text-muted-foreground border-border hover:bg-muted/50"
                        }`}
                      >
                        <Check size={11} /> Present
                      </button>
                      <button
                        onClick={() => onSaveAttendance(s.id, activeDate, "half-day")}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border flex items-center justify-center gap-1 transition-all ${
                          status === "half-day"
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-card text-muted-foreground border-border hover:bg-muted/50"
                        }`}
                      >
                        Half Day
                      </button>
                      <button
                        onClick={() => onSaveAttendance(s.id, activeDate, "absent")}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border flex items-center justify-center gap-1 transition-all ${
                          status === "absent"
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-card text-muted-foreground border-border hover:bg-muted/50"
                        }`}
                      >
                        <X size={11} /> Absent
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Monthly Salary Statement */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4 lg:col-span-2">
          <div className="border-b border-border/50 pb-3 flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold text-foreground">Monthly Salary Calculations</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Month:</span>
              <input
                type="month"
                value={activeMonth}
                onChange={(e) => setActiveMonth(e.target.value)}
                className="bg-input-background rounded-lg px-2 py-1 text-xs border border-border focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[10px] font-bold text-muted-foreground uppercase border-b border-border/50 pb-2">
                  <th className="py-2.5">Staff Name</th>
                  <th className="py-2.5">Wage rate</th>
                  <th className="py-2.5 text-center">Days Present</th>
                  <th className="py-2.5 text-center">Half Days</th>
                  <th className="py-2.5 text-center">Days Absent</th>
                  <th className="py-2.5 text-right">Calculated Salary</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {salaryReport.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No reports generated for this month.
                    </td>
                  </tr>
                ) : (
                  salaryReport.map((r) => (
                    <tr key={r.staff.id} className="hover:bg-muted/20">
                      <td className="py-3.5 font-bold text-foreground">{r.staff.name}</td>
                      <td className="py-3.5 font-[DM_Mono] text-muted-foreground">
                        <button
                          onClick={() => {
                            setSelectedHistoryStaff(r.staff);
                            setShowHistoryModal(true);
                            setNewWageAmount("");
                            setNewWageEffectiveDate(new Date().toISOString().split("T")[0]);
                          }}
                          className="hover:text-emerald-700 hover:underline flex items-center gap-1 font-[DM_Mono] cursor-pointer"
                          title="View & Manage Wage History"
                        >
                          ₹{r.staff.dailyWage}
                        </button>
                      </td>
                      <td className="py-3.5 text-center text-green-700 font-bold">{r.presentDays}</td>
                      <td className="py-3.5 text-center text-amber-600 font-bold">{r.halfDays || 0}</td>
                      <td className="py-3.5 text-center text-red-600 font-bold">{r.absentDays}</td>
                      <td className="py-3.5 text-right font-black text-emerald-800 font-[DM_Mono]">
                        {fmt(r.calculatedSalary)}
                      </td>
                      <td className="py-3.5 text-right flex gap-1.5 justify-end items-center">
                        {isSalaryPaid(r.staff.id) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold">
                            Paid
                          </span>
                        ) : (
                          <button
                            disabled={r.calculatedSalary <= 0}
                            onClick={() => {
                              setSelectedPayStaff({
                                staffId: r.staff.id,
                                name: r.staff.name,
                                calculatedSalary: r.calculatedSalary,
                              });
                              setShowDisburseModal(true);
                            }}
                            className="px-2 py-1 text-[9px] font-bold border text-emerald-800 border-emerald-200 bg-emerald-50/50 rounded hover:bg-emerald-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                          >
                            Disburse
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove employee ${r.staff.name}?`)) {
                              onDeleteStaff(r.staff.id);
                            }
                          }}
                          className="px-2 py-1 text-[9px] font-bold border text-red-600 border-red-200 bg-red-50/50 rounded hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Salary Disbursement History Log */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Landmark size={15} className="text-emerald-700" />
          Salary Disbursement History Log
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-[10px] font-bold text-muted-foreground uppercase border-b border-border/50 pb-2">
                <th className="py-2.5">Disbursement Date</th>
                <th className="py-2.5">Employee Name</th>
                <th className="py-2.5">Payment Month</th>
                <th className="py-2.5">Payment Method</th>
                <th className="py-2.5 text-right">Amount Disbursed</th>
                <th className="py-2.5">Notes</th>
                <th className="py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {(!salaryPayments || salaryPayments.length === 0) ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-muted-foreground italic">
                    No salary disbursements logged.
                  </td>
                </tr>
              ) : (
                salaryPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/15 transition-colors">
                    <td className="py-3">
                      {new Date(p.paidDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 font-semibold text-foreground">{p.staffName}</td>
                    <td className="py-3 font-medium text-muted-foreground">{p.monthKey}</td>
                    <td className="py-3 uppercase font-bold text-[10px] text-sky-800">
                      {p.paymentMethod}
                    </td>
                    <td className="py-3 text-right font-black font-[DM_Mono] text-emerald-800">
                      {fmt(p.amount)}
                    </td>
                    <td className="py-3 text-muted-foreground max-w-[150px] truncate">{p.note || "-"}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this salary disbursement record?")) {
                            onDeleteSalaryPayment(p.id);
                          }
                        }}
                        className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Popup */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Register Employee</h3>
                <p className="text-xs text-muted-foreground">Create employee daily wage rate</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStaff(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddStaffSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Karthik Raja"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Daily Wage (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  required
                  value={newStaffWage}
                  onChange={(e) => setNewStaffWage(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs font-[DM_Mono] border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:opacity-90 transition-all shadow-md"
              >
                Save Employee Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Salary Modal */}
      {showDisburseModal && selectedPayStaff && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Disburse Staff Salary</h3>
                <p className="text-xs text-muted-foreground">Register salary dispatches for bookkeeping</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDisburseModal(false);
                  setSelectedPayStaff(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onPaySalary({
                  staffId: selectedPayStaff.staffId,
                  staffName: selectedPayStaff.name,
                  monthKey: activeMonth,
                  amount: parseFloat(payAmount),
                  paymentMethod: payMethod,
                  paidDate: new Date(payDate),
                  note: payNote,
                });
                setShowDisburseModal(false);
                setSelectedPayStaff(null);
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Employee Name</label>
                <input
                  type="text"
                  disabled
                  value={selectedPayStaff.name}
                  className="w-full bg-muted rounded-xl px-4 py-2.5 text-xs border border-transparent font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Payment Month</label>
                <input
                  type="text"
                  disabled
                  value={activeMonth}
                  className="w-full bg-muted rounded-xl px-4 py-2.5 text-xs border border-transparent font-[DM_Mono]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Calculated Salary (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs font-[DM_Mono] border border-border focus:outline-none focus:ring-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Payment Method</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod("cash")}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      payMethod === "cash"
                        ? "bg-amber-50 text-amber-700 border-amber-300"
                        : "bg-muted text-muted-foreground border-transparent"
                    }`}
                  >
                    <Banknote size={14} /> Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod("gpay")}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      payMethod === "gpay"
                        ? "bg-sky-50 text-sky-700 border-sky-300"
                        : "bg-muted text-muted-foreground border-transparent"
                    }`}
                  >
                    <Smartphone size={14} /> GPay
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod("zomato")}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      payMethod === "zomato"
                        ? "bg-orange-50 text-orange-600 border-orange-300"
                        : "bg-muted text-muted-foreground border-transparent"
                    }`}
                  >
                    <Flame size={14} /> Zomato
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Disbursement Date</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Note</label>
                <input
                  type="text"
                  placeholder="e.g. Paid in full"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!payAmount || parseFloat(payAmount) <= 0}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:opacity-90 disabled:opacity-40 transition-all shadow-md cursor-pointer"
              >
                Disburse Salary Payout
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Manage Wage & History Modal */}
      {showHistoryModal && activeHistoryStaff && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Manage Wage Rate</h3>
                <p className="text-xs text-muted-foreground">
                  Update {activeHistoryStaff.name}'s daily wage and view change history
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedHistoryStaff(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* History Table */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Wage Change Log History
                </label>
                <div className="border border-border/60 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/30">
                      <tr className="text-[10px] font-bold text-muted-foreground uppercase border-b border-border/50">
                        <th className="px-3 py-2">Effective Date</th>
                        <th className="px-3 py-2 text-right">Daily Wage</th>
                        <th className="px-3 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {!activeHistoryStaff.wageHistory || activeHistoryStaff.wageHistory.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center py-4 text-muted-foreground italic">
                            No history entries logged.
                          </td>
                        </tr>
                      ) : (
                        [...activeHistoryStaff.wageHistory]
                          .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())
                          .map((entry, idx) => {
                            const isInitial = new Date(entry.effectiveDate).getTime() === 0;
                            return (
                              <tr key={idx} className="hover:bg-muted/15">
                                <td className="px-3 py-2 text-muted-foreground font-semibold">
                                  {isInitial
                                    ? "Initial Base Rate"
                                    : new Date(entry.effectiveDate).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                </td>
                                <td className="px-3 py-2 text-right font-bold text-foreground font-[DM_Mono]">
                                  ₹{entry.dailyWage}
                                </td>
                                <td className="px-3 py-2 text-right font-medium">
                                  {!isInitial ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm("Are you sure you want to delete this historical entry?")) {
                                          const updatedHistory = activeHistoryStaff.wageHistory?.filter(
                                            (h) => h.effectiveDate !== entry.effectiveDate
                                          );
                                          onUpdateStaff(activeHistoryStaff.id, {
                                            wageHistory: updatedHistory,
                                          });
                                        }
                                      }}
                                      className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground/60 italic font-normal">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add New Rate Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newWageAmount) return;
                  onUpdateStaff(activeHistoryStaff.id, {
                    dailyWage: parseFloat(newWageAmount),
                    effectiveDate: newWageEffectiveDate,
                  });
                  setNewWageAmount("");
                }}
                className="space-y-3 pt-3 border-t border-border/50"
              >
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block">
                  Increase or Adjust Wage Rate
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground mb-1 block">New Wage (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 700"
                      required
                      value={newWageAmount}
                      onChange={(e) => setNewWageAmount(e.target.value)}
                      className="w-full bg-input-background rounded-xl px-3 py-2 text-xs font-[DM_Mono] border border-border focus:outline-none focus:ring-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Effective Date</label>
                    <input
                      type="date"
                      required
                      value={newWageEffectiveDate}
                      onChange={(e) => setNewWageEffectiveDate(e.target.value)}
                      className="w-full bg-input-background rounded-xl px-3 py-2 text-xs border border-border focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!newWageAmount || parseFloat(newWageAmount) <= 0}
                  className="w-full py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:opacity-90 disabled:opacity-40 transition-all shadow-md cursor-pointer"
                >
                  Apply Wage Rate Adjustment
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
