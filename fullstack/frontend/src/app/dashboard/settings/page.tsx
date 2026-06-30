"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { getUser, setSession, getToken } from "@/lib/auth";
import { User, Shield, Info, Sparkles, Save, Key } from "lucide-react";

interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
}

export default function SettingsAndProfile() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Loading/feedback states
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const user = getUser();
    if (user) {
      setFullName(user.full_name);
      setEmail(user.email);
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess("");
    setProfileError("");

    try {
      const updatedUser = await api.post<UserProfile>("/auth/profile", {
        full_name: fullName,
        email,
      }, { method: "PUT" });

      // Update stored session metadata while keeping current token
      const token = getToken();
      if (token) {
        setSession(token, updatedUser);
      }

      setProfileSuccess("Profile details updated successfully!");
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile details");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match");
      return;
    }

    setPasswordLoading(true);
    setPasswordSuccess("");
    setPasswordError("");

    try {
      await api.post("/auth/password", {
        current_password: currentPassword,
        new_password: newPassword,
      }, { method: "PUT" });

      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="animate-fadeInUp" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="grid-2">
        {/* Profile Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ padding: 8, borderRadius: 10, background: "rgba(99, 102, 241, 0.12)", color: "var(--accent-primary)" }}>
              <User size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800 }}>Personal Profile Info</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 2 }}>
                Modify your user details and login coordinates
              </p>
            </div>
          </div>

          {profileSuccess && (
            <div className="alert alert-success animate-fadeIn" style={{ padding: "10px 14px", margin: 0 }}>
              {profileSuccess}
            </div>
          )}

          {profileError && (
            <div className="alert alert-error animate-fadeIn" style={{ padding: "10px 14px", margin: 0 }}>
              {profileError}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={profileLoading}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={profileLoading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ alignSelf: "flex-start", marginTop: 8, gap: 8 }}
              disabled={profileLoading}
            >
              {profileLoading ? (
                <span className="spinner" style={{ width: 15, height: 15 }} />
              ) : (
                <Save size={15} />
              )}
              <span>Save Changes</span>
            </button>
          </form>
        </div>

        {/* Password Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ padding: 8, borderRadius: 10, background: "rgba(139, 92, 246, 0.12)", color: "var(--accent-secondary)" }}>
              <Shield size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800 }}>Update Security Password</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 2 }}>
                Change your account credential security password
              </p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="alert alert-success animate-fadeIn" style={{ padding: "10px 14px", margin: 0 }}>
              {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div className="alert alert-error animate-fadeIn" style={{ padding: "10px 14px", margin: 0 }}>
              {passwordError}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Current Password</label>
              <input
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={passwordLoading}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">New Password</label>
              <input
                type="password"
                className="input"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                disabled={passwordLoading}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={passwordLoading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ alignSelf: "flex-start", marginTop: 8, gap: 8 }}
              disabled={passwordLoading}
            >
              {passwordLoading ? (
                <span className="spinner" style={{ width: 15, height: 15 }} />
              ) : (
                <Key size={15} />
              )}
              <span>Change Password</span>
            </button>
          </form>
        </div>
      </div>

      {/* Developer Project Attributions Card */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)",
          borderColor: "rgba(99,102,241,0.18)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Info size={17} color="var(--accent-primary)" />
          <h3 style={{ fontSize: "1.05rem", fontWeight: 800 }}>Project Information</h3>
        </div>
        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.75 }}>
          This full-stack application was completely custom-built as a **Minor Specialization Project**.
          The backend leverages **FastAPI** to compile RESTful APIs, manage SQLite databases, run bcrypt encryption, and coordinate LLaMA speech-to-text / text extraction pipelines.
          The frontend UI is built with **Next.js 14** featuring premium custom design tokens (no heavy boilerplate templates) to ensure lightweight bundles, fast loading speeds, and visual brilliance for code reviews and recruitment placement rounds.
        </p>
      </div>
    </div>
  );
}
