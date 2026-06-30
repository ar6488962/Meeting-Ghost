"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import {
  FileText,
  CheckCircle,
  ListTodo,
  ShieldAlert,
  Mail,
  Send,
  UploadCloud,
  FileEdit,
  Play,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Zap,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";

interface ActionItem {
  id: number;
  owner_name: string;
  task: string;
  deadline: string;
  status: string;
}

interface EmailDraft {
  recipient: string;
  subject: string;
  body: string;
}

interface MeetingResult {
  id: number;
  title: string;
  summary: string;
  decisions: string[];
  unresolved_issues: string[];
  risks: string[];
  action_items: ActionItem[];
  email_drafts: EmailDraft[];
}

const PROGRESS_STEPS = [
  { label: "Parsing transcript & tokenizing content...", icon: "📝" },
  { label: "Extracting intelligence with LLaMA 3.3 70B...", icon: "🧠" },
  { label: "Detecting action items and deadlines...", icon: "📋" },
  { label: "Generating personalized follow-up emails...", icon: "✉️" },
  { label: "Saving to workspace database...", icon: "💾" },
];

export default function AnalyzeMeeting() {
  const [inputType, setInputType] = useState<"text" | "audio">("text");
  const [transcript, setTranscript] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MeetingResult | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "decisions" | "actions" | "issues" | "emails">("summary");

  const [emailInputs, setEmailInputs] = useState<{ [key: number]: string }>({});
  const [sendingEmails, setSendingEmails] = useState<{ [key: number]: boolean }>({});
  const [emailSuccess, setEmailSuccess] = useState<{ [key: number]: string }>({});
  const [emailError, setEmailError] = useState<{ [key: number]: string }>({});
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleFileChange = (file: File) => {
    setAudioFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("audio/")) {
      setAudioFile(file);
    }
  };

  const simulateProgress = () => {
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setProgressStep(step);
      if (step >= PROGRESS_STEPS.length) clearInterval(interval);
    }, 1200);
    return () => clearInterval(interval);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    setProgressStep(0);
    const stopProgress = simulateProgress();

    try {
      let data: MeetingResult;

      if (inputType === "text") {
        if (!transcript.trim()) throw new Error("Please enter a meeting transcript.");
        data = await api.post<MeetingResult>("/meetings/analyze", { transcript });
      } else {
        if (!audioFile) throw new Error("Please upload an audio file.");
        const formData = new FormData();
        formData.append("audio", audioFile);
        data = await api.post<MeetingResult>("/meetings/analyze-audio", formData);
      }

      setResult(data);
      const initialEmails: { [key: number]: string } = {};
      data.email_drafts.forEach((_, idx) => { initialEmails[idx] = ""; });
      setEmailInputs(initialEmails);
    } catch (err: any) {
      setError(err.message || "Analysis pipeline failed. Please try again.");
    } finally {
      stopProgress();
      setLoading(false);
      setProgressStep(0);
    }
  };

  const handleSendEmail = async (idx: number, draft: EmailDraft) => {
    const recipient = emailInputs[idx]?.trim();
    if (!recipient) {
      setEmailError((prev) => ({ ...prev, [idx]: "Recipient email address cannot be empty" }));
      return;
    }
    setSendingEmails((prev) => ({ ...prev, [idx]: true }));
    setEmailError((prev) => ({ ...prev, [idx]: "" }));
    setEmailSuccess((prev) => ({ ...prev, [idx]: "" }));
    try {
      await api.post("/emails/send", {
        recipient,
        subject: draft.subject,
        body: draft.body,
        meeting_id: result?.id,
      });
      setEmailSuccess((prev) => ({ ...prev, [idx]: `Email dispatched to ${recipient}` }));
      setEmailInputs((prev) => ({ ...prev, [idx]: "" }));
    } catch (err: any) {
      setEmailError((prev) => ({ ...prev, [idx]: err.message || "Failed to send email" }));
    } finally {
      setSendingEmails((prev) => ({ ...prev, [idx]: false }));
    }
  };

  const handleCopy = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="animate-fadeInUp" style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Input Panel */}
      {!result && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ padding: 9, borderRadius: 10, background: "rgba(99, 102, 241, 0.12)", color: "var(--accent-primary)" }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800 }}>Meeting Intelligence Engine</h2>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                Paste a transcript or upload audio to extract AI insights
              </p>
            </div>
          </div>

          {/* Input Type Toggle */}
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "4px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              alignSelf: "flex-start",
            }}
          >
            <button
              onClick={() => setInputType("text")}
              className={`btn btn-sm ${inputType === "text" ? "btn-primary" : ""}`}
              style={{
                background: inputType === "text" ? undefined : "transparent",
                border: "none",
                boxShadow: inputType === "text" ? undefined : "none",
                gap: 7,
              }}
            >
              <FileEdit size={15} />
              <span>Paste Transcript</span>
            </button>
            <button
              onClick={() => setInputType("audio")}
              className={`btn btn-sm ${inputType === "audio" ? "btn-primary" : ""}`}
              style={{
                background: inputType === "audio" ? undefined : "transparent",
                border: "none",
                boxShadow: inputType === "audio" ? undefined : "none",
                gap: 7,
              }}
            >
              <UploadCloud size={15} />
              <span>Upload Audio</span>
            </button>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleAnalyze} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {inputType === "text" ? (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Meeting Transcript</label>
                <textarea
                  className="input textarea"
                  placeholder={`Sarah: Alright team, let's kick off. We need James to scale the backend infrastructure before July 10th. Alice will handle the client presentation by next Wednesday. We also decided to migrate to PostgreSQL next sprint...`}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  disabled={loading}
                  style={{ minHeight: 180, fontSize: "0.9rem", lineHeight: 1.7 }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {transcript.length > 0 ? `${transcript.length} characters` : "Tip: Include speaker names for better attribution"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Audio File (MP3, WAV, M4A, WEBM — max 25MB)</label>
                <div
                  style={{
                    border: `2px dashed ${isDragging ? "var(--accent-primary)" : audioFile ? "var(--accent-green)" : "var(--border)"}`,
                    borderRadius: "var(--radius-lg)",
                    padding: "48px 24px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    background: isDragging
                      ? "rgba(99, 102, 241, 0.05)"
                      : audioFile
                      ? "rgba(16, 185, 129, 0.04)"
                      : "rgba(255,255,255,0.02)",
                    cursor: "pointer",
                    transition: "var(--transition)",
                  }}
                  onClick={() => document.getElementById("audio-file-input")?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  {audioFile ? (
                    <>
                      <div style={{ padding: 12, borderRadius: 12, background: "rgba(16, 185, 129, 0.12)", color: "var(--accent-green)" }}>
                        <CheckCircle size={28} />
                      </div>
                      <span style={{ fontWeight: 700, color: "var(--accent-green)" }}>{audioFile.name}</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {(audioFile.size / 1024 / 1024).toFixed(2)} MB — Ready to analyze
                      </span>
                    </>
                  ) : (
                    <>
                      <div style={{ padding: 12, borderRadius: 12, background: "rgba(99, 102, 241, 0.08)", color: "var(--accent-primary)" }}>
                        <UploadCloud size={28} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                        Drop audio file here or click to browse
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Processed by Groq Whisper — highly accurate transcription
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    id="audio-file-input"
                    accept="audio/*"
                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                    disabled={loading}
                    style={{ display: "none" }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <button
                type="submit"
                id="analyze-btn"
                className="btn btn-primary btn-lg"
                style={{ minWidth: 200, gap: 10 }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: 18, height: 18 }} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Zap size={17} />
                    <span>Analyze Meeting</span>
                  </>
                )}
              </button>
              {(transcript || audioFile) && !loading && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setTranscript(""); setAudioFile(null); setError(""); }}
                >
                  <RotateCcw size={14} /> Clear
                </button>
              )}
            </div>
          </form>

          {/* Progress Indicator */}
          {loading && (
            <div
              className="animate-fadeIn"
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {PROGRESS_STEPS.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    background: progressStep > idx
                      ? "rgba(16, 185, 129, 0.06)"
                      : progressStep === idx
                      ? "rgba(99, 102, 241, 0.08)"
                      : "rgba(255,255,255,0.02)",
                    border: `1px solid ${progressStep > idx ? "rgba(16,185,129,0.2)" : progressStep === idx ? "rgba(99,102,241,0.2)" : "transparent"}`,
                    transition: "all 0.3s ease",
                    opacity: progressStep >= idx ? 1 : 0.35,
                  }}
                >
                  <span style={{ fontSize: "1rem", flexShrink: 0 }}>{step.icon}</span>
                  {progressStep > idx ? (
                    <CheckCircle size={16} color="var(--accent-green)" style={{ flexShrink: 0 }} />
                  ) : progressStep === idx ? (
                    <span className="spinner" style={{ width: 16, height: 16, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 16, height: 16, flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: "0.85rem", fontWeight: progressStep === idx ? 600 : 400, color: progressStep >= idx ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="animate-fadeInUp">

          {/* Result Header */}
          <div
            className="card"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, transparent 100%)",
              borderColor: "rgba(16, 185, 129, 0.2)",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <CheckCircle size={18} color="var(--accent-green)" />
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent-green)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Analysis Complete
                </span>
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.01em" }}>{result.title}</h2>
              <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                <span className="chip">{result.action_items.length} Action Items</span>
                <span className="chip">{result.decisions.length} Decisions</span>
                <span className="chip">{result.email_drafts.length} Email Drafts</span>
              </div>
            </div>
            <button
              onClick={() => { setResult(null); setTranscript(""); setAudioFile(null); }}
              className="btn btn-secondary"
              style={{ gap: 8 }}
            >
              <RotateCcw size={16} />
              <span>New Analysis</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {[
              { id: "summary", icon: FileText, label: "Summary" },
              { id: "decisions", icon: CheckCircle, label: `Decisions (${result.decisions.length})` },
              { id: "actions", icon: ListTodo, label: `Action Items (${result.action_items.length})` },
              { id: "issues", icon: ShieldAlert, label: "Issues & Risks" },
              { id: "emails", icon: Mail, label: `Draft Emails (${result.email_drafts.length})` },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`tab ${activeTab === tab.id ? "active" : ""}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="card animate-fadeIn">

            {/* Summary */}
            {activeTab === "summary" && (
              <div>
                <h3 style={{ fontWeight: 800, marginBottom: 16, fontSize: "1.05rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <FileText size={18} color="var(--accent-primary)" /> Meeting Summary
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
                    whiteSpace: "pre-line",
                  }}
                >
                  {result.summary}
                </div>
              </div>
            )}

            {/* Decisions */}
            {activeTab === "decisions" && (
              <div>
                <h3 style={{ fontWeight: 800, marginBottom: 16, fontSize: "1.05rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={18} color="var(--accent-green)" /> Decisions Made
                </h3>
                {result.decisions.length === 0 ? (
                  <div className="empty-state" style={{ padding: "32px 0" }}>
                    <span className="empty-state-icon">🤔</span>
                    <div className="empty-state-title">No decisions extracted</div>
                    <p className="empty-state-text">No specific decisions were recorded in this meeting transcript.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {result.decisions.map((decision, idx) => (
                      <div
                        key={idx}
                        className="animate-fadeIn"
                        style={{
                          padding: "14px 18px",
                          borderRadius: "var(--radius-md)",
                          background: "linear-gradient(90deg, rgba(16, 185, 129, 0.07) 0%, transparent 100%)",
                          borderLeft: "3px solid var(--accent-green)",
                          fontSize: "0.9rem",
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                          animationDelay: `${idx * 0.05}s`,
                          animationFillMode: "both",
                        }}
                      >
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-green)", minWidth: 20, marginTop: 1 }}>
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span>{decision}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Items */}
            {activeTab === "actions" && (
              <div>
                <h3 style={{ fontWeight: 800, marginBottom: 16, fontSize: "1.05rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <ListTodo size={18} color="var(--accent-amber)" /> Action Items
                </h3>
                {result.action_items.length === 0 ? (
                  <div className="empty-state" style={{ padding: "32px 0" }}>
                    <span className="empty-state-icon">📋</span>
                    <div className="empty-state-title">No action items detected</div>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border)" }}>
                          <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.06em" }}>Owner</th>
                          <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.06em" }}>Task</th>
                          <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.06em" }}>Deadline</th>
                          <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.action_items.map((item) => (
                          <tr key={item.id} className="table-row-hover" style={{ borderBottom: "1px solid var(--border)" }}>
                            <td style={{ padding: "14px 16px", fontWeight: 700, fontSize: "0.88rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                                  {item.owner_name.charAt(0).toUpperCase()}
                                </div>
                                {item.owner_name}
                              </div>
                            </td>
                            <td style={{ padding: "14px 16px", color: "var(--text-secondary)", fontSize: "0.875rem" }}>{item.task}</td>
                            <td style={{ padding: "14px 16px", color: "var(--text-secondary)", fontSize: "0.875rem" }}>{item.deadline}</td>
                            <td style={{ padding: "14px 16px" }}>
                              <span className="badge badge-pending">Pending</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Issues & Risks */}
            {activeTab === "issues" && (
              <div className="grid-2">
                <div>
                  <h3 style={{ fontWeight: 800, marginBottom: 16, fontSize: "1.05rem", display: "flex", alignItems: "center", gap: 8 }}>
                    <ShieldAlert size={18} color="var(--text-muted)" /> Unresolved Issues
                  </h3>
                  {result.unresolved_issues.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>✅ No unresolved issues recorded.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {result.unresolved_issues.map((issue, idx) => (
                        <div key={idx} style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.025)", borderLeft: "3px solid var(--text-muted)", fontSize: "0.875rem" }}>
                          {issue}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3 style={{ fontWeight: 800, marginBottom: 16, fontSize: "1.05rem", display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertCircle size={18} color="var(--accent-red)" /> Risks & Warnings
                  </h3>
                  {result.risks.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>✅ No risks flagged in this meeting.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {result.risks.map((risk, idx) => (
                        <div key={idx} style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "linear-gradient(90deg, rgba(239, 68, 68, 0.07) 0%, transparent 100%)", borderLeft: "3px solid var(--accent-red)", fontSize: "0.875rem" }}>
                          {risk}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Email Drafts */}
            {activeTab === "emails" && (
              <div>
                <h3 style={{ fontWeight: 800, marginBottom: 20, fontSize: "1.05rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <Mail size={18} color="var(--accent-blue)" /> Draft Follow-up Emails
                </h3>
                {result.email_drafts.length === 0 ? (
                  <div className="empty-state" style={{ padding: "32px 0" }}>
                    <span className="empty-state-icon">📭</span>
                    <div className="empty-state-title">No drafts generated</div>
                    <p className="empty-state-text">Emails are generated when action items have assigned owners.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {result.email_drafts.map((draft, idx) => (
                      <div
                        key={idx}
                        className="card"
                        style={{
                          background: "rgba(255,255,255,0.015)",
                          borderColor: "rgba(99, 102, 241, 0.12)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 16,
                        }}
                      >
                        {/* Email meta */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                          <div>
                            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                              Subject
                            </div>
                            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{draft.subject}</div>
                          </div>
                          <button
                            onClick={() => handleCopy(idx, `Subject: ${draft.subject}\n\n${draft.body}`)}
                            className="btn btn-secondary btn-sm"
                            style={{ gap: 6, flexShrink: 0 }}
                          >
                            {copiedIdx === idx ? <Check size={13} color="var(--accent-green)" /> : <Copy size={13} />}
                            <span>{copiedIdx === idx ? "Copied!" : "Copy"}</span>
                          </button>
                        </div>

                        {/* Email body */}
                        <div
                          style={{
                            padding: "16px 18px",
                            background: "rgba(0,0,0,0.25)",
                            borderRadius: "var(--radius-md)",
                            fontFamily: "'Fira Code', 'Courier New', monospace",
                            fontSize: "0.82rem",
                            color: "var(--text-secondary)",
                            whiteSpace: "pre-wrap",
                            border: "1px solid var(--border)",
                            lineHeight: 1.7,
                            maxHeight: 260,
                            overflowY: "auto",
                          }}
                        >
                          {draft.body}
                        </div>

                        {/* Send section */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ display: "flex", gap: 10 }}>
                            <input
                              type="email"
                              className="input"
                              placeholder="Recipient email address (e.g. james@company.com)"
                              value={emailInputs[idx] || ""}
                              onChange={(e) => setEmailInputs((prev) => ({ ...prev, [idx]: e.target.value }))}
                              disabled={sendingEmails[idx]}
                            />
                            <button
                              onClick={() => handleSendEmail(idx, draft)}
                              className="btn btn-primary"
                              disabled={sendingEmails[idx]}
                              style={{ minWidth: 130, gap: 8, flexShrink: 0 }}
                            >
                              {sendingEmails[idx] ? (
                                <span className="spinner" style={{ width: 16, height: 16 }} />
                              ) : (
                                <>
                                  <Send size={14} />
                                  <span>Send</span>
                                </>
                              )}
                            </button>
                          </div>
                          {emailSuccess[idx] && (
                            <div className="alert alert-success animate-fadeIn" style={{ margin: 0, padding: "8px 14px" }}>
                              <CheckCircle size={15} /> {emailSuccess[idx]}
                            </div>
                          )}
                          {emailError[idx] && (
                            <div className="alert alert-error animate-fadeIn" style={{ margin: 0, padding: "8px 14px" }}>
                              <AlertCircle size={15} /> {emailError[idx]}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
