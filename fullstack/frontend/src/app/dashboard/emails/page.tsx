"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  Mail, 
  Check, 
  AlertCircle, 
  Search, 
  Eye, 
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  Send,
  RefreshCw
} from "lucide-react";

interface EmailLog {
  id: number;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  error_message: string | null;
  sent_at: string;
  meeting_id: number | null;
}

export default function EmailHistory() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const data = await api.get<EmailLog[]>("/emails/history");
      setLogs(data);
    } catch (err: any) {
      setError(err.message || "Failed to load email history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const filteredLogs = logs.filter(log => 
    log.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const successfulDispatches = logs.filter(l => l.status === "Sent").length;
  const failedDispatches = logs.filter(l => l.status === "Failed").length;

  return (
    <div className="animate-fadeInUp" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Overview Stats for Emails */}
      <section className="grid-2">
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ padding: 12, borderRadius: 12, background: "rgba(16, 185, 129, 0.1)", color: "var(--accent-green)" }}>
            <Check size={22} />
          </div>
          <div>
            <div className="label" style={{ margin: 0 }}>Successful Dispatches</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: 4 }}>
              {successfulDispatches}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: 16, borderColor: failedDispatches > 0 ? "rgba(239, 68, 68, 0.2)" : undefined }}>
          <div style={{ padding: 12, borderRadius: 12, background: failedDispatches > 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(255,255,255,0.05)", color: failedDispatches > 0 ? "var(--accent-red)" : "var(--text-muted)" }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div className="label" style={{ margin: 0 }}>Failed Transmissions</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: 4, color: failedDispatches > 0 ? "var(--accent-red)" : "inherit" }}>
              {failedDispatches}
            </div>
          </div>
        </div>
      </section>

      {/* Control Card & Search */}
      <div className="card" style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        padding: "14px 20px"
      }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <Mail size={17} color="var(--accent-primary)" />
          <span>Dispatched Logs Repository</span>
        </h3>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative", minWidth: "280px" }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              className="input"
              placeholder="Search by recipient or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 36, height: 36, fontSize: "0.82rem" }}
            />
          </div>
          <button
            onClick={() => fetchLogs(true)}
            className="btn btn-secondary btn-sm"
            disabled={refreshing}
            style={{ padding: 8 }}
            title="Refresh"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <div>{error}</div>
        </div>
      )}

      {/* Email History Logs Card */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, display: "flex", justifyContent: "center" }}>
            <span className="spinner" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📧</span>
            <div className="empty-state-title">No sent email logs found</div>
            <p className="empty-state-text">SMTP follow-ups you dispatch from meetings will appear here.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", background: "rgba(255,255,255,0.01)" }}>
                  <th style={{ padding: "12px 20px", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Recipient</th>
                  <th style={{ padding: "12px 20px", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Subject</th>
                  <th style={{ padding: "12px 20px", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Date</th>
                  <th style={{ padding: "12px 20px", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</th>
                  <th style={{ padding: "12px 20px", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      animationDelay: `${idx * 0.04}s`,
                      animationFillMode: "both",
                    }}
                    className="table-row-hover animate-fadeIn"
                  >
                    <td style={{ padding: "14px 20px", fontWeight: 700, fontSize: "0.88rem" }}>{log.recipient}</td>
                    <td style={{ padding: "14px 20px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>{log.subject}</td>
                    <td style={{ padding: "14px 20px", color: "var(--text-secondary)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem" }}>
                        <Clock size={12} color="var(--accent-primary)" />
                        {new Date(log.sent_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      {log.status === "Sent" ? (
                        <span className="badge badge-sent">✓ Sent</span>
                      ) : (
                        <span className="badge badge-failed" title={log.error_message || "Unknown error"}>
                          ⚠️ Failed
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                      >
                        <Eye size={12} />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Email Body Modal Overlay */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal animate-scaleIn" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header" style={{ marginBottom: 20 }}>
              <h3 className="modal-title" style={{ fontWeight: 800 }}>Dispatched Email Details</h3>
              <button className="modal-close" onClick={() => setSelectedLog(null)}>
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <span className="label">Recipient</span>
                <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem" }}>{selectedLog.recipient}</div>
              </div>

              <div>
                <span className="label">Subject</span>
                <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem" }}>{selectedLog.subject}</div>
              </div>

              <div className="grid-2">
                <div>
                  <span className="label">Date & Time</span>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{new Date(selectedLog.sent_at).toLocaleString()}</div>
                </div>

                <div>
                  <span className="label">Delivery Status</span>
                  <div style={{ marginTop: 2 }}>
                    {selectedLog.status === "Sent" ? (
                      <span className="badge badge-sent">Sent Successfully</span>
                    ) : (
                      <span className="badge badge-failed">Delivery Failed</span>
                    )}
                  </div>
                </div>
              </div>

              {selectedLog.error_message && (
                <div>
                  <span className="label" style={{ color: "var(--accent-red)" }}>Error Message</span>
                  <div style={{
                    padding: 12,
                    background: "rgba(239, 68, 68, 0.06)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.8rem",
                    color: "#fca5a5"
                  }}>
                    {selectedLog.error_message}
                  </div>
                </div>
              )}

              <div className="divider" style={{ margin: "4px 0" }} />

              <div>
                <span className="label">Email Body</span>
                <div
                  style={{
                    padding: 16,
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: "var(--radius-md)",
                    fontFamily: "'Fira Code', 'Courier New', monospace",
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                    whiteSpace: "pre-wrap",
                    border: "1px solid var(--border)",
                    maxHeight: "220px",
                    overflowY: "auto",
                    lineHeight: 1.6
                  }}
                >
                  {selectedLog.body}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
