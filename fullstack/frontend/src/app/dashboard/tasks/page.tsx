"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Search,
  Calendar,
  User,
  Check,
  Filter,
  RefreshCw,
  Target,
} from "lucide-react";

interface ActionItem {
  id: number;
  owner_name: string;
  task: string;
  deadline: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  meeting_id: number;
  is_overdue: boolean;
}

export default function ActionItemsTracker() {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "overdue" | "completed">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchItems = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const data = await api.get<ActionItem[]>("/action-items?status_filter=All");
      setItems(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch action items");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleMarkComplete = async (id: number) => {
    setCompletingId(id);
    try {
      await api.patch(`/action-items/${id}/complete`);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: "Completed", is_overdue: false, completed_at: new Date().toISOString() }
            : item
        )
      );
    } catch (err: any) {
      setError(err.message || "Failed to mark task complete");
    } finally {
      setCompletingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this action item?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/action-items/${id}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete item");
    } finally {
      setDeletingId(null);
    }
  };

  const overdueTasks = items.filter((item) => item.status === "Pending" && item.is_overdue);
  const pendingOnTrack = items.filter((item) => item.status === "Pending" && !item.is_overdue);
  const completedTasks = items.filter((item) => item.status === "Completed");

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.task.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === "pending") return item.status === "Pending" && !item.is_overdue;
    if (activeFilter === "overdue") return item.status === "Pending" && item.is_overdue;
    if (activeFilter === "completed") return item.status === "Completed";
    return true;
  });

  const completionPct = items.length > 0 ? Math.round((completedTasks.length / items.length) * 100) : 0;

  return (
    <div className="animate-fadeInUp" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Metrics Row */}
      <section className="grid-3">
        {[
          {
            label: "Critical / Overdue",
            count: overdueTasks.length,
            icon: AlertCircle,
            color: "var(--accent-red)",
            bg: "rgba(239, 68, 68, 0.1)",
            borderColor: "rgba(239, 68, 68, 0.2)",
            filter: "overdue" as const,
          },
          {
            label: "Pending On-Track",
            count: pendingOnTrack.length,
            icon: Clock,
            color: "var(--accent-amber)",
            bg: "rgba(245, 158, 11, 0.1)",
            borderColor: "rgba(245, 158, 11, 0.2)",
            filter: "pending" as const,
          },
          {
            label: "Tasks Completed",
            count: completedTasks.length,
            icon: CheckCircle2,
            color: "var(--accent-green)",
            bg: "rgba(16, 185, 129, 0.1)",
            borderColor: "rgba(16, 185, 129, 0.2)",
            filter: "completed" as const,
          },
        ].map((card) => {
          const Icon = card.icon;
          const isActive = activeFilter === card.filter;
          return (
            <div
              key={card.label}
              onClick={() => setActiveFilter(isActive ? "all" : card.filter)}
              className="card"
              style={{
                cursor: "pointer",
                borderColor: isActive ? card.borderColor : "var(--border)",
                background: isActive ? card.bg.replace("0.1)", "0.08)") : "var(--bg-card)",
                transition: "var(--transition)",
                transform: isActive ? "translateY(-2px)" : "none",
                boxShadow: isActive ? `0 4px 20px ${card.bg}` : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span className="label" style={{ margin: 0 }}>{card.label}</span>
                <div style={{ padding: 9, borderRadius: 10, background: card.bg, color: card.color }}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="stat-number" style={{ color: card.color }}>{card.count}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 6 }}>
                {isActive ? "Click to clear filter" : "Click to filter"}
              </div>
            </div>
          );
        })}
      </section>

      {/* Progress Bar Row */}
      <div
        className="card"
        style={{
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Target size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>Overall Completion</span>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ position: "relative", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
            <div
              style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                width: `${completionPct}%`,
                background: completionPct > 70 ? "var(--gradient-green)" : completionPct > 40 ? "var(--gradient-amber)" : "var(--gradient-red)",
                borderRadius: 999,
                transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </div>
        </div>
        <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--accent-primary)", minWidth: 40 }}>
          {completionPct}%
        </span>
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
          {completedTasks.length} of {items.length} tasks done
        </span>
      </div>

      {/* Filter + Search Bar */}
      <div
        className="card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          padding: "14px 20px",
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <Filter size={14} color="var(--text-muted)" />
          {[
            { label: `All (${items.length})`, value: "all" as const },
            { label: `Overdue (${overdueTasks.length})`, value: "overdue" as const },
            { label: `Pending (${pendingOnTrack.length})`, value: "pending" as const },
            { label: `Done (${completedTasks.length})`, value: "completed" as const },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`btn btn-sm ${
                activeFilter === f.value
                  ? f.value === "overdue"
                    ? "btn-danger"
                    : f.value === "completed"
                    ? "btn-success"
                    : "btn-primary"
                  : "btn-secondary"
              }`}
              style={{
                background: activeFilter === f.value && f.value === "pending"
                  ? "var(--gradient-amber)"
                  : undefined,
                color: activeFilter === f.value && f.value === "pending" ? "#000" : undefined,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative", minWidth: 240 }}>
            <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              className="input"
              placeholder="Filter tasks or owners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 34, height: 36, fontSize: "0.82rem" }}
            />
          </div>
          <button
            onClick={() => fetchItems(true)}
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

      {/* Task Grid */}
      {loading ? (
        <div className="grid-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="card skeleton" style={{ height: 160 }} />)}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card empty-state">
          <span className="empty-state-icon">📋</span>
          <div className="empty-state-title">No items found</div>
          <p className="empty-state-text">
            {items.length === 0
              ? "Analyze a meeting to generate action items."
              : "No action items match the current filter."}
          </p>
        </div>
      ) : (
        <div className="grid-2" style={{ alignItems: "stretch" }}>
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              className="card animate-fadeIn"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 14,
                background: item.is_overdue && item.status === "Pending"
                  ? "rgba(239, 68, 68, 0.03)"
                  : item.status === "Completed"
                  ? "rgba(16, 185, 129, 0.03)"
                  : "rgba(255,255,255,0.015)",
                borderColor: item.is_overdue && item.status === "Pending"
                  ? "rgba(239, 68, 68, 0.2)"
                  : item.status === "Completed"
                  ? "rgba(16, 185, 129, 0.15)"
                  : "var(--border)",
                transition: "var(--transition)",
                animationDelay: `${idx * 0.04}s`,
                animationFillMode: "both",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {/* Owner + Status row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: item.status === "Completed" ? "var(--gradient-green)" : item.is_overdue ? "var(--gradient-red)" : "var(--gradient-primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.78rem", fontWeight: 800, color: "#fff", flexShrink: 0,
                  }}>
                    {item.owner_name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>{item.owner_name}</span>
                </div>
                {item.status === "Completed" ? (
                  <span className="badge badge-complete">✓ Done</span>
                ) : item.is_overdue ? (
                  <span className="badge badge-overdue">🔴 Overdue</span>
                ) : (
                  <span className="badge badge-pending">⏳ Pending</span>
                )}
              </div>

              {/* Task description */}
              <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.6, fontWeight: 500 }}>
                {item.task}
              </p>

              {/* Footer row */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid var(--border)",
                paddingTop: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: item.is_overdue && item.status === "Pending" ? "var(--accent-red)" : "var(--text-secondary)", fontSize: "0.78rem" }}>
                  <Calendar size={13} />
                  <span>Due: {item.deadline}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {item.status === "Pending" && (
                    <button
                      onClick={() => handleMarkComplete(item.id)}
                      className="btn btn-sm btn-success"
                      disabled={completingId === item.id}
                      style={{ gap: 5 }}
                    >
                      {completingId === item.id ? (
                        <span className="spinner" style={{ width: 13, height: 13 }} />
                      ) : (
                        <Check size={13} />
                      )}
                      <span>Complete</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="btn btn-sm"
                    disabled={deletingId === item.id}
                    style={{
                      padding: "6px 8px",
                      background: "rgba(239, 68, 68, 0.06)",
                      borderColor: "rgba(239, 68, 68, 0.15)",
                      color: "var(--accent-red)",
                    }}
                  >
                    {deletingId === item.id ? (
                      <span className="spinner" style={{ width: 13, height: 13, borderTopColor: "var(--accent-red)" }} />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
