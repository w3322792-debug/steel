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
  { label: "Machinist",      icon: "🛠️", value: "Machinist" },
  { label: "Pipe Fitter",    icon: "🔩", value: "Pipe Fitter" },
  { label: "Structural Eng", icon: "📐", value: "Structural Engineer" },
];

const NAV = [
  { label: "Home",          icon: "🏠", path: "/home" },
  { label: "View Plans",    icon: "📋", path: "/view-plans" },
  { label: "Add Plan",      icon: "➕", path: "/add-plan" },
  { label: "Sent Requests", icon: "📤", path: "/sent-requests" },
  { label: "View Replies",  icon: "💬", path: "/view-replies" },
  { label: "My Profile",    icon: "👤", path: "/user-profile" },
];

export default function AddPlan() {
  const [user, setUser]         = useState(null);
  const [planName, setPlanName] = useState("");
  const [workers, setWorkers]   = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const showToast = (msg, type) => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };
  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token  = localStorage.getItem("token");
    if (!stored || !token) { navigate("/signup-as"); return; }
    try { setUser(JSON.parse(stored)); } catch { navigate("/signup-as"); return; }
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
      const res  = await fetch(`${API_BASE}/api/user/workers`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setWorkers(Array.isArray(json) ? json : []);
      setFiltered(Array.isArray(json) ? json : []);
    } catch {
      showToast("Could not load workers.", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleWorker = (worker) => {
    const already = selected.find(w => w.id === worker.id);
    setSelected(already ? selected.filter(w => w.id !== worker.id) : [...selected, worker]);
  };

  const isSelected = (id) => selected.some(w => w.id === id);

  const savePlan = async () => {
    if (!planName.trim())      { showToast("Please enter a plan name.", "error"); return; }
    if (selected.length === 0) { showToast("Add at least one worker to the plan.", "error"); return; }

    setSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/api/user/plans`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ name: planName.trim(), worker_ids: selected.map(w => w.id) }),
      });
      const json = await res.json();
      if (res.ok) {
        showToast("Plan saved!", "success");
        setTimeout(() => navigate("/view-plans"), 900);
      } else {
        showToast(json.error || "Failed to save plan.", "error");
      }
    } catch {
      showToast("Could not reach the server.", "error");
    } finally {
      setSaving(false);
    }
  };

  const signOut = () => { localStorage.clear(); navigate("/signup-as"); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0a0a0a !important; }
        .ap-root { display: flex; min-height: 100vh; background: #0a0a0a; font-family: 'DM Sans', sans-serif; color: #e0e0e0; }
        .ap-sidebar { width: 240px; min-height: 100vh; background: #0d0d0d; border-right: 1px solid #1a1a1a; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow-y: auto; flex-shrink: 0; z-index: 100; transition: transform 0.25s ease; }
        .ap-sidebar-logo { font-family: 'Bebas Neue', sans-serif; font-size: 26px; color: #c89633; letter-spacing: 3px; padding: 24px 20px 18px; border-bottom: 1px solid #1a1a1a; }
        .ap-sidebar-logo span { display: block; font-size: 10px; color: #2a2a2a; letter-spacing: 2px; font-family: 'DM Sans', sans-serif; margin-top: 3px; text-transform: uppercase; }
        .ap-sidebar-user { padding: 14px 20px; border-bottom: 1px solid #1a1a1a; display: flex; align-items: center; gap: 10px; }
        .ap-avatar { width: 36px; height: 36px; border-radius: 50%; background: #1a1a1a; border: 1px solid #c89633; display: flex; align-items: center; justify-content: center; font-family: 'Bebas Neue', sans-serif; font-size: 16px; color: #c89633; flex-shrink: 0; overflow: hidden; }
        .ap-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .ap-sidebar-name { font-size: 13px; font-weight: 500; color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ap-sidebar-role { font-size: 10px; color: #333; text-transform: uppercase; letter-spacing: 1px; }
        .ap-sidebar-nav { flex: 1; padding: 16px 0; }
        .ap-nav-label { font-size: 9px; color: #222; letter-spacing: 2px; text-transform: uppercase; padding: 10px 20px 6px; }
        .ap-nav-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 20px; background: transparent; border: none; border-left: 3px solid transparent; color: #3a3a3a; font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; transition: all 0.15s; text-align: left; }
        .ap-nav-btn:hover, .ap-nav-btn.active { color: #c89633; background: #121200; border-left-color: #c89633; }
        .ap-nav-icon { font-size: 16px; width: 20px; text-align: center; }
        .ap-sidebar-bottom { padding: 14px 12px; border-top: 1px solid #1a1a1a; }
        .ap-signout { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: transparent; border: 1px solid #1e1e1e; border-radius: 3px; color: #444; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .ap-signout:hover { border-color: #e07070; color: #e07070; background: #1f0d0d; }
        .ap-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .ap-topbar { background: #0d0d0d; border-bottom: 1px solid #1a1a1a; padding: 0 28px; height: 56px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; }
        .ap-topbar-title { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: #e8e8e8; letter-spacing: 2px; }
        .ap-mobile-btn { display: none; background: transparent; border: 1px solid #1e1e1e; color: #c89633; font-size: 18px; width: 36px; height: 36px; border-radius: 3px; cursor: pointer; align-items: center; justify-content: center; }
        .ap-content { padding: 28px 28px 60px; }
        .ap-plan-name-wrap { margin-bottom: 32px; }
        .ap-plan-name-label { font-size: 10px; color: #555; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; display: block; }
        .ap-plan-name-input { width: 100%; background: #111; border: 1px solid #1e1e1e; border-radius: 4px; padding: 14px 18px; color: #e0e0e0; font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 2px; outline: none; transition: border-color 0.2s; }
        .ap-plan-name-input:focus { border-color: #c89633; }
        .ap-plan-name-input::placeholder { color: #2a2a2a; }
        .ap-selected-bar { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; }
        .ap-selected-bar-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .ap-selected-bar-title { font-family: 'Bebas Neue', sans-serif; font-size: 16px; color: #c89633; letter-spacing: 2px; }
        .ap-selected-count { font-size: 12px; color: #444; }
        .ap-selected-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .ap-chip { display: flex; align-items: center; gap: 6px; padding: 5px 10px; background: #1a1a0a; border: 1px solid #c89633; border-radius: 20px; font-size: 12px; color: #c89633; }
        .ap-chip-remove { background: transparent; border: none; color: #c89633; cursor: pointer; font-size: 14px; line-height: 1; padding: 0; opacity: 0.6; transition: opacity 0.15s; }
        .ap-chip-remove:hover { opacity: 1; }
        .ap-selected-empty { font-size: 13px; color: #2a2a2a; font-style: italic; }
        .ap-save-btn { margin-bottom: 28px; padding: 13px 32px; background: #c89633; color: #0a0a0a; border: none; border-radius: 3px; font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 2px; cursor: pointer; transition: opacity 0.2s, transform 0.1s; }
        .ap-save-btn:hover { opacity: 0.88; }
        .ap-save-btn:active { transform: scale(0.98); }
        .ap-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ap-search-wrap { position: relative; margin-bottom: 20px; }
        .ap-search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 16px; color: #333; pointer-events: none; }
        .ap-search { width: 100%; background: #111; border: 1px solid #1e1e1e; border-radius: 4px; padding: 13px 16px 13px 44px; color: #e0e0e0; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s; }
        .ap-search:focus { border-color: #c89633; }
        .ap-search::placeholder { color: #2a2a2a; }
        .ap-cats { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
        .ap-cat { padding: 7px 14px; border-radius: 20px; border: 1px solid #1e1e1e; background: transparent; color: #444; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; transition: all 0.15s; }
        .ap-cat:hover { border-color: #c89633; color: #c89633; }
        .ap-cat.active { background: #c89633; color: #0a0a0a; border-color: #c89633; font-weight: 500; }
        .ap-section-title { font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: #555; letter-spacing: 2px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
        .ap-section-title::after { content: ''; flex: 1; height: 1px; background: #1a1a1a; }
        .ap-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
        .ap-worker-card { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 4px; padding: 20px; transition: border-color 0.2s, transform 0.2s; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .ap-worker-card.in-plan { border-color: #c89633; background: #0d0d05; }
        .ap-worker-card:hover { border-color: #2a2a2a; transform: translateY(-2px); }
        .ap-worker-card.in-plan:hover { border-color: #c89633; }
        .ap-worker-pic { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 2px solid #c89633; margin-bottom: 12px; }
        .ap-worker-pic-placeholder { width: 72px; height: 72px; border-radius: 50%; background: #1a1a1a; border: 2px solid #1e1e1e; display: flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 12px; }
        .ap-worker-name { font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: #e8e8e8; letter-spacing: 1px; margin-bottom: 4px; }
        .ap-worker-trade { font-size: 11px; color: #c89633; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .ap-worker-contact { font-size: 12px; color: #333; line-height: 1.7; margin-bottom: 14px; }
        .ap-add-btn { width: 100%; padding: 9px; border-radius: 3px; border: 1px solid #c89633; background: transparent; color: #c89633; font-family: 'Bebas Neue', sans-serif; font-size: 15px; letter-spacing: 1.5px; cursor: pointer; transition: all 0.15s; }
        .ap-add-btn:hover { background: #c89633; color: #0a0a0a; }
        .ap-add-btn.added { background: #c89633; color: #0a0a0a; }
        .ap-add-btn.added:hover { background: #a07820; border-color: #a07820; }
        .ap-loading { color: #2a2a2a; font-size: 14px; text-align: center; padding: 60px; }
        .ap-empty { text-align: center; padding: 60px 20px; color: #2a2a2a; font-size: 14px; }
        .ap-toast { position: fixed; bottom: 28px; right: 28px; padding: 12px 20px; border-radius: 4px; font-size: 13px; z-index: 500; animation: slideUp 0.3s ease; }
        .ap-toast.success { background: #0d1f0d; color: #4caf65; border: 1px solid #143314; }
        .ap-toast.error { background: #1f0d0d; color: #e07070; border: 1px solid #331414; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .ap-mob-overlay { display: none; position: fixed; inset: 0; background: #000a; z-index: 99; }
        @media (max-width: 768px) {
          .ap-sidebar { position: fixed; top: 0; left: 0; transform: translateX(-100%); }
          .ap-sidebar.open { transform: translateX(0); }
          .ap-mob-overlay { display: block; }
          .ap-mob-overlay.open { opacity: 1; pointer-events: auto; }
          .ap-mobile-btn { display: flex; }
          .ap-content { padding: 20px 16px 80px; }
        }
      `}</style>

      <div className={`ap-mob-overlay ${mobileOpen ? "open" : ""}`}
        style={{ opacity: mobileOpen ? 1 : 0, pointerEvents: mobileOpen ? "auto" : "none" }}
        onClick={() => setMobileOpen(false)} />

      <div className="ap-root">
        <aside className={`ap-sidebar ${mobileOpen ? "open" : ""}`}>
          <div className="ap-sidebar-logo">SteelSmith<span>Client Portal</span></div>
          <div className="ap-sidebar-user">
            <div className="ap-avatar">
              {user?.profile_pic
                ? <img src={`${API_BASE}/static/images/${user.profile_pic}`} alt={user?.username} />
                : (user?.username?.[0] || "U").toUpperCase()}
            </div>
            <div>
              <div className="ap-sidebar-name">{user?.username || "User"}</div>
              <div className="ap-sidebar-role">Client</div>
            </div>
          </div>
          <nav className="ap-sidebar-nav">
            <div className="ap-nav-label">Menu</div>
            {NAV.map(item => (
              <button key={item.path} className={`ap-nav-btn ${item.path === "/add-plan" ? "active" : ""}`}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}>
                <span className="ap-nav-icon">{item.icon}</span>{item.label}
              </button>
            ))}
          </nav>
          <div className="ap-sidebar-bottom">
            <button className="ap-signout" onClick={signOut}>🚪 Sign Out</button>
          </div>
        </aside>

        <div className="ap-main">
          <div className="ap-topbar">
            <button className="ap-mobile-btn" onClick={() => setMobileOpen(true)}>☰</button>
            <div className="ap-topbar-title">Add Plan</div>
            <div style={{ fontSize: 12, color: "#333" }}>{selected.length} worker{selected.length !== 1 ? "s" : ""} selected</div>
          </div>

          <div className="ap-content">
            <div className="ap-plan-name-wrap">
              <label className="ap-plan-name-label">Plan Name</label>
              <input className="ap-plan-name-input" placeholder="E.G. BRIDGE PROJECT PHASE 1..."
                value={planName} onChange={e => setPlanName(e.target.value)} />
            </div>

            <div className="ap-selected-bar">
              <div className="ap-selected-bar-header">
                <span className="ap-selected-bar-title">Workers in this plan</span>
                <span className="ap-selected-count">{selected.length} added</span>
              </div>
              {selected.length === 0
                ? <div className="ap-selected-empty">No workers added yet. Browse below and click "+ Add to Plan".</div>
                : <div className="ap-selected-chips">
                    {selected.map(w => (
                      <div className="ap-chip" key={w.id}>
                        👷 {w.username}
                        <button className="ap-chip-remove" onClick={() => toggleWorker(w)}>×</button>
                      </div>
                    ))}
                  </div>}
            </div>

            <button className="ap-save-btn" onClick={savePlan} disabled={saving}>
              {saving ? "Saving..." : "Save Plan →"}
            </button>

            <div className="ap-search-wrap">
              <span className="ap-search-icon">🔍</span>
              <input className="ap-search" placeholder="Search by name or trade..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="ap-cats">
              {CATEGORIES.map(c => (
                <button key={c.value} className={`ap-cat ${category === c.value ? "active" : ""}`}
                  onClick={() => setCategory(c.value)}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>

            <div className="ap-section-title">{category || "All Workers"}</div>

            {loading ? (
              <div className="ap-loading">Loading workers...</div>
            ) : filtered.length === 0 ? (
              <div className="ap-empty">No workers found.</div>
            ) : (
              <div className="ap-grid">
                {filtered.map(w => (
                  <div className={`ap-worker-card ${isSelected(w.id) ? "in-plan" : ""}`} key={w.id}>
                    {w.profile_pic
                      ? <img src={`${API_BASE}/static/images/${w.profile_pic}`} alt={w.username} className="ap-worker-pic" />
                      : <div className="ap-worker-pic-placeholder">👷</div>}
                    <div className="ap-worker-name">{w.username}</div>
                    {w.work && <div className="ap-worker-trade">{w.work}</div>}
                    <div className="ap-worker-contact">
                      {w.email && <div>✉ {w.email}</div>}
                      {w.phone && <div>📞 {w.phone}</div>}
                    </div>
                    <button className={`ap-add-btn ${isSelected(w.id) ? "added" : ""}`}
                      onClick={() => toggleWorker(w)}>
                      {isSelected(w.id) ? "✓ Added — Remove" : "+ Add to Plan"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <div className={`ap-toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
}
