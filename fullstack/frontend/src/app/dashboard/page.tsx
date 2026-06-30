"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Send,
  Search,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight,
  Activity,
} from "lucide-react";

interface Stats {
  total_meetings: number;
  total_pending_tasks: number;
  total_overdue_tasks: number;
  total_emails_sent: number;
}

interface Meeting {
  id: number;
  title: string;
  summary: string;
  created_at: string;
  action_item_count: number;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 600;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const user = getUser();

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, meetingsData] = await Promise.all([
          api.get<Stats>("/dashboard/stats"),
          api.get<Meeting[]>("/meetings"),
        ]);
        setStats(statsData);
        setMeetings(meetingsData);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredMeetings = meetings.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTasks = (stats?.total_pending_tasks || 0) + (stats?.total_emails_sent || 0);
  const completionRate =
    totalTasks > 0
      ? Math.round(((stats?.total_emails_sent || 0) / totalTasks) * 100)
      : 100;

  const statCards = [
    {
      label: "Total Meetings",
      value: stats?.total_meetings || 0,
      icon: FileText,
      color: "var(--accent-primary)",
      bg: "rgba(99, 102, 241, 0.1)",
      subtext: "Workspace archive",
      trend: "+AI analyzed",
    },
    {
      label: "Pending Tasks",
      value: stats?.total_pending_tasks || 0,
      icon: Clock,
      color: "var(--accent-amber)",
      bg: "rgba(245, 158, 11, 0.1)",
      subtext: "Awaiting completion",
      trend: "Track progress",
    },
    {
      label: "Overdue Items",
      value: stats?.total_overdue_tasks || 0,
      icon: AlertTriangle,
      color: (stats?.total_overdue_tasks || 0) > 0 ? "var(--accent-red)" : "var(--text-muted)",
      bg: (stats?.total_overdue_tasks || 0) > 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(255,255,255,0.04)",
      subtext: "Past deadline",
      trend: "Needs attention",
      danger: (stats?.total_overdue_tasks || 0) > 0,
    },
    {
      label: "Emails Sent",
      value: stats?.total_emails_sent || 0,
      icon: Send,
      color: "var(--accent-green)",
      bg: "rgba(16, 185, 129, 0.1)",
      subtext: "SMTP dispatched",
      trend: "Follow-ups sent",
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="grid-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card skeleton" style={{ height: 120 }} />
          ))}
        </div>
        <div className="card skeleton" style={{ height: 300 }} />
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={18} />
          <div>{error}</div>
        </div>
      )}

      {/* Hero Welcome Card */}
      <section
        className="card"
        style={{
          background:
            "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.06) 60%, transparent 100%)",
          borderColor: "rgba(99, 102, 241, 0.2)",
          position: "relative",
          overflow: "hidden",
          padding: "28px 32px",
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: "absolute",
            right: -30,
            top: -30,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Sparkles size={18} color="var(--accent-primary)" />
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent-primary)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </span>
          </div>
          <h2 style={{ fontSize: "1.55rem", fontWeight: 900, marginBottom: 8, letterSpacing: "-0.02em" }}>
            {user ? `Welcome back, ${user.full_name.split(" ")[0]}! 👋` : "Workspace Intelligence Dashboard"}
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "560px", lineHeight: 1.7 }}>
            Your AI-powered meeting intelligence hub. Transcribe recordings, extract action items, and dispatch follow-ups — all in one place.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <Link href="/dashboard/analyze" className="btn btn-primary btn-sm">
              <Sparkles size={14} />
              <span>Analyze New Meeting</span>
            </Link>
            <Link href="/dashboard/tasks" className="btn btn-secondary btn-sm">
              <CheckCircle2 size={14} />
              <span>View Open Tasks</span>
            </Link>
          </div>
        </div>
        {/* Ghost watermark */}
        <div
          style={{
            position: "absolute",
            right: 24,
            bottom: -10,
            fontSize: "7rem",
            opacity: 0.04,
            fontWeight: 900,
            pointerEvents: "none",
            userSelect: "none",
            lineHeight: 1,
          }}
        >
          👻
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="card animate-fadeInUp"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                animationDelay: `${i * 0.08}s`,
                animationFillMode: "both",
                borderColor: card.danger ? "rgba(239, 68, 68, 0.2)" : "var(--border)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="label" style={{ margin: 0 }}>{card.label}</span>
                <div style={{ padding: 9, borderRadius: 10, background: card.bg, color: card.color, flexShrink: 0 }}>
                  <Icon size={19} />
                </div>
              </div>
              <div
                className="stat-number animate-countUp"
                style={{ color: card.danger ? "var(--accent-red)" : "var(--text-primary)" }}
              >
                {stats ? <AnimatedNumber value={card.value} /> : "—"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <TrendingUp size={12} color={card.color} />
                <span>{card.subtext}</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Main Grid */}
      <section className="grid-2" style={{ gridTemplateColumns: "1.4fr 0.6fr" }}>
        {/* Recent Meetings */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={16} color="var(--accent-primary)" />
              Recent Meetings
            </h3>
            <div style={{ position: "relative", maxWidth: 240, flex: 1 }}>
              <Search
                size={15}
                style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
              />
              <input
                type="text"
                className="input"
                placeholder="Search meetings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 34, height: 36, fontSize: "0.82rem" }}
              />
            </div>
          </div>

          {filteredMeetings.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px 0" }}>
              <span className="empty-state-icon">📂</span>
              <div className="empty-state-title">No meetings yet</div>
              <p className="empty-state-text">
                Analyze your first meeting to see it appear here.
              </p>
              <Link href="/dashboard/analyze" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                <Sparkles size={14} /> Analyze Meeting
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filteredMeetings.slice(0, 5).map((m, idx) => (
                <div
                  key={m.id}
                  className="animate-fadeIn"
                  style={{
                    padding: "16px 18px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    cursor: "pointer",
                    transition: "var(--transition)",
                    animationDelay: `${idx * 0.06}s`,
                    animationFillMode: "both",
                  }}
                  onClick={() => (window.location.href = `/dashboard/meetings/${m.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.04)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <h4 style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.4 }}>
                      {m.title}
                    </h4>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      <Clock size={11} />
                      {new Date(m.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                      WebkitLineClamp: 2,
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      lineHeight: 1.5,
                    }}
                  >
                    {m.summary}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="badge badge-pending">
                      📋 {m.action_item_count} Action Items
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "var(--accent-primary)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                      View <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              ))}
              {meetings.length > 5 && (
                <Link
                  href="/dashboard/meetings"
                  style={{
                    textAlign: "center",
                    fontSize: "0.82rem",
                    color: "var(--accent-primary)",
                    fontWeight: 600,
                    padding: "10px",
                    borderRadius: "var(--radius-md)",
                    border: "1px dashed rgba(99, 102, 241, 0.25)",
                    transition: "var(--transition)",
                    display: "block",
                  }}
                >
                  View all {meetings.length} meetings →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right Side Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Completion Rate */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Task Closure Rate</h3>
            <div>
              <div style={{ position: "relative", height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${completionRate}%`,
                    background: completionRate > 70 ? "var(--gradient-green)" : completionRate > 40 ? "var(--gradient-amber)" : "var(--gradient-red)",
                    borderRadius: 999,
                    transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginTop: 8 }}>
                <span style={{ color: "var(--text-secondary)" }}>Completion Progress</span>
                <span style={{ fontWeight: 800, color: "var(--accent-primary)" }}>{completionRate}%</span>
              </div>
            </div>

            {/* Mini stat breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Pending", value: stats?.total_pending_tasks || 0, color: "var(--accent-amber)" },
                { label: "Overdue", value: stats?.total_overdue_tasks || 0, color: "var(--accent-red)" },
                { label: "Emails", value: stats?.total_emails_sent || 0, color: "var(--accent-green)" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.color }} />
                    <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Quick Actions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/dashboard/analyze" className="btn btn-primary btn-full" style={{ justifyContent: "space-between" }}>
                <span>🎙️ Analyze Meeting</span>
                <ArrowRight size={15} />
              </Link>
              <Link href="/dashboard/tasks" className="btn btn-secondary btn-full" style={{ justifyContent: "space-between" }}>
                <span>📋 Track Actions</span>
                <ArrowRight size={15} />
              </Link>
              <Link href="/dashboard/emails" className="btn btn-secondary btn-full" style={{ justifyContent: "space-between" }}>
                <span>📧 Email History</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Tech Stack Card */}
          <div
            className="card"
            style={{
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)",
              borderColor: "rgba(99,102,241,0.15)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--accent-primary)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Tech Stack
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["FastAPI", "Next.js 14", "Groq LLaMA", "SQLite", "SMTP"].map((t) => (
                <span key={t} className="chip" style={{ fontSize: "0.7rem", padding: "3px 8px" }}>{t}</span>
              ))}
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Minor Specialization project. Custom-built, sans-template.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
