import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { apiUrl } from "../components/apiClient";
const API_BASE = apiUrl("");

const CATEGORIES = [
  { label: "All",            icon: "🔧", value: "" },
  { label: "Welder",         icon: "🔥", value: "Welder" },
  { label: "Fabricator",     icon: "⚙️", value: "Fabricator" },
  { label: "Blacksmith",     icon: "🔨", value: "Blacksmith" },
  { label: "Metalworker",    icon: "🪛", value: "Metalworker" },
  { label: "Steel Fixer",    icon: "🏗️", value: "Steel Fixer" },
  { label: "Machinist",      icon: "🛠️", value: "Machinist" },
  { label: "Pipe Fitter",    icon: "🔩", value: "Pipe Fitter" },
  { label: "Structural Eng", icon: "📐", value: "Structural Engineer" },
];

export default function UserHome() {
  const [user, setUser]           = useState(null);
  const [workers, setWorkers]     = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("");
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);
  const [reqModal, setReqModal]   = useState(null); // worker to send request to
  const [reqForm, setReqForm]     = useState({ description: "", contact_info: "" });
  const [sending, setSending]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileModal, setProfileModal] = useState(null); // worker whose profile is open
  const [workPics, setWorkPics]         = useState([]);
  const [picsLoading, setPicsLoading]   = useState(false);
  const [lightbox, setLightbox]         = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token  = localStorage.getItem("token");
    if (!stored || !token) { navigate("/signup-as"); return; }
    try {
      const parsed = JSON.parse(stored);
      if (!parsed || typeof parsed !== "object") throw new Error("Invalid user data");
      setUser(parsed);
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/signup-as");
      return;
    }
    fetchWorkers(token);
  }, []);

  useEffect(() => {
    let result = workers;
    if (category) result = result.filter(w => w.work === category);
    if (search)   result = result.filter(w =>
      w.username.toLowerCase().includes(search.toLowerCase()) ||
      (w.work || "").toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, category, workers]);

  const fetchWorkers = async (token) => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/user/workers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setWorkers(Array.isArray(json) ? json : []);
      setFiltered(Array.isArray(json) ? json : []);
    } catch {
      showToast("Could not load workers.", "error");
    } finally {
      setLoading(false);
    }
  };

  const openProfile = async (worker) => {
    setProfileModal(worker);
    setWorkPics([]);
    setPicsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res  = await fetch(`${API_BASE}/api/worker/work_pics/view/${worker.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setWorkPics(json.pics || json || []);
    } catch {
      setWorkPics([]);
    } finally {
      setPicsLoading(false);
    }
  };

  const sendRequest = async () => {
    if (!reqForm.description || !reqForm.contact_info) {
      showToast("Please fill in all fields.", "error"); return;
    }
    setSending(true);
    const token = localStorage.getItem("token");
    const data  = new FormData();
    data.append("worker_id",   reqModal.id);
    data.append("description", reqForm.description);
    data.append("contact_info", reqForm.contact_info);
    try {
      const res  = await fetch(`${API_BASE}/api/user/send_request`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      const json = await res.json();
      if (res.ok) {
        showToast("Request sent successfully!", "success");
        setReqModal(null);
        setReqForm({ description: "", contact_info: "" });
      } else {
        showToast(json.error || "Failed to send request.", "error");
      }
    } catch {
      showToast("Could not reach server.", "error");
    } finally {
      setSending(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const signOut = () => {
    localStorage.clear();
    navigate("/signup-as");
  };

  const NAV = [
    { label: "View Plans",     icon: "📋", path: "/view-plans" },
    { label: "Add Plan",       icon: "➕", path: "/add-plan" },
    { label: "Sent Requests",  icon: "📤", path: "/sent-requests" },
    { label: "View Replies",   icon: "💬", path: "/view-replies" },
    { label: "My Profile",     icon: "👤", path: "/user-profile" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0a0a0a !important; margin: 0; }

        .uh-root {
          display: flex;
          min-height: 100vh;
          background: #0a0a0a;
          font-family: 'DM Sans', sans-serif;
          color: #e0e0e0;
        }

        /* ── SIDEBAR ── */
        .uh-sidebar {
          width: 240px;
          min-height: 100vh;
          background: #0d0d0d;
          border-right: 1px solid #1a1a1a;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          flex-shrink: 0;
          z-index: 100;
          transition: transform 0.25s ease;
        }

        .uh-sidebar-logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 26px;
          color: #c89633;
          letter-spacing: 3px;
          padding: 24px 20px 18px;
          border-bottom: 1px solid #1a1a1a;
        }

        .uh-sidebar-logo span {
          display: block;
          font-size: 10px;
          color: #2a2a2a;
          letter-spacing: 2px;
          font-family: 'DM Sans', sans-serif;
          margin-top: 3px;
          text-transform: uppercase;
        }

        .uh-sidebar-user {
          padding: 14px 20px;
          border-bottom: 1px solid #1a1a1a;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .uh-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: #1a1a1a;
          border: 1px solid #c89633;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          color: #c89633;
          flex-shrink: 0;
          overflow: hidden;
        }

        .uh-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .uh-sidebar-name {
          font-size: 13px;
          font-weight: 500;
          color: #ccc;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .uh-sidebar-role {
          font-size: 10px;
          color: #333;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .uh-sidebar-nav {
          flex: 1;
          padding: 16px 0;
        }

        .uh-nav-label {
          font-size: 9px;
          color: #222;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 10px 20px 6px;
        }

        .uh-nav-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 11px 20px;
          background: transparent;
          border: none;
          border-left: 3px solid transparent;
          color: #3a3a3a;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
        }

        .uh-nav-btn:hover {
          color: #c89633;
          background: #121200;
          border-left-color: #c89633;
        }

        .uh-nav-icon { font-size: 16px; width: 20px; text-align: center; }

        .uh-sidebar-bottom {
          padding: 14px 12px;
          border-top: 1px solid #1a1a1a;
        }

        .uh-signout {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: transparent;
          border: 1px solid #1e1e1e;
          border-radius: 3px;
          color: #444;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .uh-signout:hover { border-color: #e07070; color: #e07070; background: #1f0d0d; }

        /* ── MAIN ── */
        .uh-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .uh-topbar {
          background: #0d0d0d;
          border-bottom: 1px solid #1a1a1a;
          padding: 0 28px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .uh-topbar-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 20px;
          color: #e8e8e8;
          letter-spacing: 2px;
        }

        .uh-mobile-btn {
          display: none;
          background: transparent;
          border: 1px solid #1e1e1e;
          color: #c89633;
          font-size: 18px;
          width: 36px; height: 36px;
          border-radius: 3px;
          cursor: pointer;
          align-items: center;
          justify-content: center;
        }

        /* ── CONTENT ── */
        .uh-content { padding: 28px 28px 60px; }

        /* Search bar */
        .uh-search-wrap {
          position: relative;
          margin-bottom: 28px;
        }

        .uh-search-icon {
          position: absolute;
          left: 16px; top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
          color: #333;
          pointer-events: none;
        }

        .uh-search {
          width: 100%;
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 4px;
          padding: 14px 16px 14px 44px;
          color: #e0e0e0;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .uh-search:focus { border-color: #c89633; }
        .uh-search::placeholder { color: #2a2a2a; }

        /* Category chips */
        .uh-cats {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }

        .uh-cat {
          padding: 7px 14px;
          border-radius: 20px;
          border: 1px solid #1e1e1e;
          background: transparent;
          color: #444;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .uh-cat:hover { border-color: #c89633; color: #c89633; }
        .uh-cat.active { background: #c89633; color: #0a0a0a; border-color: #c89633; font-weight: 500; }

        /* Section title */
        .uh-section-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px;
          color: #555;
          letter-spacing: 2px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .uh-section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #1a1a1a;
        }

        /* Worker grid */
        .uh-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
        }

        .uh-worker-card {
          background: #0d0d0d;
          border: 1px solid #1a1a1a;
          border-radius: 4px;
          padding: 20px;
          transition: border-color 0.2s, transform 0.2s;
          cursor: default;
        }

        .uh-worker-card:hover {
          border-color: #2a2a2a;
          transform: translateY(-2px);
        }

        .uh-worker-pic {
          width: 56px; height: 56px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #1e1e1e;
          margin-bottom: 12px;
          background: #1a1a1a;
        }

        .uh-worker-pic-placeholder {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: #1a1a1a;
          border: 2px solid #1e1e1e;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          margin-bottom: 12px;
        }

        .uh-worker-name {
          font-size: 15px;
          font-weight: 500;
          color: #e0e0e0;
          margin-bottom: 4px;
        }

        .uh-worker-trade {
          font-size: 11px;
          color: #c89633;
          background: #1a1200;
          border: 1px solid #2a2000;
          padding: 2px 8px;
          border-radius: 20px;
          display: inline-block;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .uh-worker-contact {
          font-size: 12px;
          color: #333;
          margin-bottom: 14px;
          line-height: 1.6;
        }

        .uh-hire-btn {
          width: 100%;
          padding: 9px;
          border: 1px solid #c89633;
          border-radius: 3px;
          background: transparent;
          color: #c89633;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 15px;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .uh-hire-btn:hover { background: #c89633; color: #0a0a0a; }

        /* Empty state */
        .uh-empty {
          text-align: center;
          padding: 60px;
          color: #222;
        }

        .uh-empty-icon { font-size: 40px; margin-bottom: 12px; }

        /* Loading */
        .uh-loading {
          text-align: center;
          padding: 60px;
          color: #222;
          font-size: 12px;
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        /* ── REQUEST MODAL ── */
        .uh-overlay {
          position: fixed;
          inset: 0;
          background: #000c;
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .uh-modal {
          background: #111;
          border: 1px solid #2a2a2a;
          border-radius: 4px;
          width: 100%;
          max-width: 460px;
          padding: 28px;
        }

        .uh-modal-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 24px;
          color: #e8e8e8;
          letter-spacing: 1.5px;
          margin-bottom: 6px;
        }

        .uh-modal-sub {
          font-size: 13px;
          color: #444;
          margin-bottom: 20px;
        }

        .uh-modal-field { margin-bottom: 16px; }

        .uh-modal-label {
          display: block;
          font-size: 10px;
          color: #444;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .uh-modal-input {
          width: 100%;
          background: #0d0d0d;
          border: 1px solid #1e1e1e;
          border-radius: 3px;
          padding: 11px 14px;
          color: #e0e0e0;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
          resize: vertical;
        }

        .uh-modal-input:focus { border-color: #c89633; }

        .uh-modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .uh-modal-send {
          flex: 1;
          padding: 12px;
          background: #c89633;
          color: #0a0a0a;
          border: none;
          border-radius: 3px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .uh-modal-send:disabled { opacity: 0.5; cursor: not-allowed; }
        .uh-modal-send:hover { opacity: 0.9; }

        .uh-modal-cancel {
          padding: 12px 20px;
          background: transparent;
          border: 1px solid #2a2a2a;
          border-radius: 3px;
          color: #555;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .uh-modal-cancel:hover { border-color: #555; color: #aaa; }

        /* ── TOAST ── */
        .uh-toast {
          position: fixed;
          bottom: 28px; right: 28px;
          padding: 12px 20px;
          border-radius: 4px;
          font-size: 13px;
          z-index: 500;
          animation: slideUp 0.3s ease;
        }

        .uh-toast.success { background: #0d1f0d; color: #4caf65; border: 1px solid #143314; }
        .uh-toast.error   { background: #1f0d0d; color: #e07070; border: 1px solid #331414; }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }


        /* ── PROFILE MODAL ── */
        .uh-profile-overlay {
          position: fixed; inset: 0; background: #000d;
          z-index: 300; display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .uh-profile-modal {
          background: #111; border: 1px solid #2a2a2a; border-radius: 4px;
          width: 100%; max-width: 680px; max-height: 90vh;
          display: flex; flex-direction: column; overflow: hidden;
        }
        .uh-profile-modal-header {
          background: #c89633; padding: 20px 24px;
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .uh-profile-modal-title {
          font-family: "Bebas Neue", sans-serif; font-size: 24px;
          color: #0a0a0a; letter-spacing: 2px;
        }
        .uh-profile-modal-close {
          background: transparent; border: none; font-size: 20px;
          color: #0a0a0a; cursor: pointer; line-height: 1;
        }
        .uh-profile-modal-body { overflow-y: auto; padding: 24px; flex: 1; }

        .uh-profile-hero {
          display: flex; align-items: center; gap: 20px;
          padding-bottom: 20px; border-bottom: 1px solid #1e1e1e; margin-bottom: 20px;
        }
        .uh-profile-pic-lg {
          width: 80px; height: 80px; border-radius: 50%; object-fit: cover;
          border: 3px solid #c89633; flex-shrink: 0;
        }
        .uh-profile-pic-placeholder {
          width: 80px; height: 80px; border-radius: 50%; background: #1a1a1a;
          border: 3px solid #c89633; display: flex; align-items: center;
          justify-content: center; font-size: 32px; flex-shrink: 0;
        }
        .uh-profile-name {
          font-family: "Bebas Neue", sans-serif; font-size: 28px;
          color: #e8e8e8; letter-spacing: 2px; line-height: 1;
        }
        .uh-profile-trade {
          font-size: 11px; color: #c89633; text-transform: uppercase;
          letter-spacing: 1.5px; margin-top: 4px;
        }
        .uh-profile-contact { font-size: 13px; color: #444; margin-top: 6px; line-height: 1.7; }

        .uh-profile-section-label {
          font-size: 10px; color: #c89633; letter-spacing: 3px;
          text-transform: uppercase; margin-bottom: 12px; margin-top: 20px;
        }

        .uh-work-pics-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 10px;
        }
        .uh-work-pic-thumb {
          aspect-ratio: 1; border-radius: 3px; object-fit: cover;
          border: 1px solid #1e1e1e; cursor: pointer; width: 100%;
          transition: border-color 0.2s, transform 0.2s;
        }
        .uh-work-pic-thumb:hover { border-color: #c89633; transform: scale(1.02); }

        .uh-profile-modal-footer {
          padding: 16px 24px; border-top: 1px solid #1a1a1a;
          display: flex; gap: 10px; flex-shrink: 0; background: #0d0d0d;
        }
        .uh-profile-hire-btn {
          flex: 1; padding: 12px; background: #c89633; color: #0a0a0a;
          border: none; border-radius: 3px; font-family: "Bebas Neue", sans-serif;
          font-size: 18px; letter-spacing: 1.5px; cursor: pointer; transition: opacity 0.2s;
        }
        .uh-profile-hire-btn:hover { opacity: 0.9; }

        /* Lightbox */
        .uh-lightbox {
          position: fixed; inset: 0; background: #000e; z-index: 600;
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .uh-lightbox img {
          max-width: 90vw; max-height: 90vh; border-radius: 4px; object-fit: contain;
        }
        .uh-lightbox-close {
          position: absolute; top: 20px; right: 24px; background: transparent;
          border: none; color: #fff; font-size: 28px; cursor: pointer;
        }

        /* Mobile */
        .uh-mob-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: #000a;
          z-index: 99;
        }

        @media (max-width: 768px) {
          .uh-sidebar {
            position: fixed;
            top: 0; left: 0;
            transform: translateX(-100%);
            width: 240px !important;
          }
          .uh-sidebar.open { transform: translateX(0); }
          .uh-mob-overlay { display: block; }
          .uh-mob-overlay.open { display: block; opacity: 1; pointer-events: auto; }
          .uh-mobile-btn { display: flex; }
          .uh-content { padding: 20px 16px 60px; }
        }
      `}</style>

      {/* SIDEBAR MOBILE OVERLAY */}
      <div
        className={`uh-mob-overlay ${mobileOpen ? "open" : ""}`}
        style={{ opacity: mobileOpen ? 1 : 0, pointerEvents: mobileOpen ? "auto" : "none" }}
        onClick={() => setMobileOpen(false)}
      />

      <div className="uh-root">
        {/* SIDEBAR */}
        <aside className={`uh-sidebar ${mobileOpen ? "open" : ""}`}>
          <div className="uh-sidebar-logo">
            SteelSmith
            <span>Client Portal</span>
          </div>

          <div className="uh-sidebar-user">
            <div className="uh-avatar">
              {user?.profile_pic
                ? <img src={`${API_BASE}/static/images/${user.profile_pic}`} alt={user.username} />
                : (user?.username?.[0] || "U").toUpperCase()
              }
            </div>
            <div>
              <div className="uh-sidebar-name">{user?.username || "User"}</div>
              <div className="uh-sidebar-role">Client</div>
            </div>
          </div>

          <nav className="uh-sidebar-nav">
            <div className="uh-nav-label">Menu</div>
            {NAV.map(item => (
              <button
                key={item.path}
                className="uh-nav-btn"
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
              >
                <span className="uh-nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="uh-sidebar-bottom">
            <button className="uh-signout" onClick={signOut}>
              🚪 Sign Out
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="uh-main">
          <div className="uh-topbar">
            <button className="uh-mobile-btn" onClick={() => setMobileOpen(true)}>☰</button>
            <div className="uh-topbar-title">Browse Workers</div>
            <div style={{ fontSize: 12, color: "#333" }}>
              {filtered.length} worker{filtered.length !== 1 ? "s" : ""} found
            </div>
          </div>

          <div className="uh-content">
            {/* Search */}
            <div className="uh-search-wrap">
              <span className="uh-search-icon">🔍</span>
              <input
                className="uh-search"
                placeholder="Search by name or trade..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Category chips */}
            <div className="uh-cats">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  className={`uh-cat ${category === c.value ? "active" : ""}`}
                  onClick={() => setCategory(c.value)}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>

            {/* Section title */}
            <div className="uh-section-title">
              {category || "All Workers"}
            </div>

            {/* Workers grid */}
            {loading ? (
              <div className="uh-loading">Loading workers...</div>
            ) : filtered.length === 0 ? (
              <div className="uh-empty">
                <div className="uh-empty-icon">🔍</div>
                <div>No workers found for this search.</div>
              </div>
            ) : (
              <div className="uh-grid">
                {filtered.map(w => (
                  <div className="uh-worker-card" key={w.id}>
                    {w.profile_pic
                      ? <img
                          src={`${API_BASE}/static/images/${w.profile_pic}`}
                          alt={w.username}
                          className="uh-worker-pic"
                        />
                      : <div className="uh-worker-pic-placeholder">👷</div>
                    }
                    <div className="uh-worker-name">{w.username}</div>
                    {w.work && <div className="uh-worker-trade">{w.work}</div>}
                    <div className="uh-worker-contact">
                      {w.email && <div>✉ {w.email}</div>}
                      {w.phone && <div>📞 {w.phone}</div>}
                    </div>
                    <button
                      className="uh-hire-btn"
                      style={{ marginBottom: 8 }}
                      onClick={() => openProfile(w)}
                    >
                      👁 View Profile
                    </button>
                    <button className="uh-hire-btn" onClick={() => setReqModal(w)}>
                      Send Request →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REQUEST MODAL */}
      {reqModal && (
        <div className="uh-overlay" onClick={() => setReqModal(null)}>
          <div className="uh-modal" onClick={e => e.stopPropagation()}>
            <div className="uh-modal-title">Send Request</div>
            <div className="uh-modal-sub">To: {reqModal.username} · {reqModal.work}</div>

            <div className="uh-modal-field">
              <label className="uh-modal-label">Job Description</label>
              <textarea
                className="uh-modal-input"
                rows={4}
                placeholder="Describe the job you need done..."
                value={reqForm.description}
                onChange={e => setReqForm({ ...reqForm, description: e.target.value })}
              />
            </div>

            <div className="uh-modal-field">
              <label className="uh-modal-label">Your Contact Info</label>
              <input
                className="uh-modal-input"
                placeholder="Phone number or email for the worker to reach you"
                value={reqForm.contact_info}
                onChange={e => setReqForm({ ...reqForm, contact_info: e.target.value })}
              />
            </div>

            <div className="uh-modal-actions">
              <button className="uh-modal-cancel" onClick={() => setReqModal(null)}>Cancel</button>
              <button className="uh-modal-send" onClick={sendRequest} disabled={sending}>
                {sending ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE MODAL */}
      {profileModal && (
        <div className="uh-profile-overlay" onClick={() => { setProfileModal(null); setLightbox(null); }}>
          <div className="uh-profile-modal" onClick={e => e.stopPropagation()}>
            <div className="uh-profile-modal-header">
              <div className="uh-profile-modal-title">{profileModal.username}</div>
              <button className="uh-profile-modal-close" onClick={() => setProfileModal(null)}>✕</button>
            </div>

            <div className="uh-profile-modal-body">
              {/* Hero */}
              <div className="uh-profile-hero">
                {profileModal.profile_pic
                  ? <img src={`${API_BASE}/static/images/${profileModal.profile_pic}`} alt={profileModal.username} className="uh-profile-pic-lg" />
                  : <div className="uh-profile-pic-placeholder">👷</div>}
                <div>
                  <div className="uh-profile-name">{profileModal.username}</div>
                  {profileModal.work && <div className="uh-profile-trade">{profileModal.work}</div>}
                  <div className="uh-profile-contact">
                    {profileModal.email && <div>✉ {profileModal.email}</div>}
                    {profileModal.phone && <div>📞 {profileModal.phone}</div>}
                    {profileModal.county && <div>📍 {profileModal.county} County <span style={{ color: "#333" }}>(approximate)</span></div>}
                  </div>
                </div>
              </div>

              {/* Previous Work */}
              <div className="uh-profile-section-label">Previous Work</div>
              {picsLoading ? (
                <div style={{ color: "#333", fontSize: 13, padding: "20px 0" }}>Loading photos...</div>
              ) : workPics.length === 0 ? (
                <div style={{ color: "#2a2a2a", fontSize: 13, padding: "20px 0", fontStyle: "italic" }}>
                  No work photos uploaded yet.
                </div>
              ) : (
                <div className="uh-work-pics-grid">
                  {workPics.map((pic, i) => {
                    const url = pic.url ? pic.url : `${API_BASE}/static/work_pics/${pic.filename || pic.name || pic}`;
                    return (
                      <img
                        key={i}
                        src={url}
                        alt={`Work ${i + 1}`}
                        className="uh-work-pic-thumb"
                        onClick={() => setLightbox(url)}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            <div className="uh-profile-modal-footer">
              <button className="uh-profile-hire-btn" onClick={() => { setReqModal(profileModal); setProfileModal(null); }}>
                Send Request →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox && (
        <div className="uh-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Full size" onClick={e => e.stopPropagation()} />
          <button className="uh-lightbox-close" onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}

      {/* TOAST */}
      {toast && <div className={`uh-toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
}
