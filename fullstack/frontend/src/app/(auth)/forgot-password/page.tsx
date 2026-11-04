"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { api } from "@/lib/api";
import styles from "../auth.module.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await api.post<{ message: string }>("/auth/forgot-password", { email });
      setMessage(response.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "We could not send the reset email. Please try again.");
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
            <h2 className={styles.title}>Forgot your password?</h2>
            <p className={styles.subtitle}>
              Enter your account email and we&apos;ll send you a secure reset link.
            </p>
          </div>

          {message && (
            <div className="alert alert-success animate-fadeIn" style={{ marginBottom: 16 }}>
              <span>✅</span>
              <div>{message}</div>
            </div>
          )}
          {error && (
            <div className="alert alert-error animate-fadeIn" style={{ marginBottom: 16 }}>
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label" htmlFor="email">Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={16}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
                <input
                  type="email"
                  id="email"
                  className="input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={loading}
                  style={{ paddingLeft: 42 }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? "Sending link..." : "Send reset link"}
            </button>
          </form>

          <p className={styles.footer}>
            Remembered your password?{" "}
            <Link href="/login" className={styles.link}>Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
