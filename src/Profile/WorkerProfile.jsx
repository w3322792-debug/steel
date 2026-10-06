import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { apiUrl } from "../components/apiClient";
const API_BASE = apiUrl("");

// ── helpers ──────────────────────────────────────────────────────────────────
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── sub-components ────────────────────────────────────────────────────────────

function Avatar({ src, size = 72, initials = "?" }) {
  return src ? (
    <img
      src={src}
      alt="avatar"
      style={{
        width: size, height: size, borderRadius: "50%",
        objectFit: "cover", border: "2px solid #c89633", flexShrink: 0,
      }}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "#222", border: "2px solid #c89633",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Bebas Neue', sans-serif", fontSize: size * 0.38,
      color: "#c89633", flexShrink: 0,
    }}>
      {initials[0]?.toUpperCase()}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending:  { bg: "#2a2010", color: "#c89633", label: "Pending" },
    accepted: { bg: "#122a12", color: "#70c070", label: "Accepted" },
    declined: { bg: "#2a1212", color: "#e07070", label: "Declined" },
    completed:{ bg: "#101828", color: "#60a8e0", label: "Completed" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 2, fontSize: 11,
      fontWeight: 500, letterSpacing: 1, textTransform: "uppercase",
      background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
}

// ── TABS ──────────────────────────────────────────────────────────────────────

