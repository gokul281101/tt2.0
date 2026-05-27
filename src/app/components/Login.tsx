import React, { useState } from "react";
import { Lock, Eye, EyeOff, Sparkles, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";

interface LoginProps {
  onLoginSuccess: (email: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Validation & feedback state
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Admin access credentials
  const adminEmail = "admin@juiceshop.com";
  const adminPassword = localStorage.getItem("jsf_admin_password") || "rajkumar";

  const validatePassword = (val: string) => {
    if (!val) {
      setPasswordError("Password is required");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const triggerShake = () => {
    setShouldShake(true);
    setTimeout(() => setShouldShake(false), 600);
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const isPassValid = validatePassword(password);

    if (!isPassValid) {
      triggerShake();
      return;
    }

    setIsLoading(true);
    setLoginError("");

    // Simulate authenticating admin...
    setTimeout(() => {
      if (password === adminPassword) {
        // Success!
        setIsLoading(false);
        setIsSuccess(true);
        
        // Trigger a gorgeous confetti burst
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#1a7a3c", "#f97316", "#eab308", "#10b981", "#34d399"]
        });
        
        // Save session state with implicit admin email
        if (rememberMe) {
          localStorage.setItem("jsf_logged_in", "true");
          localStorage.setItem("jsf_user_email", adminEmail);
        } else {
          sessionStorage.setItem("jsf_logged_in", "true");
          sessionStorage.setItem("jsf_user_email", adminEmail);
        }

        setTimeout(() => {
          onLoginSuccess(adminEmail);
        }, 1000);
      } else {
        // Invalid admin password
        setIsLoading(false);
        setLoginError("Incorrect admin password. Hint: Use the demo code below!");
        triggerShake();
      }
    }, 1200);
  };

  const handleQuickFill = () => {
    setPassword(adminPassword);
    setPasswordError("");
    setLoginError("");
    
    // Smooth micro-interaction showing the user it auto-submits
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.65 },
        colors: ["#1a7a3c", "#f97316", "#a3e635", "#3b82f6"]
      });

      if (rememberMe) {
        localStorage.setItem("jsf_logged_in", "true");
        localStorage.setItem("jsf_user_email", adminEmail);
      } else {
        sessionStorage.setItem("jsf_logged_in", "true");
        sessionStorage.setItem("jsf_user_email", adminEmail);
      }

      setTimeout(() => {
        onLoginSuccess(adminEmail);
      }, 1000);
    }, 800);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background px-4 py-12 font-[Plus_Jakarta_Sans,sans-serif]">
      {/* Dynamic Animated Blobs Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="blob-1 absolute bg-[#1a7a3c]/10 rounded-full blur-3xl w-[35rem] h-[35rem] -top-32 -left-32 animate-pulse" />
        <div className="blob-2 absolute bg-[#f97316]/10 rounded-full blur-3xl w-[30rem] h-[30rem] -bottom-24 -right-16 animate-pulse" />
        <div className="blob-3 absolute bg-[#a3e635]/15 rounded-full blur-3xl w-[25rem] h-[25rem] top-1/3 right-1/4 animate-pulse" />
      </div>

      {/* Embedded style tag for custom fluid animations */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        .blob-1 {
          animation: float-slow 15s infinite ease-in-out;
        }
        .blob-2 {
          animation: float-slow 18s infinite ease-in-out 2s;
        }
        .blob-3 {
          animation: float-slow 12s infinite ease-in-out 4s;
        }
        .shake-element {
          animation: shake-anim 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake-anim {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>

      {/* Main Glassmorphic Login Card */}
      <div 
        className={`w-full max-w-[420px] bg-card/85 backdrop-blur-xl border border-border shadow-2xl rounded-3xl p-8 z-10 transition-all duration-500 hover:border-[#1a7a3c]/30 ${
          shouldShake ? "shake-element" : ""
        } ${isSuccess ? "scale-95 opacity-90 border-green-500/50" : ""}`}
      >
        {/* Brand/Header Section */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="relative mb-3 flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-[#1a7a3c]/20 shadow-inner group">
            <span className="text-3xl transition-transform duration-300 group-hover:scale-125 select-none">🔑</span>
            <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-ping pointer-events-none" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground select-none flex items-center gap-1.5 justify-center">
            Admin <span className="text-primary font-extrabold">Access</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1 px-4">
            Enter the admin password to unlock JuiceShop Finance.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* General Login Error Alert */}
          {loginError && (
            <div className="flex gap-2.5 items-start bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl p-3.5 animate-fadeIn">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Password input field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground flex justify-between w-full">
                <span>Admin Password</span>
                {passwordError && <span className="text-destructive font-normal">{passwordError}</span>}
              </label>
            </div>
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) validatePassword(e.target.value);
                }}
                onBlur={() => validatePassword(password)}
                disabled={isLoading || isSuccess}
                autoFocus
                className={`w-full pl-10 pr-12 py-3.5 bg-input-background rounded-2xl text-sm border focus:outline-none transition-all ${
                  passwordError 
                    ? "border-destructive/50 focus:border-destructive focus:ring-1 focus:ring-destructive" 
                    : "border-border focus:border-primary focus:ring-1 focus:ring-primary"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading || isSuccess}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground p-1 rounded-lg transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember me option */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading || isSuccess}
                className="w-4 h-4 rounded text-primary border-border focus:ring-primary focus:ring-offset-0 accent-primary cursor-pointer transition-all"
              />
              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">Keep me signed in</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isSuccess}
            className={`w-full py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              isSuccess
                ? "bg-green-600 shadow-green-600/30 scale-[0.98]"
                : isLoading
                  ? "bg-primary/80 opacity-90 cursor-not-allowed"
                  : "bg-primary hover:bg-[#156030] hover:shadow-[#1a7a3c]/20 hover:scale-[1.01] active:scale-[0.99] active:shadow-inner"
            }`}
          >
            {isSuccess ? (
              <>
                <Sparkles size={16} className="animate-spin" />
                Unlocking portal...
              </>
            ) : isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Unlock Dashboard
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/80"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-card px-3 text-muted-foreground/60 select-none">Quick Test Drive</span>
          </div>
        </div>

        {/* Quick Demo Access Credentials Card */}
        <button
          type="button"
          onClick={handleQuickFill}
          disabled={isLoading || isSuccess}
          className="w-full bg-[#f0f7ee] hover:bg-[#e4efe0] dark:bg-muted/30 dark:hover:bg-muted/50 border border-dashed border-[#1a7a3c]/30 hover:border-[#1a7a3c]/50 rounded-2xl p-4 transition-all duration-300 text-left flex items-start gap-3 group relative overflow-hidden"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-[#1a7a3c]/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <ShieldCheck size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-[#1a7a3c] dark:text-[#34d399] flex items-center gap-1.5">
              One-Click Admin Unlock
            </h4>
            <p className="text-[11px] text-[#4a6741] dark:text-muted-foreground mt-0.5">
              Autofills the password and unlocks the finance dashboard instantly.
            </p>
          </div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
            <ArrowRight size={14} />
          </div>
        </button>
      </div>
    </div>
  );
}
