"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { setSession } from "@/lib/auth";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import styles from "../auth.module.css";

interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    full_name: string;
    created_at: string;
  };
}

const features = [
  {
    icon: "🎙️",
    bg: "rgba(99, 102, 241, 0.12)",
    title: "Audio Transcription",
    desc: "Upload recordings or paste transcripts for instant AI processing.",
  },
  {
    icon: "🧠",
    bg: "rgba(139, 92, 246, 0.12)",
    title: "Intelligence Extraction",
    desc: "Auto-detect decisions, action items, risks with LLaMA 3.3 70B.",
  },
  {
    icon: "📋",
    bg: "rgba(16, 185, 129, 0.12)",
    title: "Accountability Tracking",
    desc: "Persistent task board with overdue detection and completion tracking.",
  },
  {
    icon: "✉️",
    bg: "rgba(245, 158, 11, 0.12)",
    title: "Automated Follow-ups",
    desc: "Generate and send personalized SMTP emails per action item owner.",
  },
];

export default function Login() {
  const router = useRouter();
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
      const data = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });
      setSession(data.access_token, data.user);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authWrapper}>

        {/* Left: Feature Showcase Panel */}
        <div className={styles.featurePanel}>
          <div>
            <div className={styles.featureBrand}>
              <div className={styles.featureBrandIcon}>👻</div>
              <span className={styles.featureBrandText}>MeetingGhost</span>
            </div>
            <h1 className={styles.featureTagline}>
              Turn meetings into <span>intelligent action</span>
            </h1>
            <p className={styles.featureDesc} style={{ marginTop: 12 }}>
              AI-powered meeting intelligence that transcribes, summarizes, tracks tasks, and sends follow-up emails — automatically.
            </p>
          </div>

          <div className={styles.featureList}>
            {features.map((f) => (
              <div key={f.title} className={styles.featureItem}>
                <div className={styles.featureItemIcon} style={{ background: f.bg }}>
                  {f.icon}
                </div>
                <div className={styles.featureItemText}>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="status-dot online" />
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Powered by Groq · LLaMA 3.3 70B · Whisper
            </span>
          </div>
        </div>

        {/* Right: Login Form */}
        <div className={styles.box}>
          <div className={styles.header}>
            <span className={styles.logo}>👻</span>
            <h2 className={styles.title}>Welcome back</h2>
            <p className={styles.subtitle}>Sign in to your intelligence workspace</p>
          </div>

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
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={{ paddingLeft: 42, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: 8, gap: 10 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18 }} />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <p className={styles.footer}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className={styles.link}>
              Create one free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