/* ── 1. MY PROFILE ── */
function MyProfile({ worker, onPhotoChange, onSave }) {
  const fileRef = useRef();
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    username: worker?.username || "",
    email:    worker?.email    || "",
    phone:    worker?.phone    || "",
    work:     worker?.work     || "",
    bio:      worker?.bio      || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (worker) setForm({
      username: worker.username || "",
      email:    worker.email    || "",
      phone:    worker.phone    || "",
      work:     worker.work     || "",
      bio:      worker.bio      || "",
    });
  }, [worker]);

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.append("profilepic", file);
    try {
      const res = await fetch(`${API_BASE}/api/worker/profilepic`, {
        method: "POST",
        headers: authHeaders(),
        body: data,
      });
      const json = await res.json();
      if (res.ok) {
        onPhotoChange(json.profilepic || json.profile_pic || json.url);
        setMsg({ type: "success", text: "Photo updated!" });
      } else {
        setMsg({ type: "error", text: json.error || "Upload failed." });
      }
    } catch {
      setMsg({ type: "error", text: "Could not reach server." });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/worker/profile`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: "Profile saved!" });
        onSave(json.worker || { ...worker, ...form });
        setEdit(false);
      } else {
        setMsg({ type: "error", text: json.error || "Save failed." });
      }
    } catch {
      setMsg({ type: "error", text: "Could not reach server." });
    } finally {
      setSaving(false);
    }
  };

  const WORK_TYPES = ["Welder","Fabricator","Blacksmith","Metalworker","Machinist","Plumbers","Structural Engineer","Painter"];

  return (
    <div>
      {/* Photo + name hero */}
      <div className="wp-profile-hero">
        <div className="wp-photo-wrap">
          <Avatar src={worker?.profile_pic ? `${API_BASE}/static/images/${worker.profile_pic}` : null} size={96} initials={worker?.username} />
          <button
            className="wp-photo-btn"
            onClick={() => fileRef.current.click()}
            disabled={uploading}
            title="Change photo"
          >
            {uploading ? "⏳" : "📷"}
          </button>
          <input ref={fileRef} type="file" accept="image/*"
            style={{ display: "none" }} onChange={handlePhoto} />
        </div>
        <div>
          <div className="wp-hero-name">{worker?.username || "Worker"}</div>
          <div className="wp-hero-trade">{worker?.work || "—"}</div>
          <div className="wp-hero-email">{worker?.email}</div>
        </div>
        <button
          className={`wp-btn-ghost wp-edit-toggle`}
          onClick={() => { setEdit(!edit); setMsg({ type: "", text: "" }); }}
        >
          {edit ? "Cancel" : "✏️ Edit Profile"}
        </button>
      </div>

      {msg.text && (
        <div className={`wp-alert ${msg.type}`}>{msg.text}</div>
      )}

      {edit ? (
        <div className="wp-form">
          {[
            { label: "Username", name: "username" },
            { label: "Email",    name: "email", type: "email" },
            { label: "Phone",    name: "phone" },
          ].map(f => (
            <div className="wp-field" key={f.name}>
              <label className="wp-label">{f.label}</label>
              <input
                className="wp-input"
                type={f.type || "text"}
                value={form[f.name]}
                onChange={e => setForm({ ...form, [f.name]: e.target.value })}
              />
            </div>
          ))}
          <div className="wp-field">
            <label className="wp-label">Trade / Specialisation</label>
            <select className="wp-input" value={form.work}
              onChange={e => setForm({ ...form, work: e.target.value })}>
              <option value="">Select trade...</option>
              {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="wp-field">
            <label className="wp-label">Bio</label>
            <textarea className="wp-input wp-textarea"
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell clients about your experience..."
              rows={3}
            />
          </div>
          <button className="wp-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      ) : (
        <div className="wp-info-grid">
          {[
            { label: "Phone",   value: worker?.phone || "—" },
            { label: "Trade",   value: worker?.work  || "—" },
            { label: "Email",   value: worker?.email || "—" },
            { label: "Member since", value: worker?.createdAt ? new Date(worker.createdAt).toLocaleDateString() : "—" },
          ].map(i => (
            <div className="wp-info-item" key={i.label}>
              <span className="wp-info-label">{i.label}</span>
              <span className="wp-info-value">{i.value}</span>
            </div>
          ))}
          {worker?.bio && (
            <div className="wp-info-item wp-info-full">
              <span className="wp-info-label">Bio</span>
              <span className="wp-info-value">{worker.bio}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── 2. JOB REQUESTS ── */
function JobRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [reply, setReply]       = useState("");
  const [sending, setSending]   = useState(false);
  const [filter, setFilter]     = useState("all");
  const [msg, setMsg]           = useState({ type: "", text: "" });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/my_requests`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      setRequests(json.requests || json || []);
    } catch {
      setMsg({ type: "error", text: "Could not load job requests." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleReply = async (id, action) => {
    setSending(true);
    try {
      const data = new FormData();
      data.append("action", action === "accept" ? "accepted" : "declined");
      const res = await fetch(`${API_BASE}/api/respond_request/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: data,
      });
      const json = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: `Job request ${action}ed!` });
        setReply("");
        setSelected(null);
        fetchRequests();
      } else {
        setMsg({ type: "error", text: json.error || "Reply failed." });
      }
    } catch {
      setMsg({ type: "error", text: "Could not reach server." });
    } finally {
      setSending(false);
    }
  };

  const filtered = filter === "all"
    ? requests
    : requests.filter(r => r.status === filter);

  return (
    <div>
      <div className="wp-section-header">
        <div className="wp-section-title">Job Requests</div>
        <div className="wp-filter-pills">
          {["all","pending","accepted","declined","completed"].map(f => (
            <button key={f}
              className={`wp-pill ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {msg.text && <div className={`wp-alert ${msg.type}`}>{msg.text}</div>}

      {loading ? (
        <div className="wp-empty">Loading requests...</div>
      ) : filtered.length === 0 ? (
        <div className="wp-empty">
          <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
          No {filter !== "all" ? filter : ""} job requests yet.
        </div>
      ) : (
        <div className="wp-request-list">
          {filtered.map(req => (
            <div key={req.id || req._id}
              className={`wp-request-card ${selected?.id === req.id || selected?._id === req._id ? "expanded" : ""}`}>
              <div className="wp-request-header"
                onClick={() => setSelected(
                  (selected?.id === req.id || selected?._id === req._id) ? null : req
                )}>
                <div className="wp-request-left">
                  <Avatar src={req.client?.photo} size={42} initials={req.client?.name || req.clientName || "C"} />
                  <div>
                    <div className="wp-request-client">
                      {req.client?.name || req.clientName || "Client"}
                    </div>
                    <div className="wp-request-job">{req.title || req.jobTitle || "Job Request"}</div>
                    <div className="wp-request-time">{req.createdAt ? timeAgo(req.createdAt) : ""}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <StatusBadge status={req.status || "pending"} />
                  <span style={{ color: "#444", fontSize: 14 }}>
                    {selected?.id === req.id || selected?._id === req._id ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {(selected?.id === req.id || selected?._id === req._id) && (
                <div className="wp-request-body">
                  <div className="wp-request-message">
                    <span className="wp-label">Message from client</span>
                    <p>{req.message || req.description || "No message provided."}</p>
                  </div>
                  {req.budget && (
                    <div className="wp-request-budget">
                      <span className="wp-label">Budget</span>
                      <span className="wp-budget-val">KES {req.budget?.toLocaleString()}</span>
                    </div>
                  )}
                  {req.location && (
                    <div className="wp-request-budget">
                      <span className="wp-label">Location</span>
                      <span style={{ color: "#aaa", fontSize: 13 }}>📍 {req.location}</span>
                    </div>
                  )}

                  {(req.status === "pending" || !req.status) && (
                    <>
                      <div className="wp-field" style={{ marginTop: 16 }}>
                        <label className="wp-label">Your Reply</label>
                        <textarea
                          className="wp-input wp-textarea"
                          rows={3}
                          placeholder="Write a message to the client..."
                          value={reply}
                          onChange={e => setReply(e.target.value)}
                        />
                      </div>
                      <div className="wp-reply-actions">
                        <button
                          className="wp-btn-accept"
                          disabled={sending}
                          onClick={() => handleReply(req.id || req._id, "accept")}>
                          ✓ Accept Job
                        </button>
                        <button
                          className="wp-btn-decline"
                          disabled={sending}
                          onClick={() => handleReply(req.id || req._id, "decline")}>
                          ✗ Decline
                        </button>
                      </div>
                    </>
                  )}

                  {req.workerReply && (
                    <div className="wp-replied-box">
                      <span className="wp-label">Your reply</span>
                      <p>{req.workerReply}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 3. BROWSE WORKERS ── */
function BrowseWorkers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [trade, setTrade]     = useState("");
  const [msg, setMsg]         = useState("");

  const WORK_TYPES = ["Welder","Fabricator","Blacksmith","Metalworker","Machinist","Plumbers","Structural Engineer","Painter"];

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/workers`, { headers: authHeaders() });
        const json = await res.json();
        setWorkers(json.workers || json || []);
      } catch {
        setMsg("Could not load workers.");
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, []);

  const myId = (() => {
    try { return JSON.parse(localStorage.getItem("user"))?.id; } catch { return null; }
  })();

  const visible = workers.filter(w => {
    if (w.id === myId || w._id === myId) return false;
    const matchSearch = !search || w.username?.toLowerCase().includes(search.toLowerCase());
    const matchTrade  = !trade  || w.work === trade;
    return matchSearch && matchTrade;
  });

  return (
    <div>
      <div className="wp-section-header">
        <div className="wp-section-title">Browse Workers</div>
      </div>

      <div className="wp-search-row">
        <input
          className="wp-input"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select className="wp-input" value={trade}
          onChange={e => setTrade(e.target.value)}
          style={{ width: 180 }}>
          <option value="">All trades</option>
          {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>

      {msg && <div className="wp-alert error">{msg}</div>}

      {loading ? (
        <div className="wp-empty">Loading workers...</div>
      ) : visible.length === 0 ? (
        <div className="wp-empty">
          <div style={{ fontSize: 36, marginBottom: 8 }}>👷</div>
          No workers found.
        </div>
      ) : (
        <div className="wp-workers-grid">
          {visible.map(w => (
            <div key={w.id || w._id} className="wp-worker-card">
              <Avatar
                src={w.profile_pic ? `${API_BASE}/static/images/${w.profile_pic}` : null}
                size={64}
                initials={w.username}
              />
              <div className="wp-worker-name">{w.username}</div>
              <div className="wp-worker-trade">{w.work || "—"}</div>
              {w.phone && <div className="wp-worker-phone">📞 {w.phone}</div>}
              {w.bio && <div className="wp-worker-bio">{w.bio}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* ── 4. PREVIOUS WORK ── */
function PreviousWork() {
  const [pics, setPics]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox]   = useState(null);
  const [msg, setMsg]             = useState({ type: "", text: "" });
  const fileRef = useRef();

  const fetchPics = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/worker/work_pics`, { headers: authHeaders() });
      const json = await res.json();
      setPics(json.pics || json || []);
    } catch {
      setMsg({ type: "error", text: "Could not load work photos." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPics(); }, []);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    setMsg({ type: "", text: "" });
    const data = new FormData();
    files.forEach(f => data.append("pics", f));
    try {
      const res  = await fetch(`${API_BASE}/api/worker/work_pics`, {
        method: "POST",
        headers: authHeaders(),
        body: data,
      });
      const json = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: `${files.length} photo${files.length > 1 ? "s" : ""} uploaded!` });
        fetchPics();
      } else {
        setMsg({ type: "error", text: json.error || "Upload failed." });
      }
    } catch {
      setMsg({ type: "error", text: "Could not reach server." });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (picId) => {
    try {
      const res = await fetch(`${API_BASE}/api/worker/work_pics/${picId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        setPics(p => p.filter(x => (x.id || x._id) !== picId));
        setMsg({ type: "success", text: "Photo deleted." });
      }
    } catch {
      setMsg({ type: "error", text: "Could not delete photo." });
    }
  };

  return (
    <div>
      <div className="wp-section-header">
        <div className="wp-section-title">Previous Work</div>
        <button
          className="wp-btn-primary"
          style={{ fontSize: 15, padding: "9px 20px" }}
          onClick={() => fileRef.current.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "+ Add Photos"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple
          style={{ display: "none" }} onChange={handleUpload} />
      </div>

      {msg.text && <div className={`wp-alert ${msg.type}`}>{msg.text}</div>}

      {loading ? (
        <div className="wp-empty">Loading photos...</div>
      ) : pics.length === 0 ? (
        <div className="wp-empty">
          <div style={{ fontSize: 44, marginBottom: 12 }}>🖼️</div>
          <div style={{ marginBottom: 16 }}>No work photos yet. Showcase your best projects!</div>
          <button className="wp-btn-primary" onClick={() => fileRef.current.click()}>Upload First Photo</button>
        </div>
      ) : (
        <div className="wp-work-grid">
          {pics.map((pic) => {
            const id  = pic.id || pic._id;
            const url = pic.url ? pic.url : `${API_BASE}/static/work_pics/${pic.filename || pic.name || pic}`;
            return (
              <div key={id} className="wp-work-pic-card">
                <img src={url} alt="Work" className="wp-work-pic-img" onClick={() => setLightbox(url)} />
                <div className="wp-work-pic-overlay">
                  <button className="wp-work-pic-view" onClick={() => setLightbox(url)}>View</button>
                  <button className="wp-work-pic-del" onClick={() => handleDelete(id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {lightbox && (
        <div style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Full size"
            style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 4, objectFit: "contain" }}
            onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightbox(null)}
            style={{ position: "absolute", top: 20, right: 24, background: "transparent", border: "none", color: "#fff", fontSize: 28, cursor: "pointer" }}>
            X
          </button>
        </div>
      )}
    </div>
  );
}

// ── ROOT COMPONENT ────────────────────────────────────────────────────────────
export default function WorkerProfile() {
  const [tab, setTab]           = useState("profile");
  const [worker, setWorker]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const navigate                = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/signin"); return; }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/worker/profile`, {
          headers: authHeaders(),
        });
        if (res.status === 401) { navigate("/signin"); return; }
        const json = await res.json();
        setWorker(json.worker || json);
      } catch {
        // fallback to stored user
        try { setWorker(JSON.parse(localStorage.getItem("user"))); } catch {}
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/signin");
  };

  if (loading) return (
    <div style={{
      minHeight: "100vh", background: "#0f0f0f",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Bebas Neue', sans-serif", fontSize: 28,
      color: "#c89633", letterSpacing: 3,
    }}>
      Loading...
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #0f0f0f; }

        .wp-root {
          min-height: 100vh;
          background: #0f0f0f;
          font-family: 'DM Sans', sans-serif;
          color: #e8e8e8;
          display: flex;
          flex-direction: column;
        }

        /* Top nav */
        .wp-nav {
          background: #141414;
          border-bottom: 1px solid #1e1e1e;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 60px;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .wp-nav-logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          color: #c89633;
          letter-spacing: 3px;
        }

        .wp-nav-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .wp-nav-user {
          font-size: 13px;
          color: #555;
        }

        .wp-logout-btn {
          background: transparent;
          border: 1px solid #2a2a2a;
          color: #555;
          padding: 6px 14px;
          border-radius: 3px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }

        .wp-logout-btn:hover { border-color: #e07070; color: #e07070; }

        /* Body layout */
        .wp-body {
          display: flex;
          min-height: calc(100vh - 60px);
        }

        /* Sidebar */
        .wp-sidebar {
          width: 220px;
          min-width: 220px;
          background: #141414;
          border-right: 1px solid #1e1e1e;
          display: flex;
          flex-direction: column;
          padding: 16px 0;
          transition: width 0.25s ease, min-width 0.25s ease;
          overflow: hidden;
          position: sticky;
          top: 60px;
          height: calc(100vh - 60px);
        }

        .wp-sidebar.collapsed {
          width: 56px;
          min-width: 56px;
        }

        .wp-sidebar-toggle {
          background: transparent;
          border: none;
          color: #555;
          font-size: 18px;
          cursor: pointer;
          padding: 8px 16px;
          text-align: right;
          display: block;
          width: 100%;
          transition: color 0.2s;
          margin-bottom: 8px;
        }

        .wp-sidebar-toggle:hover { color: #c89633; }

        .wp-sidebar-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          background: transparent;
          border: none;
          color: #555;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 1px;
          padding: 13px 18px;
          cursor: pointer;
          transition: color 0.2s, background 0.2s;
          white-space: nowrap;
          border-left: 3px solid transparent;
        }

        .wp-sidebar-btn:hover { color: #aaa; background: #1a1a1a; }

        .wp-sidebar-btn.active {
          color: #c89633;
          border-left-color: #c89633;
          background: #1a1a1a;
        }

        .wp-sidebar-btn .sb-icon { font-size: 18px; flex-shrink: 0; }
        .wp-sidebar-btn .sb-label { transition: opacity 0.2s; }
        .wp-sidebar.collapsed .sb-label { opacity: 0; pointer-events: none; }

        .wp-sidebar-divider {
          border: none;
          border-top: 1px solid #1e1e1e;
          margin: 10px 0;
        }

        /* Main content */
        .wp-content {
          flex: 1;
          max-width: 860px;
          margin: 0 auto;
          padding: 32px 24px 60px;
          width: 100%;
        }

        /* Mobile hamburger button */
        .wp-hamburger {
          display: none;
          background: transparent;
          border: none;
          color: #c89633;
          font-size: 22px;
          cursor: pointer;
          padding: 4px 8px;
        }

        @media (max-width: 768px) {
          .wp-hamburger { display: block; }
          .wp-sidebar {
            position: fixed;
            z-index: 100;
            height: 100vh;
            top: 0;
            left: 0;
            width: 220px !important;
            min-width: 220px !important;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            padding-top: 20px;
          }
          .wp-sidebar.open {
            transform: translateX(0);
          }
          .wp-sidebar-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: #00000088;
            z-index: 99;
          }
          .wp-sidebar-overlay.open { display: block; }
          .wp-content { padding: 20px 16px 60px; }
        }

        /* Profile hero */
        .wp-profile-hero {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .wp-photo-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .wp-photo-btn {
          position: absolute;
          bottom: 0; right: 0;
          background: #c89633;
          border: none;
          border-radius: 50%;
          width: 28px; height: 28px;
          font-size: 13px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: opacity 0.2s;
        }

        .wp-photo-btn:hover { opacity: 0.85; }
        .wp-photo-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .wp-hero-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px;
          color: #e8e8e8;
          letter-spacing: 2px;
          line-height: 1.1;
        }

        .wp-hero-trade {
          font-size: 13px;
          color: #c89633;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-top: 3px;
        }

        .wp-hero-email { font-size: 13px; color: #555; margin-top: 4px; }

        .wp-edit-toggle { margin-left: auto; align-self: center; }

        /* Info grid */
        .wp-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: #1e1e1e;
          border: 1px solid #1e1e1e;
          border-radius: 4px;
          overflow: hidden;
        }

        .wp-info-item {
          background: #141414;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .wp-info-full { grid-column: 1 / -1; }

        .wp-info-label {
          font-size: 10px;
          color: #444;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-weight: 500;
        }

        .wp-info-value { font-size: 14px; color: #ccc; }

        /* Form */
        .wp-form { display: flex; flex-direction: column; gap: 0; }
        .wp-field { margin-bottom: 14px; }

        .wp-label {
          display: block;
          font-size: 10px;
          color: #555;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .wp-input {
          width: 100%;
          background: #111;
          border: 1px solid #2a2a2a;
          border-radius: 3px;
          padding: 11px 14px;
          color: #e8e8e8;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .wp-input:focus { border-color: #c89633; }
        .wp-input option { background: #1a1a1a; }
        .wp-textarea { resize: vertical; min-height: 80px; }

        /* Buttons */
        .wp-btn-primary {
          padding: 12px 28px;
          background: #c89633;
          color: #0f0f0f;
          border: none;
          border-radius: 3px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: opacity 0.2s;
          align-self: flex-start;
          margin-top: 4px;
        }

        .wp-btn-primary:hover { opacity: 0.88; }
        .wp-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .wp-btn-ghost {
          padding: 9px 18px;
          background: transparent;
          border: 1px solid #2a2a2a;
          color: #666;
          border-radius: 3px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }

        .wp-btn-ghost:hover { border-color: #555; color: #aaa; }

        .wp-btn-accept {
          padding: 10px 22px;
          background: #122a12;
          color: #70c070;
          border: 1px solid #1a3a1a;
          border-radius: 3px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 1px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .wp-btn-accept:hover { background: #1a3a1a; }
        .wp-btn-accept:disabled { opacity: 0.5; cursor: not-allowed; }

        .wp-btn-decline {
          padding: 10px 22px;
          background: #2a1212;
          color: #e07070;
          border: 1px solid #3a1a1a;
          border-radius: 3px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 1px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .wp-btn-decline:hover { background: #3a1a1a; }
        .wp-btn-decline:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Alerts */
        .wp-alert {
          padding: 10px 14px;
          border-radius: 3px;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .wp-alert.error   { background: #2a1212; color: #e07070; border: 1px solid #3a1a1a; }
        .wp-alert.success { background: #122a12; color: #70c070; border: 1px solid #1a3a1a; }

        /* Section header */
        .wp-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .wp-section-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 24px;
          color: #e8e8e8;
          letter-spacing: 2px;
        }

        /* Filter pills */
        .wp-filter-pills { display: flex; gap: 6px; flex-wrap: wrap; }

        .wp-pill {
          padding: 5px 12px;
          background: transparent;
          border: 1px solid #2a2a2a;
          border-radius: 20px;
          color: #555;
          font-size: 12px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }

        .wp-pill:hover { border-color: #555; color: #aaa; }
        .wp-pill.active { background: #c89633; border-color: #c89633; color: #0f0f0f; font-weight: 500; }

        /* Request list */
        .wp-request-list { display: flex; flex-direction: column; gap: 10px; }

        .wp-request-card {
          background: #141414;
          border: 1px solid #1e1e1e;
          border-radius: 4px;
          overflow: hidden;
          transition: border-color 0.2s;
        }

        .wp-request-card.expanded { border-color: #c89633; }

        .wp-request-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          gap: 12px;
        }

        .wp-request-header:hover { background: #181818; }

        .wp-request-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .wp-request-client {
          font-size: 14px;
          font-weight: 500;
          color: #e8e8e8;
        }

        .wp-request-job {
          font-size: 13px;
          color: #888;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 300px;
        }

        .wp-request-time { font-size: 11px; color: #3a3a3a; margin-top: 2px; }

        .wp-request-body {
          padding: 0 20px 20px;
          border-top: 1px solid #1e1e1e;
          margin-top: 0;
        }

        .wp-request-message {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .wp-request-message p { font-size: 14px; color: #aaa; line-height: 1.6; }

        .wp-request-budget {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .wp-budget-val {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          color: #c89633;
          letter-spacing: 1px;
        }

        .wp-reply-actions { display: flex; gap: 10px; margin-top: 12px; }

        .wp-replied-box {
          margin-top: 16px;
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 3px;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .wp-replied-box p { font-size: 13px; color: #777; }

        /* Browse workers */
        .wp-search-row {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .wp-workers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 14px;
        }

        .wp-worker-card {
          background: #141414;
          border: 1px solid #1e1e1e;
          border-radius: 4px;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
          transition: border-color 0.2s, transform 0.2s;
        }

        .wp-worker-card:hover { border-color: #c89633; transform: translateY(-3px); }

        .wp-worker-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 20px;
          color: #e8e8e8;
          letter-spacing: 1px;
          margin-top: 4px;
        }

        .wp-worker-trade {
          font-size: 11px;
          color: #c89633;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .wp-worker-phone { font-size: 12px; color: #444; }

        .wp-worker-bio {
          font-size: 12px;
          color: #555;
          line-height: 1.55;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Empty state */
        .wp-empty {
          text-align: center;
          padding: 60px 20px;
          color: #3a3a3a;
          font-size: 14px;
        }

        @media (max-width: 600px) {
          .wp-info-grid { grid-template-columns: 1fr; }
          .wp-profile-hero { flex-direction: column; }
          .wp-edit-toggle { margin-left: 0; }
          .wp-workers-grid { grid-template-columns: 1fr 1fr; }
        }
        /* Work pics grid */
        .wp-work-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }

        .wp-work-pic-card {
          position: relative;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid #1e1e1e;
          aspect-ratio: 1;
          background: #111;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .wp-work-pic-card:hover { border-color: #c89633; }

        .wp-work-pic-img {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
          transition: filter 0.25s;
        }

        .wp-work-pic-card:hover .wp-work-pic-img { filter: brightness(0.55); }

        .wp-work-pic-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .wp-work-pic-card:hover .wp-work-pic-overlay { opacity: 1; }

        .wp-work-pic-view {
          padding: 7px 14px;
          background: #c89633;
          color: #0f0f0f;
          border: none;
          border-radius: 3px;
          font-family: "Bebas Neue", sans-serif;
          font-size: 14px;
          letter-spacing: 1px;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .wp-work-pic-view:hover { opacity: 0.85; }

        .wp-work-pic-del {
          padding: 7px 14px;
          background: #2a1212;
          color: #e07070;
          border: 1px solid #3a1a1a;
          border-radius: 3px;
          font-family: "Bebas Neue", sans-serif;
          font-size: 14px;
          letter-spacing: 1px;
          cursor: pointer;
        }
        .wp-work-pic-del:hover { background: #3a1a1a; }

        @media (max-width: 600px) {
          .wp-work-grid { grid-template-columns: 1fr 1fr; }
        }

      `}</style>

      <div className="wp-root">
        {/* Nav */}
        <nav className="wp-nav">
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button className="wp-hamburger" onClick={() => setMobileOpen(o => !o)}>☰</button>
            <div className="wp-nav-logo">SteelSmith</div>
          </div>
          <div className="wp-nav-right">
            <span className="wp-nav-user">👤 {worker?.username}</span>
            <button className="wp-logout-btn" onClick={handleLogout}>Sign Out</button>
          </div>
        </nav>

        {/* Overlay for mobile */}
        <div className={`wp-sidebar-overlay ${mobileOpen ? "open" : ""}`}
          onClick={() => setMobileOpen(false)} />

        {/* Body: sidebar + content */}
        <div className="wp-body">
          {/* Sidebar */}
          <aside className={`wp-sidebar ${sidebarOpen ? "" : "collapsed"} ${mobileOpen ? "open" : ""}`}>
            <button
              className="wp-sidebar-toggle"
              onClick={() => setSidebarOpen(o => !o)}
              title={sidebarOpen ? "Collapse" : "Expand"}
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>

            <button
              className={`wp-sidebar-btn ${tab === "profile" ? "active" : ""}`}
              onClick={() => { setTab("profile"); setMobileOpen(false); }}
            >
              <span className="sb-icon">👤</span>
              <span className="sb-label">My Profile</span>
            </button>

            <button
              className={`wp-sidebar-btn ${tab === "requests" ? "active" : ""}`}
              onClick={() => { setTab("requests"); setMobileOpen(false); }}
            >
              <span className="sb-icon">📋</span>
              <span className="sb-label">Job Requests</span>
            </button>

            <button
              className={`wp-sidebar-btn ${tab === "workers" ? "active" : ""}`}
              onClick={() => { setTab("workers"); setMobileOpen(false); }}
            >
              <span className="sb-icon">👷</span>
              <span className="sb-label">Browse Workers</span>
            </button>

            <button
              className={`wp-sidebar-btn ${tab === "work_pics" ? "active" : ""}`}
              onClick={() => { setTab("work_pics"); setMobileOpen(false); }}
            >
              <span className="sb-icon">🖼️</span>
              <span className="sb-label">Previous Work</span>
            </button>

            <hr className="wp-sidebar-divider" />

            <button
              className="wp-sidebar-btn"
              onClick={() => navigate("/worker")}
            >
              <span className="sb-icon">🏠</span>
              <span className="sb-label">Home</span>
            </button>
          </aside>

          {/* Content */}
          <div className="wp-content">
            {tab === "profile" && (
              <MyProfile
                worker={worker}
                onPhotoChange={filename => setWorker(w => ({ ...w, profile_pic: filename }))}
                onSave={updated => setWorker(updated)}
              />
            )}
            {tab === "requests" && <JobRequests />}
            {tab === "workers"  && <BrowseWorkers />}
            {tab === "work_pics" && <PreviousWork />}
          </div>
        </div>
      </div>
    </>
  );
}
