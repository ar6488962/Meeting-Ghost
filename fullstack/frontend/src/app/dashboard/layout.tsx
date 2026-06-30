"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getUser, clearSession, User } from "@/lib/auth";
import { 
  LayoutDashboard, 
  PlusCircle, 
  CheckSquare, 
  Mail, 
  Settings, 
  LogOut, 
  Ghost,
  Calendar,
  Zap
} from "lucide-react";
import styles from "./dashboard.module.css";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatCurrentDateTime(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.replace("/login");
    } else {
      setUser(currentUser);
      setLoaded(true);
    }
    setCurrentDate(formatCurrentDateTime());
  }, [router]);

  const handleLogout = () => {
    clearSession();
    router.replace("/login");
  };

  if (!loaded || !user) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div className="spinner" style={{ width: 32, height: 32, borderTopColor: "var(--accent-primary)" }} />
          <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading workspace...</span>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: "Overview", path: "/dashboard", icon: LayoutDashboard, exact: true },
    { label: "Analyze Meeting", path: "/dashboard/analyze", icon: PlusCircle, exact: false },
    { label: "Action Items", path: "/dashboard/tasks", icon: CheckSquare, exact: false },
    { label: "Email History", path: "/dashboard/emails", icon: Mail, exact: false },
    { label: "Settings", path: "/dashboard/settings", icon: Settings, exact: false },
  ];

  const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard Overview",
    "/dashboard/analyze": "Analyze New Meeting",
    "/dashboard/tasks": "Action Items Tracker",
    "/dashboard/emails": "Email Follow-up History",
    "/dashboard/settings": "Account Settings",
  };

  const currentTitle =
    Object.entries(pageTitles).find(([path]) => {
      if (path === "/dashboard") return pathname === "/dashboard";
      return pathname.startsWith(path);
    })?.[1] || "MeetingGhost";

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        {/* Logo */}
        <div className={styles.logoContainer}>
          <div className={styles.logoIconWrap}>
            <Ghost size={20} color="#fff" />
          </div>
          <div>
            <div className={styles.brandName}>MeetingGhost</div>
            <div className={styles.brandSub}>AI Intelligence</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          <div className={styles.navSection}>Workspace</div>

          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.path
              : item.path !== "/dashboard" && pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
              >
                <Icon size={17} className={styles.navIcon} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Powered-by badge at bottom of nav */}
          <div style={{ marginTop: "auto", paddingTop: 24 }}>
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                background: "rgba(99, 102, 241, 0.06)",
                border: "1px solid rgba(99, 102, 241, 0.15)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Zap size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--accent-primary)" }}>
                  Powered by Groq
                </div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 1 }}>
                  LLaMA 3.3 70B + Whisper
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className={styles.userFooter}>
          <div className={styles.userAvatar} style={{ padding: 0, overflow: 'hidden', background: 'none' }}>
            <img 
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user.full_name)}&backgroundColor=6366f1,e2e8f0`} 
              alt={user.full_name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user.full_name}</div>
            <div className={styles.userEmail}>{user.email}</div>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn} title="Log Out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitle}>{currentTitle}</div>
            <div className={styles.headerBreadcrumb}>
              <Ghost size={10} />
              <span>MeetingGhost</span>
              {currentTitle !== "Dashboard Overview" && (
                <>
                  <span style={{ opacity: 0.4 }}>›</span>
                  <span>{currentTitle}</span>
                </>
              )}
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.headerDate}>
              <Calendar size={13} color="var(--accent-primary)" />
              <span>{currentDate}</span>
            </div>
            <div className={styles.userAvatar} style={{ width: 34, height: 34, borderRadius: 10, padding: 0, overflow: 'hidden', background: 'none' }}>
              <img 
                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user.full_name)}&backgroundColor=6366f1,e2e8f0`} 
                alt={user.full_name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
