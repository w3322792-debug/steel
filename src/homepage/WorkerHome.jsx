import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { apiUrl } from "../components/apiClient";
const API_BASE = apiUrl("");

export default function WorkerHome() {
  const [worker, setWorker]             = useState(null);
  const [requests, setRequests]         = useState([]);
  const [page, setPage]                 = useState("home");
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [respondingId, setRespondingId] = useState(null);
  const [toast, setToast]               = useState(null);
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [mobileOpen, setMobileOpen]     = useState(false);

  // ── My Plans state ────────────────────────────────────────────────────────
  const [plans, setPlans]               = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState(null); // plan id currently expanded
  // ─────────────────────────────────────────────────────────────────────────

  const navigate = useNavigate();

  // ── Auth & initial fetch ──────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token  = localStorage.getItem("token");
    if (!stored || !token) { navigate("/signin"); return; }
    setWorker(JSON.parse(stored));
    fetchRequests(token);
  }, []);

  // Fetch plans whenever the worker switches to the plans tab
  useEffect(() => {
    if (page === "plans") {
      const token = localStorage.getItem("token");
      fetchMyPlans(token);
    }
  }, [page]);

  // ── API calls ─────────────────────────────────────────────────────────────
  const fetchRequests = async (token) => {
    setLoadingRequests(true);
    try {
      const res  = await fetch(`${API_BASE}/api/my_requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setRequests(Array.isArray(json) ? json : []);
    } catch {
      showToast("Could not load requests.", "error");
    } finally {
      setLoadingRequests(false);
    }
  };

  /**
   * Fetches the plans the logged-in worker has been added to.
   * Expected response: array of plan objects, e.g.
   *   [{ id, name, createdAt, client: { username, email, phone, profile_pic }, workers: [...] }]
   */
  const fetchMyPlans = async (token) => {
    setLoadingPlans(true);
    try {
      const res  = await fetch(`${API_BASE}/api/worker/my_plans`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        setPlans(Array.isArray(json) ? json : []);
      } else {
        showToast(json.error || "Could not load plans.", "error");
        setPlans([]);
      }
    } catch {
      showToast("Could not reach server.", "error");
      setPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const respond = async (requestId, action) => {
    setRespondingId(requestId);
    const token = localStorage.getItem("token");
    const data  = new FormData();
    data.append("action", action);
    try {
      const res  = await fetch(`${API_BASE}/api/respond_request/${requestId}`, {
        method:  "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body:    data,
      });
      const json = await res.json();
      if (res.ok) {
        setRequests(prev => prev.map(r =>
          r.request_id === requestId ? { ...r, status: action } : r
        ));
        showToast(`Request ${action} successfully.`, "success");
      } else {
        showToast(json.error || "Something went wrong.", "error");
      }
    } catch {
      showToast("Could not reach server.", "error");
    } finally {
      setRespondingId(null);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/signin");
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const pending  = requests.filter(r => r.status === "pending").length;
  const accepted = requests.filter(r => r.status === "accepted").length;
  const declined = requests.filter(r => r.status === "declined").length;

  const statusColor = (s) => ({
    pending:  { bg: "#1a1500", color: "#c89633", border: "#2a2200" },
    accepted: { bg: "#0d1f0d", color: "#4caf65", border: "#143314" },
    declined: { bg: "#1f0d0d", color: "#e07070", border: "#331414" },
  }[s] || { bg: "#1a1a1a", color: "#888", border: "#2a2a2a" });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="wh-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0a0a0a !important; margin: 0; padding: 0; }

        .wh-root { min-height: 100vh; background: #0a0a0a; font-family: 'DM Sans', sans-serif; color: #e0e0e0; }

        /* ── LAYOUT ── */
        .wh-layout { display: flex; min-height: 100vh; background: #0a0a0a; }

        /* ── SIDEBAR ── */
        .sidebar { width: 220px; min-width: 220px; background: #0d0d0d; border-right: 1px solid #1e1e1e; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; transition: width 0.25s ease, min-width 0.25s ease, transform 0.25s ease; overflow: hidden; z-index: 200; flex-shrink: 0; }
        .sidebar.collapsed { width: 56px; min-width: 56px; }

        @media (max-width: 768px) {
          .sidebar { position: fixed; top: 0; left: 0; height: 100vh; transform: translateX(-100%); width: 220px !important; min-width: 220px !important; box-shadow: 4px 0 24px #000a; }
          .sidebar.mobile-open { transform: translateX(0); }
          .sidebar-overlay { display: block; }
          .wh-body { margin-left: 0 !important; }
          .mobile-menu-btn { display: flex !important; }
        }

        .sidebar-logo { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 3px; padding: 20px 16px; border-bottom: 1px solid #1e1e1e; color: #c89633; white-space: nowrap; overflow: hidden; }
        .sidebar-toggle { background: transparent; border: none; color: #555; font-size: 16px; cursor: pointer; padding: 10px 16px; text-align: right; width: 100%; display: block; transition: color 0.2s; }
        .sidebar-toggle:hover { color: #c89633; }
        .sidebar-nav { flex: 1; padding: 8px; display: flex; flex-direction: column; gap: 4px; }
        .sidebar-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; border-radius: 4px; background: transparent; border: none; color: #888; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; text-align: left; white-space: nowrap; }
        .sidebar-item:hover { background: #1a1a1a; color: #e0e0e0; }
        .sidebar-item.active { background: #1a1200; color: #c89633; border: 1px solid #2a2000; }
        .sidebar-icon { font-size: 18px; width: 24px; text-align: center; flex-shrink: 0; }
        .sidebar-label { transition: opacity 0.2s; }
        .sidebar.collapsed .sidebar-label { opacity: 0; pointer-events: none; }
        .sidebar-divider { border: none; border-top: 1px solid #1e1e1e; margin: 8px 0; }
        .sidebar-footer { padding: 16px; border-top: 1px solid #1e1e1e; }
        .sidebar-user { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #666; margin-bottom: 10px; white-space: nowrap; overflow: hidden; }
        .sidebar-username { color: #c89633; font-weight: 500; }
        .sidebar-logout { display: flex; align-items: center; gap: 8px; background: transparent; border: 1px solid #2a2a2a; color: #e07070; font-family: 'DM Sans', sans-serif; font-size: 13px; padding: 8px 14px; border-radius: 4px; cursor: pointer; transition: background 0.2s; white-space: nowrap; width: 100%; }
        .sidebar-logout:hover { background: #1f0d0d; }

        .sidebar-overlay { display: none; position: fixed; inset: 0; background: #000a; z-index: 199; opacity: 0; transition: opacity 0.25s; }
        .sidebar-overlay.visible { opacity: 1; pointer-events: auto; display: block; }

        .mobile-menu-btn { display: none; position: fixed; top: 12px; left: 12px; z-index: 198; background: #111; border: 1px solid #2a2a2a; color: #c89633; font-size: 20px; width: 40px; height: 40px; border-radius: 4px; cursor: pointer; align-items: center; justify-content: center; }

        /* ── MAIN BODY ── */
        .wh-body { flex: 1; min-width: 0; padding: 32px 24px; background: #0a0a0a; }
        .wh-greeting { margin-bottom: 32px; }
        .wh-greeting-sub { font-size: 12px; color: #444; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; }
        .wh-greeting-title { font-family: 'Bebas Neue', sans-serif; font-size: 42px; color: #e8e8e8; letter-spacing: 2px; line-height: 1; }
        .wh-greeting-title span { color: #c89633; }

        /* ── STATS ── */
        .wh-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
        .wh-stat { background: #111; border: 1px solid #1e1e1e; border-radius: 4px; padding: 20px 24px; position: relative; overflow: hidden; }
        .wh-stat::before { content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%; }
        .wh-stat.pending::before  { background: #c89633; }
        .wh-stat.accepted::before { background: #4caf65; }
        .wh-stat.declined::before { background: #e07070; }
        .wh-stat-num { font-family: 'Bebas Neue', sans-serif; font-size: 48px; line-height: 1; margin-bottom: 4px; }
        .wh-stat.pending  .wh-stat-num { color: #c89633; }
        .wh-stat.accepted .wh-stat-num { color: #4caf65; }
        .wh-stat.declined .wh-stat-num { color: #e07070; }
        .wh-stat-label { font-size: 11px; color: #555; letter-spacing: 1.5px; text-transform: uppercase; }

        /* ── REQUESTS ── */
        .wh-empty { text-align: center; padding: 60px 0; color: #333; font-size: 14px; }
        .wh-empty-icon { font-size: 40px; margin-bottom: 12px; }
        .wh-request-list { display: flex; flex-direction: column; gap: 16px; }
        .wh-request { background: #111; border: 1px solid #1e1e1e; border-radius: 4px; padding: 20px 24px; display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: start; transition: border-color 0.2s; }
        .wh-request:hover { border-color: #2a2a2a; }
        .wh-request-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
        .wh-request-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid #2a2a2a; background: #1a1a1a; }
        .wh-request-avatar-placeholder { width: 40px; height: 40px; border-radius: 50%; background: #1a1a1a; border: 1px solid #2a2a2a; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .wh-request-user { font-size: 14px; font-weight: 500; color: #e0e0e0; }
        .wh-request-meta { font-size: 12px; color: #444; margin-top: 2px; }
        .wh-request-desc { font-size: 13px; color: #888; line-height: 1.6; margin-bottom: 10px; }
        .wh-request-contact { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #555; }
        .wh-status-badge { font-size: 10px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; border: 1px solid; white-space: nowrap; }
        .wh-actions { display: flex; flex-direction: column; gap: 8px; min-width: 100px; }
        .wh-action-btn { padding: 8px 14px; border-radius: 3px; border: none; font-family: 'Bebas Neue', sans-serif; font-size: 15px; letter-spacing: 1px; cursor: pointer; transition: opacity 0.2s; text-align: center; }
        .wh-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .wh-action-btn.accept { background: #4caf65; color: #0a0a0a; }
        .wh-action-btn.accept:hover { opacity: 0.85; }
        .wh-action-btn.decline { background: transparent; color: #e07070; border: 1px solid #e07070; }
        .wh-action-btn.decline:hover { background: #e0707011; }

        /* ── PROFILE ── */
        .wh-profile-card { background: #111; border: 1px solid #1e1e1e; border-radius: 4px; overflow: hidden; }
        .wh-profile-banner { height: 80px; background: linear-gradient(135deg, #c89633 0%, #8a6420 100%); position: relative; }
        .wh-profile-banner::after { content: 'STEELSMITH'; position: absolute; top: 12px; right: 20px; font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: #0a0a0a22; letter-spacing: 6px; }
        .wh-profile-body { padding: 0 28px 28px; position: relative; }
        .wh-profile-pic-wrap { margin-top: -28px; margin-bottom: 16px; }
        .wh-profile-pic { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 3px solid #0a0a0a; background: #1a1a1a; }
        .wh-profile-pic-placeholder { width: 72px; height: 72px; border-radius: 50%; background: #1a1a1a; border: 3px solid #0a0a0a; display: flex; align-items: center; justify-content: center; font-size: 28px; }
        .wh-profile-name { font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: #e8e8e8; letter-spacing: 1px; margin-bottom: 2px; }
        .wh-profile-trade { display: inline-block; font-size: 11px; color: #c89633; background: #1a1200; border: 1px solid #2a2000; padding: 3px 10px; border-radius: 20px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 20px; }
        .wh-profile-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .wh-profile-field-label { font-size: 10px; color: #444; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; }
        .wh-profile-field-value { font-size: 14px; color: #aaa; }

        /* ══════════════════════════════════════════════════════
           MY PLANS
        ══════════════════════════════════════════════════════ */

        .wh-plans-section-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px; color: #444; letter-spacing: 2px;
          margin-bottom: 16px;
          display: flex; align-items: center; gap: 12px;
        }
        .wh-plans-section-title::after {
          content: ''; flex: 1; height: 1px; background: #1a1a1a;
        }

        .wh-plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 14px;
          margin-bottom: 32px;
        }

        .wh-plan-card {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 4px;
          overflow: hidden;
          transition: border-color 0.2s, transform 0.15s;
          cursor: pointer;
        }
        .wh-plan-card:hover { border-color: #2e2e2e; transform: translateY(-2px); }
        .wh-plan-card.expanded { border-color: #c89633; }

        .wh-plan-card-top {
          padding: 18px 20px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .wh-plan-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px; color: #e8e8e8; letter-spacing: 1px;
          line-height: 1.1;
        }

        .wh-plan-meta {
          font-size: 11px; color: #444;
          text-transform: uppercase; letter-spacing: 1px;
          margin-top: 4px;
        }

        .wh-plan-chevron {
          font-size: 12px; color: #333;
          transition: transform 0.2s;
          flex-shrink: 0; margin-top: 4px;
        }
        .wh-plan-card.expanded .wh-plan-chevron { transform: rotate(180deg); color: #c89633; }

        .wh-plan-footer {
          padding: 10px 20px;
          border-top: 1px solid #161616;
          display: flex; align-items: center; gap: 8px;
        }

        /* client mini info */
        .wh-plan-client-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: #1a1a1a; border: 1px solid #2a2a2a;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; color: #c89633;
          font-family: 'Bebas Neue', sans-serif;
          overflow: hidden; flex-shrink: 0;
        }
        .wh-plan-client-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .wh-plan-client-name { font-size: 12px; color: #555; }
        .wh-plan-client-label { font-size: 10px; color: #2a2a2a; text-transform: uppercase; letter-spacing: 1px; }

        /* expanded detail panel */
        .wh-plan-detail {
          border-top: 1px solid #1e1e1e;
          background: #0d0d0d;
          padding: 20px;
          animation: fadeSlideDown 0.2s ease;
        }
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .wh-plan-detail-row {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid #111;
          font-size: 13px; color: #777;
        }
        .wh-plan-detail-row:last-child { border-bottom: none; }
        .wh-plan-detail-icon { width: 20px; text-align: center; font-size: 14px; flex-shrink: 0; }
        .wh-plan-detail-label { width: 80px; font-size: 10px; color: #333; text-transform: uppercase; letter-spacing: 1px; flex-shrink: 0; }
        .wh-plan-detail-val { color: #aaa; font-size: 13px; }

        /* co-workers inside expanded plan */
        .wh-plan-coworkers-title {
          font-size: 10px; color: #333; text-transform: uppercase;
          letter-spacing: 1.5px; margin: 16px 0 10px;
        }
        .wh-plan-coworkers {
          display: flex; flex-wrap: wrap; gap: 8px;
        }
        .wh-plan-coworker-chip {
          display: flex; align-items: center; gap: 6px;
          background: #141414; border: 1px solid #1e1e1e;
          border-radius: 20px; padding: 4px 10px 4px 4px;
          font-size: 12px; color: #888;
        }
        .wh-plan-coworker-chip-av {
          width: 22px; height: 22px; border-radius: 50%;
          background: #1a1a1a; border: 1px solid #2a2a2a;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; color: #c89633;
          font-family: 'Bebas Neue', sans-serif;
          overflow: hidden; flex-shrink: 0;
        }
        .wh-plan-coworker-chip-av img { width: 100%; height: 100%; object-fit: cover; }
        .wh-plan-coworker-chip.me { border-color: #c8963344; color: #c89633; }

        /* loading shimmer */
        .wh-plans-loading {
          text-align: center; padding: 60px 0; color: #2a2a2a;
          font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
        }

        /* ══════════════════════════════════════════════════════ */

        /* ── TOAST ── */
        .wh-toast { position: fixed; bottom: 28px; right: 28px; padding: 12px 20px; border-radius: 4px; font-size: 13px; z-index: 999; animation: slideUp 0.3s ease; }
        .wh-toast.success { background: #0d1f0d; color: #4caf65; border: 1px solid #143314; }
        .wh-toast.error   { background: #1f0d0d; color: #e07070; border: 1px solid #331414; }

        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

        .wh-loading { text-align: center; padding: 48px; color: #333; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; }

        @media (max-width: 640px) {
          .wh-stats { grid-template-columns: 1fr; }
          .wh-request { grid-template-columns: 1fr; }
          .wh-actions { flex-direction: row; }
          .wh-profile-fields { grid-template-columns: 1fr; }
          .wh-body { padding: 24px 16px; }
          .wh-plans-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="wh-layout">

        {/* MOBILE HAMBURGER */}
        <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>☰</button>

        {/* MOBILE OVERLAY */}
        <div className={`sidebar-overlay ${mobileOpen ? "visible" : ""}`} onClick={() => setMobileOpen(false)} />

        {/* SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"} ${mobileOpen ? "mobile-open" : ""}`}>
          <div className="sidebar-logo">⚒ {sidebarOpen ? "SteelSmith" : ""}</div>

          <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}>
            {sidebarOpen ? "◀" : "▶"}
          </button>

          <nav className="sidebar-nav">
            <button className={`sidebar-item ${page === "home" ? "active" : ""}`}
              onClick={() => { setPage("home"); setMobileOpen(false); }}>
              <span className="sidebar-icon">🏠</span>
              <span className="sidebar-label">Home</span>
            </button>

            <button className={`sidebar-item ${page === "requests" ? "active" : ""}`}
              onClick={() => { setPage("requests"); setMobileOpen(false); }}>
              <span className="sidebar-icon">📋</span>
              <span className="sidebar-label">Requests</span>
            </button>

            {/* ── MY PLANS button ── */}
            <button className={`sidebar-item ${page === "plans" ? "active" : ""}`}
              onClick={() => { setPage("plans"); setMobileOpen(false); }}>
              <span className="sidebar-icon">📁</span>
              <span className="sidebar-label">My Plans</span>
            </button>

            <hr className="sidebar-divider" />

            <button className="sidebar-item" onClick={() => navigate("/worker-profile")}>
              <span className="sidebar-icon">👤</span>
              <span className="sidebar-label">My Profile</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-user">
              <span>👷</span>
              {sidebarOpen && <span className="sidebar-username">{worker?.username}</span>}
            </div>
            <button className="sidebar-logout" onClick={signOut}>
              <span>🚪</span>
              {sidebarOpen && <span>Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="wh-body">

          {/* ── HOME ── */}
          {page === "home" && (
            <>
              <div className="wh-greeting">
                <div className="wh-greeting-sub">Worker Dashboard</div>
                <div className="wh-greeting-title">
                  Welcome, <span>{worker?.username || "Worker"}</span>
                </div>
              </div>
              <div className="wh-stats">
                <div className="wh-stat pending">
                  <div className="wh-stat-num">{pending}</div>
                  <div className="wh-stat-label">Pending Requests</div>
                </div>
                <div className="wh-stat accepted">
                  <div className="wh-stat-num">{accepted}</div>
                  <div className="wh-stat-label">Accepted</div>
                </div>
                <div className="wh-stat declined">
                  <div className="wh-stat-num">{declined}</div>
                  <div className="wh-stat-label">Declined</div>
                </div>
              </div>
            </>
          )}

          {/* ── REQUESTS ── */}
          {page === "requests" && (
            <>
              <div className="wh-greeting">
                <div className="wh-greeting-sub">Job Requests</div>
                <div className="wh-greeting-title">All <span>Requests</span></div>
              </div>

              {loadingRequests ? (
                <div className="wh-loading">Loading requests...</div>
              ) : requests.length === 0 ? (
                <div className="wh-empty">
                  <div className="wh-empty-icon">📭</div>
                  <div>No job requests yet.</div>
                </div>
              ) : (
                <div className="wh-request-list">
                  {requests.map(r => {
                    const s = statusColor(r.status);
                    const isPending = r.status === "pending";
                    return (
                      <div className="wh-request" key={r.request_id}>
                        <div>
                          <div className="wh-request-header">
                            {r.profile_pic
                              ? <img src={`${API_BASE}/static/images/${r.profile_pic}`} alt={r.username} className="wh-request-avatar" />
                              : <div className="wh-request-avatar-placeholder">👤</div>}
                            <div>
                              <div className="wh-request-user">{r.username}</div>
                              <div className="wh-request-meta">{r.email} · {r.phone}</div>
                            </div>
                          </div>
                          <div className="wh-request-desc">{r.description}</div>
                          <div className="wh-request-contact">📞 {r.contact_info}</div>
                        </div>
                        <div className="wh-actions">
                          <div className="wh-status-badge" style={{ background: s.bg, color: s.color, borderColor: s.border }}>
                            {r.status}
                          </div>
                          {isPending && (
                            <>
                              <button className="wh-action-btn accept"
                                disabled={respondingId === r.request_id}
                                onClick={() => respond(r.request_id, "accepted")}>
                                Accept
                              </button>
                              <button className="wh-action-btn decline"
                                disabled={respondingId === r.request_id}
                                onClick={() => respond(r.request_id, "declined")}>
                                Decline
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════════════════
              MY PLANS PAGE
          ══════════════════════════════════════════════════════ */}
          {page === "plans" && (
            <>
              <div className="wh-greeting">
                <div className="wh-greeting-sub">Client Plans</div>
                <div className="wh-greeting-title">My <span>Plans</span></div>
              </div>

              {loadingPlans ? (
                <div className="wh-plans-loading">Loading plans...</div>
              ) : plans.length === 0 ? (
                <div className="wh-empty">
                  <div className="wh-empty-icon">📁</div>
                  <div>You haven't been added to any plans yet.</div>
                </div>
              ) : (
                <>
                  <div className="wh-plans-section-title">
                    Plans You're In &nbsp;
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#333", letterSpacing: 0, fontWeight: 400 }}>
                      {plans.length} total
                    </span>
                  </div>

                  <div className="wh-plans-grid">
                    {plans.map(plan => {
                      const isExpanded = expandedPlan === plan.id;
                      // Other workers in the plan (not the logged-in worker)
                      const coWorkers = (plan.workers || []).filter(w => w.id !== worker?.id);
                      const me = (plan.workers || []).find(w => w.id === worker?.id);

                      return (
                        <div
                          key={plan.id}
                          className={`wh-plan-card ${isExpanded ? "expanded" : ""}`}
                          onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                        >
                          {/* Card top */}
                          <div className="wh-plan-card-top">
                            <div>
                              <div className="wh-plan-name">{plan.name}</div>
                              <div className="wh-plan-meta">
                                Created {formatDate(plan.createdAt)} &nbsp;·&nbsp;
                                {(plan.workers || []).length} worker{(plan.workers || []).length !== 1 ? "s" : ""}
                              </div>
                            </div>
                            <div className="wh-plan-chevron">▼</div>
                          </div>

                          {/* Client mini footer */}
                          {plan.client && (
                            <div className="wh-plan-footer" onClick={e => e.stopPropagation()}>
                              <div className="wh-plan-client-avatar">
                                {plan.client.profile_pic
                                  ? <img src={`${API_BASE}/static/images/${plan.client.profile_pic}`} alt={plan.client.username} />
                                  : (plan.client.username?.[0] || "C").toUpperCase()}
                              </div>
                              <div>
                                <div className="wh-plan-client-label">Client</div>
                                <div className="wh-plan-client-name">{plan.client.username}</div>
                              </div>
                            </div>
                          )}

                          {/* Expanded detail */}
                          {isExpanded && (
                            <div className="wh-plan-detail" onClick={e => e.stopPropagation()}>

                              {/* Client contact rows */}
                              {plan.client?.email && (
                                <div className="wh-plan-detail-row">
                                  <span className="wh-plan-detail-icon">✉</span>
                                  <span className="wh-plan-detail-label">Email</span>
                                  <span className="wh-plan-detail-val">{plan.client.email}</span>
                                </div>
                              )}
                              {plan.client?.phone && (
                                <div className="wh-plan-detail-row">
                                  <span className="wh-plan-detail-icon">📞</span>
                                  <span className="wh-plan-detail-label">Phone</span>
                                  <span className="wh-plan-detail-val">{plan.client.phone}</span>
                                </div>
                              )}
                              <div className="wh-plan-detail-row">
                                <span className="wh-plan-detail-icon">🗓</span>
                                <span className="wh-plan-detail-label">Added</span>
                                <span className="wh-plan-detail-val">{formatDate(plan.createdAt)}</span>
                              </div>

                              {/* Co-workers */}
                              {(plan.workers || []).length > 0 && (
                                <>
                                  <div className="wh-plan-coworkers-title">
                                    Workers in this plan
                                  </div>
                                  <div className="wh-plan-coworkers">
                                    {/* Show "You" chip first */}
                                    {me && (
                                      <div className="wh-plan-coworker-chip me">
                                        <div className="wh-plan-coworker-chip-av">
                                          {me.profile_pic
                                            ? <img src={`${API_BASE}/static/images/${me.profile_pic}`} alt={me.username} />
                                            : (me.username?.[0] || "W").toUpperCase()}
                                        </div>
                                        You
                                      </div>
                                    )}
                                    {coWorkers.map(w => (
                                      <div className="wh-plan-coworker-chip" key={w.id}>
                                        <div className="wh-plan-coworker-chip-av">
                                          {w.profile_pic
                                            ? <img src={`${API_BASE}/static/images/${w.profile_pic}`} alt={w.username} />
                                            : (w.username?.[0] || "W").toUpperCase()}
                                        </div>
                                        {w.username}
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── PROFILE (legacy inline view, kept intact) ── */}
          {page === "profile" && worker && (
            <>
              <div className="wh-greeting">
                <div className="wh-greeting-sub">My Profile</div>
                <div className="wh-greeting-title"><span>{worker.username}</span>'s Profile</div>
              </div>
              <div className="wh-profile-card">
                <div className="wh-profile-banner" />
                <div className="wh-profile-body">
                  <div className="wh-profile-pic-wrap">
                    {worker.profile_pic
                      ? <img src={`${API_BASE}/static/images/${worker.profile_pic}`} alt={worker.username} className="wh-profile-pic" />
                      : <div className="wh-profile-pic-placeholder">👷</div>}
                  </div>
                  <div className="wh-profile-name">{worker.username}</div>
                  {worker.work && <div className="wh-profile-trade">{worker.work}</div>}
                  <div className="wh-profile-fields">
                    {[
                      { label: "Email",      value: worker.email || "—" },
                      { label: "Phone",      value: worker.phone || "—" },
                      { label: "Trade",      value: worker.work  || "—" },
                      { label: "Account ID", value: `#${worker.id || "—"}` },
                    ].map(f => (
                      <div key={f.label}>
                        <div className="wh-profile-field-label">{f.label}</div>
                        <div className="wh-profile-field-value">{f.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

        </div>{/* end wh-body */}
      </div>{/* end wh-layout */}

      {toast && <div className={`wh-toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
