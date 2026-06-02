import { useState } from "react";
import { Key, ShieldAlert, BadgeInfo, Store, Database, Trash2, ShieldCheck } from "lucide-react";
import ChangePasswordModal from "./ChangePasswordModal";
import { SHOPS } from "../constants";
import { toast } from "sonner"; // Sonner is installed in package.json!

interface SettingsViewProps {
  onResetDatabase: () => Promise<void>;
  onSeedDatabase: () => Promise<void>;
}

export function SettingsView({ onResetDatabase, onSeedDatabase }: SettingsViewProps) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  async function handleReset() {
    if (!window.confirm("WARNING: Are you sure you want to RESET the database? This deletes ALL sales, expenses, debts, staff wages, and transactions!")) {
      return;
    }
    
    setIsResetting(true);
    try {
      await onResetDatabase();
      toast.success("Database has been reset back to clean slate!");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset database");
    } finally {
      setIsResetting(false);
    }
  }

  async function handleSeed() {
    if (!window.confirm("Are you sure you want to RE-SEED the database? This will clear everything and load all default sample financial logs!")) {
      return;
    }

    setIsSeeding(true);
    try {
      await onSeedDatabase();
      toast.success("Database has been successfully seeded with realistic logs!");
    } catch (err: any) {
      toast.error(err.message || "Failed to seed database");
    } finally {
      setIsSeeding(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Upper Panel */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="max-w-xl space-y-1 relative z-10">
          <span className="bg-emerald-600/40 text-emerald-300 text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full border border-emerald-500/20">
            Control Center
          </span>
          <h2 className="text-xl font-bold tracking-tight">System & Branch Settings</h2>
          <p className="text-emerald-200/80 text-xs">
            Review juice shop branch profiles, manage administrative passcodes, and trigger database maintenance logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Profiles & Security */}
        <div className="space-y-6">
          {/* Shop Branches profiles */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Store size={15} className="text-emerald-700" />
              Juice Shop Branches Profiles
            </h3>

            <div className="space-y-3">
              {Object.keys(SHOPS).map((sid: any) => {
                const s = SHOPS[sid as keyof typeof SHOPS];
                return (
                  <div key={sid} className="p-3.5 border border-border/70 rounded-xl flex items-center justify-between text-xs bg-muted/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: s.color + "15" }}>
                        {s.emoji}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{s.name.split("—")[1]?.trim() || s.name}</p>
                        <p className="text-[10px] text-muted-foreground">{s.name.split("—")[0]?.trim()}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: s.color }}>
                      Active
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Admin security card */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck size={15} className="text-emerald-700" />
              Administrative Profile Security
            </h3>
            
            <div className="p-4 bg-muted/20 rounded-xl space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="font-semibold text-muted-foreground">Admin Account:</span>
                <span className="font-bold font-[DM_Mono]">admin@jsfinance.com</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted-foreground">Role Access:</span>
                <span className="font-bold text-emerald-800 uppercase bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  Full Administrator
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-primary text-white hover:bg-emerald-800 transition-colors shadow-sm"
            >
              <Key size={14} /> Change Security Passcode
            </button>
          </div>
        </div>

        {/* Right: Database Utility controls */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Database size={15} className="text-emerald-700" />
            Database Seeding & Recovery Logs
          </h3>
          <p className="text-xs text-muted-foreground">
            Clear records or seed mock journal entries to check statistics, visual graphs, and rosters calculations.
          </p>

          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl text-xs flex gap-3 text-amber-950">
            <BadgeInfo size={18} className="text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Maintenance Reminder</p>
              <p className="text-[10px] text-amber-900/80 leading-normal">
                Seeding triggers background execution of mock data (wages, invoices, bills, debts, sales totals) for 2 shops. Reset logs empty all transactional tables.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleSeed}
              disabled={isSeeding || isResetting}
              className="w-full py-2.5 rounded-xl border border-border bg-card text-emerald-800 font-bold hover:bg-muted/30 disabled:opacity-40 transition-colors text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              {isSeeding ? (
                <>
                  <div className="w-4 h-4 border-2 border-emerald-700/30 border-t-emerald-700 rounded-full animate-spin" />
                  Seeding Database Logs...
                </>
              ) : (
                <>
                  <Database size={14} /> Re-seed Sample Roster & Ledger Data
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              disabled={isSeeding || isResetting}
              className="w-full py-2.5 rounded-xl bg-destructive text-white font-bold hover:opacity-90 disabled:opacity-40 transition-all text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              {isResetting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Wiping Transactional Tables...
                </>
              ) : (
                <>
                  <Trash2 size={14} /> Reset Database (Wipe Transactions)
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Password change modal hook */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}
