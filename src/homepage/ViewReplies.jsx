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
  { label: "My Profile",    icon: "👤", path: "/user-profile" },
];

export default function ViewReplies() {
  const [user, setUser]       = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");
  const [toast, setToast]     = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token  = localStorage.getItem("token");
    if (!stored || !token) { navigate("/signup-as"); return; }
    try { setUser(JSON.parse(stored)); } catch { navigate("/signup-as"); return; }
    fetchReplies(token);
  }, []);

  const fetchReplies = async (token) => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/user/my_requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        // Only show requests that have been replied to (not pending)
        const replied = Array.isArray(json) ? json.filter(r => r.status !== "pending") : [];
        setReplies(replied);
      } else {
        showToast(json.error || "Failed to load replies.", "error");
      }
    } catch {
      showToast("Could not reach the server.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type) => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };
  const signOut   = () => { localStorage.clear(); navigate("/signup-as"); };
  const filtered  = filter === "all" ? replies : replies.filter(r => r.status === filter);
  const formatDate = (iso) => new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0a0a0a !important; }
        .vr-root { display: flex; min-height: 100vh; background: #0a0a0a; font-family: 'DM Sans', sans-serif; color: #e0e0e0; }
        .vr-sidebar { width: 240px; min-height: 100vh; background: #0d0d0d; border-right: 1px solid #1a1a1a; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow-y: auto; flex-shrink: 0; z-index: 100; transition: transform 0.25s ease; }
        .vr-sidebar-logo { font-family: 'Bebas Neue', sans-serif; font-size: 26px; color: #c89633; letter-spacing: 3px; padding: 24px 20px 18px; border-bottom: 1px solid #1a1a1a; }
        .vr-sidebar-logo span { display: block; font-size: 10px; color: #2a2a2a; letter-spacing: 2px; font-family: 'DM Sans', sans-serif; margin-top: 3px; text-transform: uppercase; }
        .vr-sidebar-user { padding: 14px 20px; border-bottom: 1px solid #1a1a1a; display: flex; align-items: center; gap: 10px; }
        .vr-avatar { width: 36px; height: 36px; border-radius: 50%; background: #1a1a1a; border: 1px solid #c89633; display: flex; align-items: center; justify-content: center; font-family: 'Bebas Neue', sans-serif; font-size: 16px; color: #c89633; flex-shrink: 0; overflow: hidden; }
        .vr-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .vr-sidebar-name { font-size: 13px; font-weight: 500; color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .vr-sidebar-role { font-size: 10px; color: #333; text-transform: uppercase; letter-spacing: 1px; }
        .vr-sidebar-nav { flex: 1; padding: 16px 0; }
        .vr-nav-label { font-size: 9px; color: #222; letter-spacing: 2px; text-transform: uppercase; padding: 10px 20px 6px; }
        .vr-nav-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 20px; background: transparent; border: none; border-left: 3px solid transparent; color: #3a3a3a; font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; transition: all 0.15s; text-align: left; }
        .vr-nav-btn:hover, .vr-nav-btn.active { color: #c89633; background: #121200; border-left-color: #c89633; }
        .vr-nav-icon { font-size: 16px; width: 20px; text-align: center; }
        .vr-sidebar-bottom { padding: 14px 12px; border-top: 1px solid #1a1a1a; }
        .vr-signout { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: transparent; border: 1px solid #1e1e1e; border-radius: 3px; color: #444; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .vr-signout:hover { border-color: #e07070; color: #e07070; background: #1f0d0d; }
        .vr-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .vr-topbar { background: #0d0d0d; border-bottom: 1px solid #1a1a1a; padding: 0 28px; height: 56px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; }
        .vr-topbar-title { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: #e8e8e8; letter-spacing: 2px; }
        .vr-mobile-btn { display: none; background: transparent; border: 1px solid #1e1e1e; color: #c89633; font-size: 18px; width: 36px; height: 36px; border-radius: 3px; cursor: pointer; align-items: center; justify-content: center; }
        .vr-content { padding: 28px 28px 60px; }
        .vr-filters { display: flex; gap: 8px; margin-bottom: 28px; flex-wrap: wrap; }
        .vr-filter-btn { padding: 7px 16px; border-radius: 20px; border: 1px solid #1e1e1e; background: transparent; color: #444; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; transition: all 0.15s; }
        .vr-filter-btn:hover { border-color: #c89633; color: #c89633; }
        .vr-filter-btn.active { background: #c89633; color: #0a0a0a; border-color: #c89633; font-weight: 500; }
        .vr-section-title { font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: #555; letter-spacing: 2px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
        .vr-section-title::after { content: ''; flex: 1; height: 1px; background: #1a1a1a; }
        .vr-list { display: flex; flex-direction: column; gap: 16px; }

        /* REPLY CARD */
        .vr-card { border-radius: 4px; overflow: hidden; border: 1px solid; }
        .vr-card.accepted { border-color: #143314; background: #080f08; }
        .vr-card.declined { border-color: #331414; background: #0f0808; }

        .vr-card-top { display: flex; align-items: center; gap: 14px; padding: 18px 20px; }
        .vr-worker-pic { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #c89633; flex-shrink: 0; }
        .vr-worker-pic-placeholder { width: 50px; height: 50px; border-radius: 50%; background: #1a1a1a; border: 2px solid #1e1e1e; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
        .vr-card-info { flex: 1; min-width: 0; }
        .vr-worker-name { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: #e8e8e8; letter-spacing: 1px; }
        .vr-worker-trade { font-size: 11px; color: #c89633; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
        .vr-card-meta { font-size: 11px; color: #333; margin-top: 4px; }

        .vr-reply-badge { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 3px; font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 1.5px; flex-shrink: 0; }
        .vr-reply-badge.accepted { background: #0d2a0d; color: #4caf65; border: 1px solid #143314; }
        .vr-reply-badge.declined { background: #2a0d0d; color: #e07070; border: 1px solid #331414; }

        .vr-card-body { border-top: 1px solid #1a1a1a; padding: 16px 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 600px) { .vr-card-body { grid-template-columns: 1fr; } }
        .vr-field-label { font-size: 10px; color: #333; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 5px; }
        .vr-field-text { font-size: 13px; color: #888; line-height: 1.6; background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 3px; padding: 10px 14px; }
        .vr-contact-row { font-size: 13px; color: #888; line-height: 1.8; }

        .vr-empty { text-align: center; padding: 80px 20px; color: #2a2a2a; }
        .vr-empty-icon { font-size: 40px; margin-bottom: 12px; }
        .vr-empty-cta { margin-top: 16px; padding: 10px 24px; background: transparent; border: 1px solid #1e1e1e; color: #555; border-radius: 3px; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.15s; }
        .vr-empty-cta:hover { border-color: #c89633; color: #c89633; }
        .vr-loading { text-align: center; color: #2a2a2a; padding: 80px; font-size: 14px; }
        .vr-toast { position: fixed; bottom: 28px; right: 28px; padding: 12px 20px; border-radius: 4px; font-size: 13px; z-index: 500; animation: slideUp 0.3s ease; }
        .vr-toast.success { background: #0d1f0d; color: #4caf65; border: 1px solid #143314; }
        .vr-toast.error { background: #1f0d0d; color: #e07070; border: 1px solid #331414; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .vr-mob-overlay { display: none; position: fixed; inset: 0; background: #000a; z-index: 99; }
        @media (max-width: 768px) {
          .vr-sidebar { position: fixed; top: 0; left: 0; transform: translateX(-100%); }
          .vr-sidebar.open { transform: translateX(0); }
          .vr-mob-overlay { display: block; }
          .vr-mob-overlay.open { opacity: 1; pointer-events: auto; }
          .vr-mobile-btn { display: flex; }
          .vr-content { padding: 20px 16px 80px; }
        }
      `}</style>

      <div className={`vr-mob-overlay ${mobileOpen ? "open" : ""}`}
        style={{ opacity: mobileOpen ? 1 : 0, pointerEvents: mobileOpen ? "auto" : "none" }}
        onClick={() => setMobileOpen(false)} />

      <div className="vr-root">
        <aside className={`vr-sidebar ${mobileOpen ? "open" : ""}`}>
          <div className="vr-sidebar-logo">SteelSmith<span>Client Portal</span></div>
          <div className="vr-sidebar-user">
            <div className="vr-avatar">
              {user?.profile_pic ? <img src={`${API_BASE}/static/images/${user.profile_pic}`} alt={user?.username} /> : (user?.username?.[0] || "U").toUpperCase()}
            </div>
            <div>
              <div className="vr-sidebar-name">{user?.username || "User"}</div>
              <div className="vr-sidebar-role">Client</div>
            </div>
          </div>
          <nav className="vr-sidebar-nav">
            <div className="vr-nav-label">Menu</div>
            {NAV.map(item => (
              <button key={item.path} className={`vr-nav-btn ${item.path === "/view-replies" ? "active" : ""}`}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}>
                <span className="vr-nav-icon">{item.icon}</span>{item.label}
              </button>
            ))}
          </nav>
          <div className="vr-sidebar-bottom">
            <button className="vr-signout" onClick={signOut}>🚪 Sign Out</button>
          </div>
        </aside>

        <div className="vr-main">
          <div className="vr-topbar">
            <button className="vr-mobile-btn" onClick={() => setMobileOpen(true)}>☰</button>
            <div className="vr-topbar-title">View Replies</div>
            <div style={{ fontSize: 12, color: "#333" }}>{replies.length} repl{replies.length !== 1 ? "ies" : "y"}</div>
          </div>

          <div className="vr-content">
            <div className="vr-filters">
              {["all", "accepted", "declined"].map(f => (
                <button key={f} className={`vr-filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                  {f === "all" ? "All Replies" : f.charAt(0).toUpperCase() + f.slice(1)}
                  {f !== "all" && ` (${replies.filter(r => r.status === f).length})`}
                </button>
              ))}
            </div>

            <div className="vr-section-title">
              {filter === "all" ? `All Replies (${replies.length})` : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </div>

            {loading ? (
              <div className="vr-loading">Loading replies...</div>
            ) : filtered.length === 0 ? (
              <div className="vr-empty">
                <div className="vr-empty-icon">💬</div>
                <div>{replies.length === 0 ? "No workers have replied to your requests yet." : `No ${filter} replies.`}</div>
                {replies.length === 0 && (
                  <button className="vr-empty-cta" onClick={() => navigate("/sent-requests")}>View Sent Requests</button>
                )}
              </div>
            ) : (
              <div className="vr-list">
                {filtered.map(req => (
                  <div className={`vr-card ${req.status}`} key={req.request_id}>
                    <div className="vr-card-top">
                      {req.worker_pic
                        ? <img src={`${API_BASE}/static/images/${req.worker_pic}`} alt={req.worker_name} className="vr-worker-pic" />
                        : <div className="vr-worker-pic-placeholder">👷</div>}
                      <div className="vr-card-info">
                        <div className="vr-worker-name">{req.worker_name}</div>
                        {req.worker_trade && <div className="vr-worker-trade">{req.worker_trade}</div>}
                        <div className="vr-card-meta">Sent {formatDate(req.created_at)}</div>
                      </div>
                      <div className={`vr-reply-badge ${req.status}`}>
                        {req.status === "accepted" ? "✓ Accepted" : "✕ Declined"}
                      </div>
                    </div>
                    <div className="vr-card-body">
                      <div>
                        <div className="vr-field-label">Your Job Description</div>
                        <div className="vr-field-text">{req.description}</div>
                      </div>
                      <div>
                        <div className="vr-field-label">Worker Contact</div>
                        <div className="vr-field-text vr-contact-row">
                          {req.worker_email && <div>✉ {req.worker_email}</div>}
                          {req.worker_phone && <div>📞 {req.worker_phone}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {toast && <div className={`vr-toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
}
