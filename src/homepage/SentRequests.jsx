import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { apiUrl } from "../components/apiClient";
const API_BASE = apiUrl("");

const STATUS_STYLES = {
  pending:  { color: "#c8a033", bg: "#1a1500", border: "#2a2000", label: "Pending" },
  accepted: { color: "#4caf65", bg: "#0d1f0d", border: "#143314", label: "Accepted" },
  declined: { color: "#e07070", bg: "#1f0d0d", border: "#331414", label: "Declined" },
};

const NAV = [
  { label: "Home",          icon: "🏠", path: "/home" },
  { label: "View Plans",    icon: "📋", path: "/view-plans" },
  { label: "Add Plan",      icon: "➕", path: "/add-plan" },
  { label: "Sent Requests", icon: "📤", path: "/sent-requests" },
  { label: "View Replies",  icon: "💬", path: "/view-replies" },
  { label: "My Profile",    icon: "👤", path: "/user-profile" },
];

export default function SentRequests() {
  const [user, setUser]         = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [toast, setToast]       = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token  = localStorage.getItem("token");
    if (!stored || !token) { navigate("/signup-as"); return; }
    try { setUser(JSON.parse(stored)); } catch { navigate("/signup-as"); return; }
    fetchRequests(token);
  }, []);

  const fetchRequests = async (token) => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/user/my_requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) setRequests(Array.isArray(json) ? json : []);
      else showToast(json.error || "Failed to load requests.", "error");
    } catch {
      showToast("Could not reach the server.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type) => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };
  const signOut   = () => { localStorage.clear(); navigate("/signup-as"); };
  const filtered  = filter === "all" ? requests : requests.filter(r => r.status === filter);
  const formatDate = (iso) => new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const statusStyle = (s) => STATUS_STYLES[s] || STATUS_STYLES.pending;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0a0a0a !important; }
        .sr-root { display: flex; min-height: 100vh; background: #0a0a0a; font-family: 'DM Sans', sans-serif; color: #e0e0e0; }
        .sr-sidebar { width: 240px; min-height: 100vh; background: #0d0d0d; border-right: 1px solid #1a1a1a; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow-y: auto; flex-shrink: 0; z-index: 100; transition: transform 0.25s ease; }
        .sr-sidebar-logo { font-family: 'Bebas Neue', sans-serif; font-size: 26px; color: #c89633; letter-spacing: 3px; padding: 24px 20px 18px; border-bottom: 1px solid #1a1a1a; }
        .sr-sidebar-logo span { display: block; font-size: 10px; color: #2a2a2a; letter-spacing: 2px; font-family: 'DM Sans', sans-serif; margin-top: 3px; text-transform: uppercase; }
        .sr-sidebar-user { padding: 14px 20px; border-bottom: 1px solid #1a1a1a; display: flex; align-items: center; gap: 10px; }
        .sr-avatar { width: 36px; height: 36px; border-radius: 50%; background: #1a1a1a; border: 1px solid #c89633; display: flex; align-items: center; justify-content: center; font-family: 'Bebas Neue', sans-serif; font-size: 16px; color: #c89633; flex-shrink: 0; overflow: hidden; }
        .sr-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .sr-sidebar-name { font-size: 13px; font-weight: 500; color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sr-sidebar-role { font-size: 10px; color: #333; text-transform: uppercase; letter-spacing: 1px; }
        .sr-sidebar-nav { flex: 1; padding: 16px 0; }
        .sr-nav-label { font-size: 9px; color: #222; letter-spacing: 2px; text-transform: uppercase; padding: 10px 20px 6px; }
        .sr-nav-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 20px; background: transparent; border: none; border-left: 3px solid transparent; color: #3a3a3a; font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; transition: all 0.15s; text-align: left; }
        .sr-nav-btn:hover, .sr-nav-btn.active { color: #c89633; background: #121200; border-left-color: #c89633; }
        .sr-nav-icon { font-size: 16px; width: 20px; text-align: center; }
        .sr-sidebar-bottom { padding: 14px 12px; border-top: 1px solid #1a1a1a; }
        .sr-signout { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: transparent; border: 1px solid #1e1e1e; border-radius: 3px; color: #444; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .sr-signout:hover { border-color: #e07070; color: #e07070; background: #1f0d0d; }
        .sr-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .sr-topbar { background: #0d0d0d; border-bottom: 1px solid #1a1a1a; padding: 0 28px; height: 56px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; }
        .sr-topbar-title { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: #e8e8e8; letter-spacing: 2px; }
        .sr-mobile-btn { display: none; background: transparent; border: 1px solid #1e1e1e; color: #c89633; font-size: 18px; width: 36px; height: 36px; border-radius: 3px; cursor: pointer; align-items: center; justify-content: center; }
        .sr-content { padding: 28px 28px 60px; }
        .sr-stats { display: flex; gap: 12px; margin-bottom: 28px; flex-wrap: wrap; }
        .sr-stat { flex: 1; min-width: 90px; background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 4px; padding: 14px 18px; }
        .sr-stat-num { font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: #c89633; }
        .sr-stat-label { font-size: 11px; color: #333; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
        .sr-filters { display: flex; gap: 8px; margin-bottom: 28px; flex-wrap: wrap; }
        .sr-filter-btn { padding: 7px 16px; border-radius: 20px; border: 1px solid #1e1e1e; background: transparent; color: #444; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; transition: all 0.15s; }
        .sr-filter-btn:hover { border-color: #c89633; color: #c89633; }
        .sr-filter-btn.active { background: #c89633; color: #0a0a0a; border-color: #c89633; font-weight: 500; }
        .sr-section-title { font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: #555; letter-spacing: 2px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
        .sr-section-title::after { content: ''; flex: 1; height: 1px; background: #1a1a1a; }
        .sr-list { display: flex; flex-direction: column; gap: 12px; }
        .sr-card { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 4px; overflow: hidden; transition: border-color 0.2s; }
        .sr-card:hover { border-color: #2a2a2a; }
        .sr-card-header { display: flex; align-items: center; gap: 14px; padding: 16px 20px; cursor: pointer; }
        .sr-worker-pic { width: 46px; height: 46px; border-radius: 50%; object-fit: cover; border: 2px solid #c89633; flex-shrink: 0; }
        .sr-worker-pic-placeholder { width: 46px; height: 46px; border-radius: 50%; background: #1a1a1a; border: 2px solid #1e1e1e; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .sr-card-info { flex: 1; min-width: 0; }
        .sr-worker-name { font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: #e8e8e8; letter-spacing: 1px; }
        .sr-worker-trade { font-size: 11px; color: #c89633; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
        .sr-card-meta { font-size: 11px; color: #333; margin-top: 4px; }
        .sr-status-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; letter-spacing: 0.5px; flex-shrink: 0; border: 1px solid; }
        .sr-chevron { color: #333; font-size: 12px; flex-shrink: 0; transition: transform 0.2s; margin-left: 4px; }
        .sr-chevron.open { transform: rotate(180deg); }
        .sr-card-body { padding: 0 20px 20px; border-top: 1px solid #141414; }
        .sr-body-section { margin-top: 14px; }
        .sr-body-label { font-size: 10px; color: #333; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 5px; }
        .sr-body-text { font-size: 13px; color: #aaa; line-height: 1.6; background: #111; border: 1px solid #1a1a1a; border-radius: 3px; padding: 10px 14px; }
        .sr-empty { text-align: center; padding: 80px 20px; color: #2a2a2a; }
        .sr-empty-icon { font-size: 40px; margin-bottom: 12px; }
        .sr-loading { text-align: center; color: #2a2a2a; padding: 80px; font-size: 14px; }
        .sr-toast { position: fixed; bottom: 28px; right: 28px; padding: 12px 20px; border-radius: 4px; font-size: 13px; z-index: 500; animation: slideUp 0.3s ease; }
        .sr-toast.success { background: #0d1f0d; color: #4caf65; border: 1px solid #143314; }
        .sr-toast.error { background: #1f0d0d; color: #e07070; border: 1px solid #331414; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .sr-mob-overlay { display: none; position: fixed; inset: 0; background: #000a; z-index: 99; }
        @media (max-width: 768px) {
          .sr-sidebar { position: fixed; top: 0; left: 0; transform: translateX(-100%); }
          .sr-sidebar.open { transform: translateX(0); }
          .sr-mob-overlay { display: block; }
          .sr-mob-overlay.open { opacity: 1; pointer-events: auto; }
          .sr-mobile-btn { display: flex; }
          .sr-content { padding: 20px 16px 80px; }
        }
      `}</style>

      <div className={`sr-mob-overlay ${mobileOpen ? "open" : ""}`}
        style={{ opacity: mobileOpen ? 1 : 0, pointerEvents: mobileOpen ? "auto" : "none" }}
        onClick={() => setMobileOpen(false)} />

      <div className="sr-root">
        <aside className={`sr-sidebar ${mobileOpen ? "open" : ""}`}>
          <div className="sr-sidebar-logo">SteelSmith<span>Client Portal</span></div>
          <div className="sr-sidebar-user">
            <div className="sr-avatar">
              {user?.profile_pic ? <img src={`${API_BASE}/static/images/${user.profile_pic}`} alt={user?.username} /> : (user?.username?.[0] || "U").toUpperCase()}
            </div>
            <div>
              <div className="sr-sidebar-name">{user?.username || "User"}</div>
              <div className="sr-sidebar-role">Client</div>
            </div>
          </div>
          <nav className="sr-sidebar-nav">
            <div className="sr-nav-label">Menu</div>
            {NAV.map(item => (
              <button key={item.path} className={`sr-nav-btn ${item.path === "/sent-requests" ? "active" : ""}`}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}>
                <span className="sr-nav-icon">{item.icon}</span>{item.label}
              </button>
            ))}
          </nav>
          <div className="sr-sidebar-bottom">
            <button className="sr-signout" onClick={signOut}>🚪 Sign Out</button>
          </div>
        </aside>

        <div className="sr-main">
          <div className="sr-topbar">
            <button className="sr-mobile-btn" onClick={() => setMobileOpen(true)}>☰</button>
            <div className="sr-topbar-title">Sent Requests</div>
            <div style={{ fontSize: 12, color: "#333" }}>{requests.length} total</div>
          </div>

          <div className="sr-content">
            {!loading && requests.length > 0 && (
              <div className="sr-stats">
                <div className="sr-stat"><div className="sr-stat-num">{requests.length}</div><div className="sr-stat-label">Total Sent</div></div>
                <div className="sr-stat"><div className="sr-stat-num" style={{ color: "#4caf65" }}>{requests.filter(r => r.status === "accepted").length}</div><div className="sr-stat-label">Accepted</div></div>
                <div className="sr-stat"><div className="sr-stat-num" style={{ color: "#c8a033" }}>{requests.filter(r => r.status === "pending").length}</div><div className="sr-stat-label">Pending</div></div>
                <div className="sr-stat"><div className="sr-stat-num" style={{ color: "#e07070" }}>{requests.filter(r => r.status === "declined").length}</div><div className="sr-stat-label">Declined</div></div>
              </div>
            )}

            <div className="sr-filters">
              {["all", "pending", "accepted", "declined"].map(f => (
                <button key={f} className={`sr-filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}{f !== "all" && ` (${requests.filter(r => r.status === f).length})`}
                </button>
              ))}
            </div>

            <div className="sr-section-title">{filter === "all" ? "All Requests" : filter.charAt(0).toUpperCase() + filter.slice(1)}</div>

            {loading ? (
              <div className="sr-loading">Loading requests...</div>
            ) : filtered.length === 0 ? (
              <div className="sr-empty">
                <div className="sr-empty-icon">📤</div>
                <div>{filter === "all" ? "You haven't sent any requests yet." : `No ${filter} requests.`}</div>
              </div>
            ) : (
              <div className="sr-list">
                {filtered.map(req => {
                  const s = statusStyle(req.status);
                  const isOpen = expanded === req.request_id;
                  return (
                    <div className="sr-card" key={req.request_id}>
                      <div className="sr-card-header" onClick={() => setExpanded(isOpen ? null : req.request_id)}>
                        {req.worker_pic
                          ? <img src={`${API_BASE}/static/images/${req.worker_pic}`} alt={req.worker_name} className="sr-worker-pic" />
                          : <div className="sr-worker-pic-placeholder">👷</div>}
                        <div className="sr-card-info">
                          <div className="sr-worker-name">{req.worker_name}</div>
                          {req.worker_trade && <div className="sr-worker-trade">{req.worker_trade}</div>}
                          <div className="sr-card-meta">{formatDate(req.created_at)}</div>
                        </div>
                        <div className="sr-status-badge" style={{ color: s.color, background: s.bg, borderColor: s.border }}>{s.label}</div>
                        <span className={`sr-chevron ${isOpen ? "open" : ""}`}>▼</span>
                      </div>
                      {isOpen && (
                        <div className="sr-card-body">
                          <div className="sr-body-section">
                            <div className="sr-body-label">Job Description</div>
                            <div className="sr-body-text">{req.description}</div>
                          </div>
                          <div className="sr-body-section">
                            <div className="sr-body-label">Your Contact Info</div>
                            <div className="sr-body-text">{req.contact_info}</div>
                          </div>
                          {(req.worker_email || req.worker_phone) && (
                            <div className="sr-body-section">
                              <div className="sr-body-label">Worker Contact</div>
                              <div className="sr-body-text">
                                {req.worker_email && <div>✉ {req.worker_email}</div>}
                                {req.worker_phone && <div>📞 {req.worker_phone}</div>}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {toast && <div className={`sr-toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
}
