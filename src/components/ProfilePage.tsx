import React, { useState } from "react";
import { User as UserIcon, Mail, Lock, LogOut } from "lucide-react";
import { User } from "../types";

interface ProfilePageProps {
  user: User | null;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  onOpenTools: () => void;
}

export default function ProfilePage({ user, onLogin, onLogout, onOpenTools }: ProfilePageProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setSuccessMsg("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setAuthError("Email is required.");
      return;
    }

    try {
      if (isRegistering) {
        if (!password) {
          setAuthError("Password is required.");
          return;
        }
        if (password.length < 8) {
          setAuthError("Password must be at least 8 characters.");
          return;
        }
        if (password !== confirmPassword) {
          setAuthError("Passwords do not match.");
          return;
        }

        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: normalizedEmail,
            password,
            confirmPassword,
            name: normalizedEmail.split("@")[0],
          }),
        });

        const registerPayload = await registerResponse.json().catch(() => ({}));
        if (!registerResponse.ok) {
          setAuthError(registerPayload?.error || "Could not create account.");
          return;
        }

        setSuccessMsg(registerPayload?.message || "Account created. You can now sign in.");
        setPassword("");
        setConfirmPassword("");
        setIsRegistering(false);
        return;
      }

      if (isResettingPassword) {
        if (!password) {
          setAuthError("New password is required.");
          return;
        }

        if (password.length < 8) {
          setAuthError("Password must be at least 8 characters.");
          return;
        }

        if (password !== confirmPassword) {
          setAuthError("Passwords do not match.");
          return;
        }

        const resetResponse = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail, password, confirmPassword }),
        });

        const resetPayload = await resetResponse.json().catch(() => ({}));
        if (!resetResponse.ok) {
          setAuthError(resetPayload?.error || "Could not reset password.");
          return;
        }

        setSuccessMsg(resetPayload?.message || "Password reset. You can now sign in.");
        setPassword("");
        setConfirmPassword("");
        setIsResettingPassword(false);
        return;
      }

      if (!password) {
        setAuthError("Password is required.");
        return;
      }

      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      const loginPayload = await loginResponse.json().catch(() => ({}));
      if (!loginResponse.ok) {
        setAuthError(loginPayload?.error || "Invalid credentials.");
        return;
      }

      setSuccessMsg("Signed in successfully.");
      await onLogin();
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setAuthError("Could not reach authentication server.");
    }
  };

  const handleForgotPasswordReset = async () => {
    setAuthError("");
    setSuccessMsg("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setAuthError("Enter your email first.");
      return;
    }

    setIsRegistering(false);
    setIsResettingPassword(true);
    setPassword("");
    setConfirmPassword("");
    setSuccessMsg("Enter and confirm your new password, then submit to reset it.");
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-8">
        <div className="bg-white border border-slate-250/70 p-8 rounded-3xl shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-accent-purple/10 border border-accent-purple/20 rounded-full flex items-center justify-center mx-auto text-accent-purple mb-2">
              <UserIcon className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight font-display text-slate-900">
              {isRegistering ? "Create Account" : isResettingPassword ? "Reset Password" : "Sign In"}
            </h2>
            <p className="text-slate-500 text-xs leading-normal">
              Create a local account or sign in to use all planning tools.
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
                {authError}
              </div>
            )}
            {successMsg && (
              <div className="bg-accent-teal/10 border border-accent-teal/20 text-accent-teal text-xs p-3 rounded-xl">
                {successMsg}
              </div>
            )}

            <div className="space-y-1 text-left">
              <label className="block text-xs font-semibold text-slate-700 uppercase">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full text-sm pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-accent-purple"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="block text-xs font-semibold text-slate-700 uppercase">{isResettingPassword ? "New Password" : "Password"}</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="********"
                  className="w-full text-sm pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-accent-purple"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            {(isRegistering || isResettingPassword) && (
              <div className="space-y-1 text-left">
                <label className="block text-xs font-semibold text-slate-700 uppercase">Confirm Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="********"
                    className="w-full text-sm pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-accent-purple"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              className="w-full py-3 bg-accent-purple hover:bg-accent-slate text-white font-medium rounded-xl transition cursor-pointer"
            >
              {isRegistering ? "Create Account" : isResettingPassword ? "Reset Password" : "Sign In"}
            </button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering((prev) => !prev);
                setIsResettingPassword(false);
                setAuthError("");
                setSuccessMsg("");
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-xs text-accent-purple hover:underline font-semibold cursor-pointer"
            >
              {isRegistering ? "Already have an account? Sign In" : "Need an account? Create one"}
            </button>

            {!isRegistering && (
              <div className="mt-2">
                {isResettingPassword ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsResettingPassword(false);
                      setAuthError("");
                      setSuccessMsg("");
                      setPassword("");
                      setConfirmPassword("");
                    }}
                    className="text-xs text-accent-purple hover:underline font-semibold cursor-pointer"
                  >
                    Cancel Password Reset
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleForgotPasswordReset}
                    className="text-xs text-accent-purple hover:underline font-semibold cursor-pointer"
                  >
                    Forgot Password/Reset
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1b3022] font-display">Account Management</h1>
          <p className="text-slate-500 text-sm">All signed-in users have full feature access in this self-hosted app.</p>
        </div>
        <button
          onClick={async () => {
            await onLogout();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div className="md:col-span-5 bg-white border border-slate-250/70 p-6 rounded-2xl shadow-xs space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-accent-purple/10 border border-accent-purple/20 rounded-2xl flex items-center justify-center text-accent-purple shrink-0">
            <UserIcon className="w-7 h-7" />
          </div>
          <div className="overflow-hidden">
            <div className="text-slate-500 text-xs font-mono truncate">{user.email}</div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <p className="text-xs text-slate-500 mb-3">
            You have full access to calculator, scenarios, refinancing, and saved configurations.
          </p>
          <button
            id="cta-open-tools"
            onClick={onOpenTools}
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-accent-purple text-white font-medium rounded-xl hover:bg-accent-slate transition cursor-pointer"
          >
            Open Scenario Tools
          </button>
        </div>
      </div>
    </div>
  );
}
