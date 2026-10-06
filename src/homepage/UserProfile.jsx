import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { apiUrl } from "../components/apiClient";
const API_BASE = apiUrl("");

const NAV = [
  { label: "Home",          icon: "🏠", path: "/home" },
  { label: "View Plans",    icon: "📋", path: "/view-plans" },
  { label: "Add Plan",      icon: "➕", path: "/add-plan" },
  { label: "Sent Requests", icon: "📤", path: "/sent-requests" },
  { label: "View Replies",  icon: "💬", path: "/view-replies" },
  { label: "My Profile",   icon: "👤", path: "/user-profile" },
];

export default function UserProfile() {
  const [profile,    setProfile]    = useState(null);
  const [stats,      setStats]      = useState({ total: 0, accepted: 0, pending: 0, declined: 0 });
  const [loading,    setLoading]    = useState(true);
  const [uploading,  setUploading]  = useState(false);
  const [preview,    setPreview]    = useState(null);
  const [editing,    setEditing]    = useState(false);
  const [editForm,   setEditForm]   = useState({ username: "", email: "", phone: "" });
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  // ── helpers (defined first so all async fns below can call them) ──
  const showToast = (msg, type) => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  const signOut = () => { localStorage.clear(); navigate("/signup-as"); };

  // ── data fetching ──
  const fetchProfile = async (token) => {
    try {
      const res  = await fetch(`${API_BASE}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        setProfile(json);
        setEditForm({ username: json.username || "", email: json.email || "", phone: json.phone || "" });
      }
      else showToast(json.error || "Failed to load profile.", "error");
    } catch {
      showToast("Could not reach the server.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (token) => {
    try {
      const res  = await fetch(`${API_BASE}/api/user/my_requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json)) {
        setStats({
          total:    json.length,
          accepted: json.filter(r => r.status === "accepted").length,
          pending:  json.filter(r => r.status === "pending").length,
          declined: json.filter(r => r.status === "declined").length,
        });
      }
    } catch { /* stats are non-critical */ }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/signup-as"); return; }
    fetchProfile(token);
    fetchStats(token);
  }, []);

  // ── profile picture upload ──
  const updateProfilePic = async (file) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/gif", "image/webp"].includes(file.type)) {
      showToast("Invalid file type. Use PNG, JPG, GIF, or WEBP.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("File too large. Max 5MB.", "error");
      return;
    }
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    const token = localStorage.getItem("token");
    const data  = new FormData();
    data.append("profile_pic", file);
    try {
      const res  = await fetch(`${API_BASE}/api/user/update_profile_pic`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      const json = await res.json();
      if (res.ok) {
        setProfile(json.user);
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, profile_pic: json.user.profile_pic }));
        showToast("Profile picture updated!", "success");
      } else {
        setPreview(null);
        showToast(json.error || "Upload failed.", "error");
      }
    } catch {
      setPreview(null);
      showToast("Could not reach the server.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) updateProfilePic(file);
    e.target.value = "";
  };

  const saveProfile = async () => {
    if (!editForm.username.trim() || !editForm.email.trim()) {
      showToast("Username and email are required.", "error"); return;
    }
    setSaving(true);
    const token = localStorage.getItem("token");
    try {
      const res  = await fetch(`${API_BASE}/api/user/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (res.ok) {
        setProfile(json.user);
        localStorage.setItem("user", JSON.stringify({ ...JSON.parse(localStorage.getItem("user") || "{}"), ...json.user }));
        setEditing(false);
        showToast("Profile updated!", "success");
      } else {
        showToast(json.error || "Update failed.", "error");
      }
    } catch {
      showToast("Could not reach the server.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── render ──
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0a0a0a !important; }

        .up-root { display: flex; min-height: 100vh; background: #0a0a0a; font-family: 'DM Sans', sans-serif; color: #e0e0e0; }

        /* SIDEBAR */
        .up-sidebar { width: 240px; min-height: 100vh; background: #0d0d0d; border-right: 1px solid #1a1a1a; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow-y: auto; flex-shrink: 0; z-index: 100; transition: transform 0.25s ease; }
        .up-sidebar-logo { font-family: 'Bebas Neue', sans-serif; font-size: 26px; color: #c89633; letter-spacing: 3px; padding: 24px 20px 18px; border-bottom: 1px solid #1a1a1a; }
        .up-sidebar-logo span { display: block; font-size: 10px; color: #2a2a2a; letter-spacing: 2px; font-family: 'DM Sans', sans-serif; margin-top: 3px; text-transform: uppercase; }
        .up-sidebar-user { padding: 14px 20px; border-bottom: 1px solid #1a1a1a; display: flex; align-items: center; gap: 10px; }
        .up-avatar-sm { width: 36px; height: 36px; border-radius: 50%; background: #1a1a1a; border: 1px solid #c89633; display: flex; align-items: center; justify-content: center; font-family: 'Bebas Neue', sans-serif; font-size: 16px; color: #c89633; flex-shrink: 0; overflow: hidden; }
        .up-avatar-sm img { width: 100%; height: 100%; object-fit: cover; }
        .up-sidebar-name { font-size: 13px; font-weight: 500; color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .up-sidebar-role { font-size: 10px; color: #333; text-transform: uppercase; letter-spacing: 1px; }
        .up-sidebar-nav { flex: 1; padding: 16px 0; }
        .up-nav-label { font-size: 9px; color: #222; letter-spacing: 2px; text-transform: uppercase; padding: 10px 20px 6px; }
        .up-nav-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 20px; background: transparent; border: none; border-left: 3px solid transparent; color: #3a3a3a; font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; transition: all 0.15s; text-align: left; }
        .up-nav-btn:hover, .up-nav-btn.active { color: #c89633; background: #121200; border-left-color: #c89633; }
        .up-nav-icon { font-size: 16px; width: 20px; text-align: center; }
        .up-sidebar-bottom { padding: 14px 12px; border-top: 1px solid #1a1a1a; }
        .up-signout { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: transparent; border: 1px solid #1e1e1e; border-radius: 3px; color: #444; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .up-signout:hover { border-color: #e07070; color: #e07070; background: #1f0d0d; }

        /* MAIN */
        .up-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .up-topbar { background: #0d0d0d; border-bottom: 1px solid #1a1a1a; padding: 0 28px; height: 56px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; }
        .up-topbar-title { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: #e8e8e8; letter-spacing: 2px; }
        .up-mobile-btn { display: none; background: transparent; border: 1px solid #1e1e1e; color: #c89633; font-size: 18px; width: 36px; height: 36px; border-radius: 3px; cursor: pointer; align-items: center; justify-content: center; }
        .up-content { padding: 28px 28px 60px; max-width: 700px; }

        /* AVATAR */
        .up-avatar-wrap { position: relative; flex-shrink: 0; width: 100px; height: 100px; }
        .up-avatar-lg { width: 100px; height: 100px; border-radius: 50%; border: 3px solid #c89633; object-fit: cover; display: block; }
        .up-avatar-lg-placeholder { width: 100px; height: 100px; border-radius: 50%; background: #1a1a1a; border: 3px solid #c89633; display: flex; align-items: center; justify-content: center; font-family: 'Bebas Neue', sans-serif; font-size: 40px; color: #c89633; }
        .up-avatar-change { position: absolute; inset: 0; border-radius: 50%; background: #000000bb; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; opacity: 0; transition: opacity 0.2s; cursor: pointer; border: none; }
        .up-avatar-wrap:hover .up-avatar-change { opacity: 1; }
        .up-avatar-change-icon { font-size: 20px; }
        .up-avatar-change-text { font-size: 10px; color: #c89633; letter-spacing: 1px; text-transform: uppercase; font-family: 'DM Sans', sans-serif; }
        .up-avatar-uploading { position: absolute; inset: 0; border-radius: 50%; background: #000000bb; display: flex; align-items: center; justify-content: center; }
        .up-spinner { width: 28px; height: 28px; border: 3px solid #2a2a2a; border-top-color: #c89633; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .up-avatar-hint { font-size: 10px; color: #2a2a2a; margin-top: 6px; text-align: center; }

        /* HERO */
        .up-hero { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 4px; padding: 32px; display: flex; align-items: center; gap: 28px; margin-bottom: 24px; flex-wrap: wrap; }
        .up-hero-info { flex: 1; min-width: 0; }
        .up-hero-name { font-family: 'Bebas Neue', sans-serif; font-size: 36px; color: #e8e8e8; letter-spacing: 2px; line-height: 1; margin-bottom: 4px; }
        .up-hero-type { font-size: 11px; color: #c89633; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
        .up-hero-contact { font-size: 13px; color: #555; line-height: 2; }
        .up-hero-contact span { color: #333; margin-right: 8px; }

        /* STATS */
        .up-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        @media (max-width: 500px) { .up-stats { grid-template-columns: 1fr 1fr; } }
        .up-stat { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 4px; padding: 18px; text-align: center; }
        .up-stat-num { font-family: 'Bebas Neue', sans-serif; font-size: 32px; letter-spacing: 1px; }
        .up-stat-label { font-size: 10px; color: #333; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }

        /* INFO CARD */
        .up-info-card { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 4px; overflow: hidden; margin-bottom: 24px; }
        .up-info-card-header { padding: 14px 20px; border-bottom: 1px solid #1a1a1a; }
        .up-info-card-title { font-family: 'Bebas Neue', sans-serif; font-size: 16px; color: #c89633; letter-spacing: 2px; }
        .up-info-row { display: flex; align-items: center; padding: 14px 20px; border-bottom: 1px solid #111; }
        .up-info-row:last-child { border-bottom: none; }
        .up-info-icon { width: 32px; font-size: 16px; flex-shrink: 0; color: #333; }
        .up-info-label { width: 100px; font-size: 11px; color: #333; text-transform: uppercase; letter-spacing: 1px; flex-shrink: 0; }
        .up-info-value { flex: 1; font-size: 14px; color: #aaa; }

        /* ACTIONS */
        .up-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .up-action-btn { padding: 11px 20px; border-radius: 3px; border: 1px solid #1e1e1e; background: transparent; color: #555; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 8px; }
        .up-action-btn:hover { border-color: #c89633; color: #c89633; }
        .up-action-btn.danger:hover { border-color: #e07070; color: #e07070; background: #1f0d0d; }

        .up-section-title { font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: #555; letter-spacing: 2px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
        .up-section-title::after { content: ''; flex: 1; height: 1px; background: #1a1a1a; }
        .up-loading { text-align: center; color: #2a2a2a; padding: 80px; font-size: 14px; }

        /* TOAST */
        .up-toast { position: fixed; bottom: 28px; right: 28px; padding: 12px 20px; border-radius: 4px; font-size: 13px; z-index: 500; animation: slideUp 0.3s ease; }
        .up-toast.success { background: #0d1f0d; color: #4caf65; border: 1px solid #143314; }
        .up-toast.error   { background: #1f0d0d; color: #e07070; border: 1px solid #331414; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* MOBILE */
        .up-mob-overlay { display: none; position: fixed; inset: 0; background: #000a; z-index: 99; }
        @media (max-width: 768px) {
          .up-sidebar { position: fixed; top: 0; left: 0; transform: translateX(-100%); }
          .up-sidebar.open { transform: translateX(0); }
          .up-mob-overlay { display: block; }
          .up-mob-overlay.open { opacity: 1; pointer-events: auto; }
          .up-mobile-btn { display: flex; }
          .up-content { padding: 20px 16px 80px; }
          .up-hero { flex-direction: column; text-align: center; }
        }
      `}</style>

      <div className={`up-mob-overlay ${mobileOpen ? "open" : ""}`}
        style={{ opacity: mobileOpen ? 1 : 0, pointerEvents: mobileOpen ? "auto" : "none" }}
        onClick={() => setMobileOpen(false)} />

      <div className="up-root">
        {/* SIDEBAR */}
        <aside className={`up-sidebar ${mobileOpen ? "open" : ""}`}>
          <div className="up-sidebar-logo">SteelSmith<span>Client Portal</span></div>
          <div className="up-sidebar-user">
            <div className="up-avatar-sm">
              {profile?.profile_pic
                ? <img src={preview || `${API_BASE}/static/images/${profile.profile_pic}`} alt={profile?.username} />
                : (profile?.username?.[0] || "U").toUpperCase()}
            </div>
            <div>
              <div className="up-sidebar-name">{profile?.username || "User"}</div>
              <div className="up-sidebar-role">Client</div>
            </div>
          </div>
          <nav className="up-sidebar-nav">
            <div className="up-nav-label">Menu</div>
            {NAV.map(item => (
              <button key={item.path}
                className={`up-nav-btn ${item.path === "/user-profile" ? "active" : ""}`}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}>
                <span className="up-nav-icon">{item.icon}</span>{item.label}
              </button>
            ))}
          </nav>
          <div className="up-sidebar-bottom">
            <button className="up-signout" onClick={signOut}>🚪 Sign Out</button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="up-main">
          <div className="up-topbar">
            <button className="up-mobile-btn" onClick={() => setMobileOpen(true)}>☰</button>
            <div className="up-topbar-title">My Profile</div>
          </div>

          <div className="up-content">
            {loading ? (
              <div className="up-loading">Loading profile...</div>
            ) : profile ? (
              <>
                {/* HERO */}
                <div className="up-hero">
                  <div>
                    <div className="up-avatar-wrap">
                      {(preview || profile.profile_pic)
                        ? <img
                            src={preview || `${API_BASE}/static/images/${profile.profile_pic}`}
                            alt={profile.username}
                            className="up-avatar-lg"
                          />
                        : <div className="up-avatar-lg-placeholder">
                            {(profile.username?.[0] || "U").toUpperCase()}
                          </div>}

                      {uploading ? (
                        <div className="up-avatar-uploading">
                          <div className="up-spinner" />
                        </div>
                      ) : (
                        <label className="up-avatar-change" title="Change profile picture">
                          <span className="up-avatar-change-icon">📷</span>
                          <span className="up-avatar-change-text">Change</span>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleFileInput}
                          />
                        </label>
                      )}
                    </div>
                    <div className="up-avatar-hint">Hover to change</div>
                  </div>

                  <div className="up-hero-info">
                    <div className="up-hero-name">{profile.username}</div>
                    <div className="up-hero-type">Client Account</div>
                    <div className="up-hero-contact">
                      {profile.email && <div><span>✉</span>{profile.email}</div>}
                      {profile.phone && <div><span>📞</span>{profile.phone}</div>}
                    </div>
                  </div>
                </div>

                {/* STATS */}
                <div className="up-section-title">Request Summary</div>
                <div className="up-stats">
                  <div className="up-stat">
                    <div className="up-stat-num" style={{ color: "#c89633" }}>{stats.total}</div>
                    <div className="up-stat-label">Total Sent</div>
                  </div>
                  <div className="up-stat">
                    <div className="up-stat-num" style={{ color: "#4caf65" }}>{stats.accepted}</div>
                    <div className="up-stat-label">Accepted</div>
                  </div>
                  <div className="up-stat">
                    <div className="up-stat-num" style={{ color: "#c8a033" }}>{stats.pending}</div>
                    <div className="up-stat-label">Pending</div>
                  </div>
                  <div className="up-stat">
                    <div className="up-stat-num" style={{ color: "#e07070" }}>{stats.declined}</div>
                    <div className="up-stat-label">Declined</div>
                  </div>
                </div>

                {/* ACCOUNT DETAILS */}
                <div className="up-section-title">Account Details</div>
                <div className="up-info-card">
                  <div className="up-info-card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div className="up-info-card-title">Personal Information</div>
                    <button
                      onClick={() => { setEditing(!editing); setEditForm({ username: profile.username || "", email: profile.email || "", phone: profile.phone || "" }); }}
                      style={{ background: "transparent", border: "1px solid #1e1e1e", color: editing ? "#e07070" : "#555", padding: "5px 12px", borderRadius: 3, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                      {editing ? "Cancel" : "✏️ Edit"}
                    </button>
                  </div>

                  {editing ? (
                    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                      {[
                        { label: "Username", key: "username", type: "text" },
                        { label: "Email",    key: "email",    type: "email" },
                        { label: "Phone",    key: "phone",    type: "tel" },
                      ].map(f => (
                        <div key={f.key}>
                          <div style={{ fontSize: 10, color: "#333", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 5 }}>{f.label}</div>
                          <input
                            type={f.type}
                            value={editForm[f.key]}
                            onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                            style={{ width: "100%", background: "#111", border: "1px solid #1e1e1e", borderRadius: 3, padding: "10px 14px", color: "#e0e0e0", fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none" }}
                          />
                        </div>
                      ))}
                      <button
                        onClick={saveProfile}
                        disabled={saving}
                        style={{ padding: "11px 24px", background: "#c89633", color: "#0a0a0a", border: "none", borderRadius: 3, fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1, alignSelf: "flex-start" }}>
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="up-info-row">
                        <span className="up-info-icon">👤</span>
                        <span className="up-info-label">Username</span>
                        <span className="up-info-value">{profile.username}</span>
                      </div>
                      <div className="up-info-row">
                        <span className="up-info-icon">✉</span>
                        <span className="up-info-label">Email</span>
                        <span className="up-info-value">{profile.email}</span>
                      </div>
                      {profile.phone && (
                        <div className="up-info-row">
                          <span className="up-info-icon">📞</span>
                          <span className="up-info-label">Phone</span>
                          <span className="up-info-value">{profile.phone}</span>
                        </div>
                      )}
                      <div className="up-info-row">
                        <span className="up-info-icon">🆔</span>
                        <span className="up-info-label">Account ID</span>
                        <span className="up-info-value" style={{ color: "#333" }}>#{profile.id}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* QUICK ACTIONS */}
                <div className="up-section-title">Quick Actions</div>
                <div className="up-actions">
                  <button className="up-action-btn" onClick={() => navigate("/sent-requests")}>📤 Sent Requests</button>
                  <button className="up-action-btn" onClick={() => navigate("/view-replies")}>💬 View Replies</button>
                  <button className="up-action-btn" onClick={() => navigate("/view-plans")}>📋 My Plans</button>
                  <button className="up-action-btn danger" onClick={signOut}>🚪 Sign Out</button>
                </div>
              </>
            ) : (
              <div className="up-loading">Could not load profile.</div>
            )}
          </div>
        </div>
      </div>

      {toast && <div className={`up-toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
}
