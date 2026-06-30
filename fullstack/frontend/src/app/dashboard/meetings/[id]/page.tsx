"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ListTodo,
  ShieldAlert,
  Download,
  Copy,
  Check,
  ChevronRight
} from "lucide-react";

interface ActionItem {
  id: number;
  owner_name: string;
  task: string;
  deadline: string;
  status: string;
}

interface MeetingDetails {
  id: number;
  title: string;
  summary: string;
  decisions: string[];
  unresolved_issues: string[];
  risks: string[];
  action_items: ActionItem[];
  created_at: string;
}

export default function MeetingDetailView({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [meeting, setMeeting] = useState<MeetingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"summary" | "decisions" | "actions" | "issues">("summary");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchMeetingDetails() {
      try {
        const data = await api.get<MeetingDetails>(`/meetings/${params.id}`);
        setMeeting(data);
      } catch (err: any) {
        setError(err.message || "Failed to load meeting details");
      } finally {
        setLoading(false);
      }
    }
    fetchMeetingDetails();
  }, [params.id]);

  const handleCopyMarkdown = () => {
    if (!meeting) return;
    const md = `
# Meeting: ${meeting.title}
Date: ${new Date(meeting.created_at).toLocaleString()}

## Summary
${meeting.summary}

## Decisions Made
${meeting.decisions.map((d, i) => `${i + 1}. ${d}`).join("\n") || "None"}

## Action Items
${meeting.action_items.map(item => `- [ ] **${item.owner_name}**: ${item.task} (Due: ${item.deadline})`).join("\n") || "None"}
    `.trim();

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 120 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <span className="spinner" style={{ width: 36, height: 36 }} />
          <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Retrieving analysis...</span>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="card animate-fadeInUp" style={{ maxWidth: 500, margin: "40px auto", textAlign: "center" }}>
        <div className="alert alert-error" style={{ justifyContent: "center" }}>
          <AlertCircle size={20} />
          <div>{error || "Meeting record not found"}</div>
        </div>
        <button onClick={() => router.push("/dashboard")} className="btn btn-primary" style={{ marginTop: 16 }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header Panel */}
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <span style={{ fontSize: "0.72rem", color: "var(--accent-primary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            <Calendar size={13} />
            <span>Analyzed on {new Date(meeting.created_at).toLocaleString()}</span>
          </span>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 900, letterSpacing: "-0.015em", color: "var(--text-primary)" }}>{meeting.title}</h2>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button 
            onClick={handleCopyMarkdown} 
            className="btn btn-secondary"
            style={{ padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.85rem" }}
          >
            {copied ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
            <span>{copied ? "Copied Markdown!" : "Copy MD"}</span>
          </button>
          <button 
            onClick={() => router.push("/dashboard")} 
            className="btn btn-secondary"
            style={{ padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.85rem" }}
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs">
        <button
          onClick={() => setActiveTab("summary")}
          className={`tab ${activeTab === "summary" ? "active" : ""}`}
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <FileText size={16} />
          <span>Summary</span>
        </button>
        <button
          onClick={() => setActiveTab("decisions")}
          className={`tab ${activeTab === "decisions" ? "active" : ""}`}
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <CheckCircle size={16} />
          <span>Decisions Made ({meeting.decisions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("actions")}
          className={`tab ${activeTab === "actions" ? "active" : ""}`}
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <ListTodo size={16} />
          <span>Action Items ({meeting.action_items.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("issues")}
          className={`tab ${activeTab === "issues" ? "active" : ""}`}
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <ShieldAlert size={16} />
          <span>Issues & Risks</span>
        </button>
      </div>

      {/* Content Window */}
      <div className="card animate-fadeIn">
        {activeTab === "summary" && (
          <div>
            <h3 style={{ fontWeight: 800, marginBottom: 16, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: 8 }}>
              <FileText size={18} color="var(--accent-primary)" />
              <span>Meeting Summary</span>
            </h3>
            <div
              style={{
                padding: "20px 24px",
                background: "rgba(99, 102, 241, 0.04)",
                border: "1px solid rgba(99, 102, 241, 0.1)",
                borderRadius: "var(--radius-md)",
                lineHeight: 1.8,
                fontSize: "0.95rem",
                color: "var(--text-primary)",
                whiteSpace: "pre-line"
              }}
            >
              {meeting.summary}
            </div>
          </div>
        )}

        {activeTab === "decisions" && (
          <div>
            <h3 style={{ fontWeight: 800, marginBottom: 16, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle size={18} color="var(--accent-green)" />
              <span>Decisions Made</span>
            </h3>
            {meeting.decisions.length === 0 ? (
              <div className="empty-state" style={{ padding: "40px 0" }}>
                <span className="empty-state-icon">🤔</span>
                <div className="empty-state-title">No decisions extracted</div>
                <p className="empty-state-text">No distinct decisions were identified in this meeting.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {meeting.decisions.map((decision, idx) => (
                  <div
                    key={idx}
                    className="animate-fadeIn"
                    style={{
                      padding: "16px 20px",
                      borderRadius: "var(--radius-md)",
                      background: "linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0%, transparent 100%)",
                      borderLeft: "4px solid var(--accent-green)",
                      fontSize: "0.95rem",
                      animationDelay: `${idx * 0.05}s`,
                      animationFillMode: "both"
                    }}
                  >
                    {decision}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "actions" && (
          <div>
            <h3 style={{ fontWeight: 800, marginBottom: 16, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: 8 }}>
              <ListTodo size={18} color="var(--accent-amber)" />
              <span>Action Items</span>
            </h3>
            {meeting.action_items.length === 0 ? (
              <div className="empty-state" style={{ padding: "40px 0" }}>
                <span className="empty-state-icon">📋</span>
                <div className="empty-state-title">No action items detected</div>
                <p className="empty-state-text">No action items were assigned or discussed.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Owner</th>
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Task</th>
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Deadline</th>
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meeting.action_items.map((item) => (
                      <tr key={item.id} className="table-row-hover" style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 700 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: 8,
                              background: item.status === "Completed" ? "var(--gradient-green)" : "var(--gradient-primary)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "0.7rem", fontWeight: 800, color: "#fff", flexShrink: 0
                            }}>
                              {item.owner_name.charAt(0).toUpperCase()}
                            </div>
                            <span>{item.owner_name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>{item.task}</td>
                        <td style={{ padding: "14px 16px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>{item.deadline}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span className={`badge ${item.status === "Completed" ? "badge-complete" : "badge-pending"}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "issues" && (
          <div className="grid-2">
            <div>
              <h3 style={{ fontWeight: 800, marginBottom: 16, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldAlert size={18} color="var(--text-muted)" />
                <span>Unresolved Issues</span>
              </h3>
              {meeting.unresolved_issues.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>✅ No unresolved issues recorded.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {meeting.unresolved_issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="animate-fadeIn"
                      style={{
                        padding: "14px 18px",
                        borderRadius: "var(--radius-md)",
                        background: "rgba(255,255,255,0.02)",
                        borderLeft: "4px solid var(--text-muted)",
                        fontSize: "0.9rem",
                        animationDelay: `${idx * 0.05}s`,
                        animationFillMode: "both"
                      }}
                    >
                      {issue}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 style={{ fontWeight: 800, marginBottom: 16, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: 8 }}>
                <AlertCircle size={18} color="var(--accent-red)" />
                <span>Risks & Warnings</span>
              </h3>
              {meeting.risks.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>✅ No risks mentioned in this meeting.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {meeting.risks.map((risk, idx) => (
                    <div
                      key={idx}
                      className="animate-fadeIn"
                      style={{
                        padding: "14px 18px",
                        borderRadius: "var(--radius-md)",
                        background: "linear-gradient(90deg, rgba(239, 68, 68, 0.08) 0%, transparent 100%)",
                        borderLeft: "4px solid var(--accent-red)",
                        fontSize: "0.9rem",
                        animationDelay: `${idx * 0.05}s%,`,
                        animationFillMode: "both"
                      }}
                    >
                      {risk}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
