"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { setSession } from "@/lib/auth";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";
import styles from "../auth.module.css";

interface SignupResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    full_name: string;
    created_at: string;
  };
}

const benefits = [
  "No credit card required",
  "Full AI meeting analysis instantly",
  "Persistent task & accountability tracking",
  "SMTP email dispatch included",
];

export default function Signup() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await api.post<SignupResponse>("/auth/register", {
        email,
        full_name: fullName,
        password,
      });
      setSession(data.access_token, data.user);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authWrapper}>

        {/* Left: Feature Panel */}
        <div className={styles.featurePanel}>
          <div>
            <div className={styles.featureBrand}>
              <div className={styles.featureBrandIcon}>👻</div>
              <span className={styles.featureBrandText}>MeetingGhost</span>
            </div>
            <h1 className={styles.featureTagline}>
              Your meetings, <span>intelligently managed</span>
            </h1>
            <p className={styles.featureDesc} style={{ marginTop: 12 }}>
              Join and unlock AI-powered meeting intelligence. From raw audio to polished action plans in seconds.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {benefits.map((b) => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle2 size={18} color="var(--accent-green)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{b}</span>
              </div>
            ))}
          </div>

          {/* Tech stack chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["FastAPI", "Next.js 14", "SQLite", "Groq LLaMA", "Whisper"].map((tech) => (
              <span key={tech} className="chip">{tech}</span>
            ))}
          </div>
        </div>

        {/* Right: Signup Form */}
        <div className={styles.box}>
          <div className={styles.header}>
            <span className={styles.logo}>👻</span>
            <h2 className={styles.title}>Create your account</h2>
            <p className={styles.subtitle}>Start your AI meeting intelligence workspace</p>
          </div>

          {error && (
            <div className="alert alert-error animate-fadeIn" style={{ marginBottom: 16 }}>
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label" htmlFor="fullName">Full Name</label>
              <div style={{ position: "relative" }}>
                <User
                  size={16}
                  style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                />
                <input
                  type="text"
                  id="fullName"
                  className="input"
                  placeholder="Sarah Connor"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                  style={{ paddingLeft: 42 }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label" htmlFor="email">Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={16}
                  style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                />
                <input
                  type="email"
                  id="email"
                  className="input"
                  placeholder="sarah@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  style={{ paddingLeft: 42 }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label" htmlFor="password">Password</label>
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
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                  style={{ paddingLeft: 42, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer",
                    padding: 4, display: "flex", alignItems: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="signup-submit-btn"
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: 8, gap: 10 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18 }} />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <p className={styles.footer}>
            Already have an account?{" "}
            <Link href="/login" className={styles.link}>
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
