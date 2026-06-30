"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken } from "@/lib/auth";
import { 
  Ghost, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Mail, 
  MessageSquare,
  Lock,
  ChevronRight
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (getToken()) {
      router.replace("/dashboard");
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  if (checkingAuth) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#050810" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div className="spinner" style={{ width: 32, height: 32, borderTopColor: "var(--accent-primary)" }} />
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Initializing workspace...</span>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: MessageSquare,
      title: "Audio Transcription",
      desc: "Upload meeting recordings and transcribe them automatically with high-accuracy Whisper speech-to-text API.",
      color: "var(--accent-primary)",
      bg: "rgba(99, 102, 241, 0.08)",
    },
    {
      icon: Sparkles,
      title: "Intelligence Extraction",
      desc: "Automatically summarize key highlights, capture decisions, and identify unresolved issues with LLaMA 3.3.",
      color: "var(--accent-secondary)",
      bg: "rgba(139, 92, 246, 0.08)",
    },
    {
      icon: Zap,
      title: "Action Item Tracker",
      desc: "Extract action items, auto-assign owners, calculate due dates, and track completion progress in real time.",
      color: "var(--accent-green)",
      bg: "rgba(16, 185, 129, 0.08)",
    },
    {
      icon: Mail,
      title: "SMTP Email Follow-ups",
      desc: "Compose professional follow-up templates and dispatch emails directly to task owners via integrated SMTP.",
      color: "var(--accent-amber)",
      bg: "rgba(245, 158, 11, 0.08)",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
      
      {/* Header / Navbar */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 40px",
          maxWidth: 1200,
          width: "100%",
          margin: "0 auto",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--gradient-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
            }}
          >
            <Ghost size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 900, fontSize: "1.1rem", letterSpacing: "-0.02em" }}>MeetingGhost</span>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <Link href="/login" className="btn btn-secondary btn-sm" style={{ padding: "8px 16px" }}>
            Sign In
          </Link>
          <Link href="/signup" className="btn btn-primary btn-sm" style={{ padding: "8px 16px" }}>
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 24px", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
        
        {/* Intro */}
        <div style={{ textAlign: "center", marginBottom: 64 }} className="animate-fadeInUp">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              background: "rgba(99, 102, 241, 0.08)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: 999,
              marginBottom: 24,
            }}
          >
            <Sparkles size={13} color="var(--accent-primary)" />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-primary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              AI-Powered Workspace Intelligence
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2.5rem, 6vw, 3.8rem)",
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              maxWidth: 800,
              margin: "0 auto 20px",
            }}
          >
            Turn raw meetings into <span className="gradient-text">intelligent action items</span>
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.15rem)",
              color: "var(--text-secondary)",
              maxWidth: 600,
              margin: "0 auto 36px",
              lineHeight: 1.7,
            }}
          >
            MeetingGhost automates the entire post-meeting workflow: audio transcription, highlight summaries, decision capture, and SMTP email dispatch.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" className="btn btn-primary btn-lg" style={{ gap: 10 }}>
              <span>Launch Free Workspace</span>
              <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="btn btn-secondary btn-lg" style={{ gap: 8 }}>
              <Lock size={16} />
              <span>Sign In</span>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <section className="grid-2 animate-fadeInUp delay-100" style={{ gap: 24, marginBottom: 80 }}>
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="card card-glow"
                style={{
                  display: "flex",
                  gap: 20,
                  padding: 32,
                  background: "rgba(255,255,255,0.015)",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: f.bg,
                    color: f.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: "1.05rem", marginBottom: 8, color: "var(--text-primary)" }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* Tech Stack Banner */}
        <section
          className="card animate-fadeInUp delay-200"
          style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.03) 100%)",
            borderColor: "rgba(99, 102, 241, 0.15)",
            padding: "24px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="status-dot online" />
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)" }}>
              All Systems Operational — Groq Whisper + LLaMA 3.3 Active
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["FastAPI", "Next.js 14", "SQLite", "Groq AI", "Whisper STT", "SMTP Gmail"].map((tech) => (
              <span key={tech} className="chip" style={{ fontSize: "0.75rem", padding: "4px 10px" }}>
                {tech}
              </span>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "30px 20px",
          textAlign: "center",
          fontSize: "0.8rem",
          color: "var(--text-muted)",
          marginTop: "auto",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span>© {new Date().getFullYear()} MeetingGhost Workspace. All rights reserved.</span>
          <span>Minor Specialization Project Evaluation Portfolio Piece</span>
        </div>
      </footer>
    </div>
  );
}
