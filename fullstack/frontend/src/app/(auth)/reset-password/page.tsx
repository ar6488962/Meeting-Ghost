"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock } from "lucide-react";
import { api } from "@/lib/api";
import styles from "../auth.module.css";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("This reset link is missing its token. Please request a new one.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post<{ message: string }>("/auth/reset-password", {
        token,
        new_password: password,
      });
      setMessage(response.message);
      setPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "This reset link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authWrapper} style={{ justifyContent: "center" }}>
        <div className={styles.box}>
          <div className={styles.header}>
            <span className={styles.logo}>👻</span>
            <h2 className={styles.title}>Set a new password</h2>
            <p className={styles.subtitle}>Choose a new password for your MeetingGhost account.</p>
          </div>

          {message && (
            <div className="alert alert-success animate-fadeIn" style={{ marginBottom: 16 }}>
              <span>✅</span>
              <div>{message} <Link href="/login" className={styles.link}>Sign in</Link></div>
            </div>
          )}
          {error && (
            <div className="alert alert-error animate-fadeIn" style={{ marginBottom: 16 }}>
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          {!message && (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label" htmlFor="password">New Password</label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={16}
                    style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="input"
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                    style={{ paddingLeft: 42, paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{
                      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                      background: "none", color: "var(--text-muted)", cursor: "pointer",
                      padding: 4, display: "flex", alignItems: "center",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label" htmlFor="confirm-password">Confirm New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirm-password"
                  className="input"
                  placeholder="Enter the password again"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? "Updating password..." : "Reset password"}
              </button>
            </form>
          )}

          <p className={styles.footer}>
            <Link href="/login" className={styles.link}>Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
