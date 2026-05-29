  import React, { useState } from "react";
import { X, Lock, Key, CheckCircle2, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface ChangePasswordModalProps {
  onClose: () => void;
}

export default function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [currentError, setCurrentError] = useState("");
  const [newError, setNewError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Retrieve password from localStorage or default to 'rajkumar' 
  const getStoredPassword = () => {
    return localStorage.getItem("jsf_admin_password") || "rajkumar";
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear errors
    setCurrentError("");
    setNewError("");
    setConfirmError("");
    setGeneralError("");
    
    const storedPassword = getStoredPassword();
    let hasError = false;
    
    if (!currentPassword) {
      setCurrentError("Current password is required");
      hasError = true;
    } else if (currentPassword !== storedPassword) {
      setCurrentError("Incorrect current password");
      hasError = true;
    }
    
    if (!newPassword) {
      setNewError("New password is required");
      hasError = true;
    } else if (newPassword.length < 6) {
      setNewError("New password must be at least 6 characters");
      hasError = true;
    } else if (newPassword === currentPassword) {
      setNewError("New password cannot be the same as current password");
      hasError = true;
    }
    
    if (!confirmPassword) {
      setConfirmError("Please confirm your new password");
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmError("Passwords do not match");
      hasError = true;
    }
    
    if (hasError) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword })
      });
      if (!response.ok) {
        const data = await response.json();
        setGeneralError(data.message || "Failed to update password");
      } else {
        localStorage.setItem("jsf_admin_password", newPassword);
        setIsSuccess(true);
        confetti({
          particleCount: 100,
          spread: 60,
          origin: { y: 0.55 },
          colors: ["#1a7a3c", "#f97316", "#eab308"]
        });
        setTimeout(() => {
          onClose();
        }, 1600);
      }
    } catch (err) {
      setGeneralError("Network error while updating password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-[Plus_Jakarta_Sans,sans-serif]">
      <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300 transform scale-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Key size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Change Password</h3>
              <p className="text-[10px] text-muted-foreground font-medium">Update admin security credentials</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={isLoading || isSuccess}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/70 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto">
          {isSuccess ? (
            <div className="text-center py-6 space-y-3 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-600 animate-bounce">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="text-sm font-bold text-foreground">Password Changed Successfully!</h4>
              <p className="text-xs text-muted-foreground px-4">
                The new admin passcode has been saved and is active immediately.
              </p>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              
              {generalError && (
                <div className="flex gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl p-3">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              {/* Current Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <label htmlFor="currentPassword">Current Password</label>
                  {currentError && <span className="text-destructive font-normal">{currentError}</span>}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70">
                    <Lock size={14} />
                  </span>
                  <input
                    type="password"
                    id="currentPassword"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2.5 bg-input-background rounded-xl text-xs border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-[DM_Mono,monospace]"
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <label htmlFor="newPassword">New Password</label>
                  {newError && <span className="text-destructive font-normal">{newError}</span>}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70">
                    <Lock size={14} />
                  </span>
                  <input
                    type="password"
                    id="newPassword"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2.5 bg-input-background rounded-xl text-xs border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-[DM_Mono,monospace]"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  {confirmError && <span className="text-destructive font-normal">{confirmError}</span>}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70">
                    <Lock size={14} />
                  </span>
                  <input
                    type="password"
                    id="confirmPassword"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2.5 bg-input-background rounded-xl text-xs border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-[DM_Mono,monospace]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/70 text-muted-foreground transition-all cursor-pointer text-center border border-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-primary hover:bg-[#156030] text-white transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
