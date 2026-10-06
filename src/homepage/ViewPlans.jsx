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

export default function ViewPlans() {
  const [user, setUser]             = useState(null);
  const [plans, setPlans]           = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [allWorkers, setAllWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState("");
  const [showAddModal, setShowAddModal]   = useState(false);
  const [loadingPlans, setLoadingPlans]   = useState(true);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal]   = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast]           = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Payment modal state
  const [payModal, setPayModal]         = useState(null);   // { worker } | null
  const [payDailyRate, setPayDailyRate] = useState("");
  const [payDays, setPayDays]           = useState("");
  const [payPhone, setPayPhone]               = useState("");
  const [payRecipientPhone, setPayRecipientPhone] = useState("");
  const [payLoading, setPayLoading]     = useState(false);
  const [payStatus, setPayStatus]       = useState(null);   // { msg, ok }

  const navigate = useNavigate();

  const showToast = (msg, type) => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };
  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token  = localStorage.getItem("token");
    if (!stored || !token) { navigate("/signup-as"); return; }
    try { setUser(JSON.parse(stored)); } catch { navigate("/signup-as"); return; }
    fetchPlans(token);
  }, []);

  useEffect(() => {
    if (!showAddModal) return;
    if (allWorkers.length === 0) fetchWorkers();
  }, [showAddModal]);

  useEffect(() => {
    let result = allWorkers;
    if (category) result = result.filter(w => w.work === category);
    if (search)   result = result.filter(w =>
      w.username.toLowerCase().includes(search.toLowerCase()) ||
      (w.work || "").toLowerCase().includes(search.toLowerCase())
    );
    setFilteredWorkers(result);
  }, [search, category, allWorkers]);

  const fetchPlans = async (token) => {
    setLoadingPlans(true);
    try {
      const res  = await fetch(`${API_BASE}/api/user/plans`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (res.ok) {
        setPlans(Array.isArray(json) ? json : []);
      } else {
        showToast(json.error || "Could not load plans.", "error");
      }
    } catch {
      showToast("Could not reach the server.", "error");
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchWorkers = async () => {
    setLoadingWorkers(true);
    try {
      const res  = await fetch(`${API_BASE}/api/user/workers`, { headers: authHeaders() });
      const json = await res.json();
      setAllWorkers(Array.isArray(json) ? json : []);
      setFilteredWorkers(Array.isArray(json) ? json : []);
    } catch {
      showToast("Could not load workers.", "error");
    } finally {
      setLoadingWorkers(false);
    }
  };

  const refreshPlan = async (planId) => {
    const res  = await fetch(`${API_BASE}/api/user/plans`, { headers: authHeaders() });
    const json = await res.json();
    if (res.ok && Array.isArray(json)) {
      setPlans(json);
      const updated = json.find(p => p.id === planId);
      if (updated) setActivePlan(updated);
    }
  };

  const removeWorkerFromPlan = async (planId, workerId) => {
    try {
      const res = await fetch(`${API_BASE}/api/user/plans/${planId}/workers/${workerId}`, {
        method: "DELETE", headers: authHeaders(),
      });
      if (res.ok) { await refreshPlan(planId); showToast("Worker removed.", "success"); }
      else { const j = await res.json(); showToast(j.error || "Failed.", "error"); }
    } catch { showToast("Could not reach the server.", "error"); }
  };

  const addWorkerToPlan = async (worker) => {
    if (!activePlan) return;
    if (activePlan.workers.some(w => w.id === worker.id)) { showToast("Already in this plan.", "error"); return; }
    try {
      const res = await fetch(`${API_BASE}/api/user/plans/${activePlan.id}/workers`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ worker_id: worker.id }),
      });
      if (res.ok) { await refreshPlan(activePlan.id); showToast(`${worker.username} added.`, "success"); }
      else { const j = await res.json(); showToast(j.error || "Failed.", "error"); }
    } catch { showToast("Could not reach the server.", "error"); }
  };

  const deletePlan = async (planId) => {
    try {
      const res = await fetch(`${API_BASE}/api/user/plans/${planId}`, {
        method: "DELETE", headers: authHeaders(),
      });
      if (res.ok) {
        setPlans(plans.filter(p => p.id !== planId));
        if (activePlan?.id === planId) setActivePlan(null);
        showToast("Plan deleted.", "success");
      } else { const j = await res.json(); showToast(j.error || "Failed.", "error"); }
    } catch { showToast("Could not reach the server.", "error"); }
    setConfirmDelete(null);
  };

  const saveRename = async () => {
    if (!renameVal.trim()) { showToast("Name cannot be empty.", "error"); return; }
    try {
      const res = await fetch(`${API_BASE}/api/user/plans/${renamingId}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameVal.trim() }),
      });
      if (res.ok) {
        setPlans(plans.map(p => p.id === renamingId ? { ...p, name: renameVal.trim() } : p));
        if (activePlan?.id === renamingId) setActivePlan(prev => ({ ...prev, name: renameVal.trim() }));
        showToast("Plan renamed.", "success");
      } else { const j = await res.json(); showToast(j.error || "Failed.", "error"); }
    } catch { showToast("Could not reach the server.", "error"); }
    setRenamingId(null);
  };

  const isInPlan = (workerId) => activePlan?.workers.some(w => w.id === workerId);
  const signOut  = () => { localStorage.clear(); navigate("/signup-as"); };
  const formatDate = (iso) => new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const openPayModal = (worker) => {
    setPayModal({ worker });
    setPayDailyRate("");
    setPayDays("");
    setPayPhone("");
    setPayRecipientPhone("");
    setPayStatus(null);
  };

  const payTotal = () => {
    const r = parseFloat(payDailyRate);
    const d = parseFloat(payDays);
    return !isNaN(r) && !isNaN(d) && r > 0 && d > 0 ? r * d : null;
  };

  const normalisePhone = (raw) => {
    let p = raw.replace(/\D/g, "");
    if (p.startsWith("0")) p = "254" + p.slice(1);
    return p;
  };

  const submitPayment = async () => {
    const total = payTotal();
    if (!total) { showToast("Enter a valid rate and number of days.", "error"); return; }

    const payerPhone = normalisePhone(payPhone);
    if (payerPhone.length < 12) { showToast("Enter a valid paying phone number.", "error"); return; }

    const recipientPhone = normalisePhone(payRecipientPhone);
    if (recipientPhone.length < 12) { showToast("Enter a valid recipient phone number.", "error"); return; }

    setPayLoading(true);
    setPayStatus(null);
    try {
      const fd = new FormData();
      fd.append("amount",          Math.round(total));
      fd.append("phone",           payerPhone);
      fd.append("recipient_phone", recipientPhone);
      fd.append("worker_id",       payModal.worker.id);
      const res  = await fetch(`${API_BASE}/api/mpesa_payment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: fd,
      });
      const json = await res.json();
      if (res.ok) {
        setPayStatus({ ok: true, msg: json.message || "STK push sent! Complete payment on your phone." });
      } else {
        setPayStatus({ ok: false, msg: json.error || "Payment failed. Try again." });
      }
    } catch {
      setPayStatus({ ok: false, msg: "Could not reach the server." });
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0a0a0a !important; }
        .vp-root { display: flex; min-height: 100vh; background: #0a0a0a; font-family: 'DM Sans', sans-serif; color: #e0e0e0; }
        .vp-sidebar { width: 240px; min-height: 100vh; background: #0d0d0d; border-right: 1px solid #1a1a1a; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow-y: auto; flex-shrink: 0; z-index: 100; transition: transform 0.25s ease; }
        .vp-sidebar-logo { font-family: 'Bebas Neue', sans-serif; font-size: 26px; color: #c89633; letter-spacing: 3px; padding: 24px 20px 18px; border-bottom: 1px solid #1a1a1a; }
        .vp-sidebar-logo span { display: block; font-size: 10px; color: #2a2a2a; letter-spacing: 2px; font-family: 'DM Sans', sans-serif; margin-top: 3px; text-transform: uppercase; }
        .vp-sidebar-user { padding: 14px 20px; border-bottom: 1px solid #1a1a1a; display: flex; align-items: center; gap: 10px; }
        .vp-avatar { width: 36px; height: 36px; border-radius: 50%; background: #1a1a1a; border: 1px solid #c89633; display: flex; align-items: center; justify-content: center; font-family: 'Bebas Neue', sans-serif; font-size: 16px; color: #c89633; flex-shrink: 0; overflow: hidden; }
        .vp-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .vp-sidebar-name { font-size: 13px; font-weight: 500; color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .vp-sidebar-role { font-size: 10px; color: #333; text-transform: uppercase; letter-spacing: 1px; }
        .vp-sidebar-nav { flex: 1; padding: 16px 0; }
        .vp-nav-label { font-size: 9px; color: #222; letter-spacing: 2px; text-transform: uppercase; padding: 10px 20px 6px; }
        .vp-nav-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 20px; background: transparent; border: none; border-left: 3px solid transparent; color: #3a3a3a; font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; transition: all 0.15s; text-align: left; }
        .vp-nav-btn:hover, .vp-nav-btn.active { color: #c89633; background: #121200; border-left-color: #c89633; }
        .vp-nav-icon { font-size: 16px; width: 20px; text-align: center; }
        .vp-sidebar-bottom { padding: 14px 12px; border-top: 1px solid #1a1a1a; }
        .vp-signout { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: transparent; border: 1px solid #1e1e1e; border-radius: 3px; color: #444; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .vp-signout:hover { border-color: #e07070; color: #e07070; background: #1f0d0d; }
        .vp-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .vp-topbar { background: #0d0d0d; border-bottom: 1px solid #1a1a1a; padding: 0 28px; height: 56px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; }
        .vp-topbar-title { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: #e8e8e8; letter-spacing: 2px; }
        .vp-mobile-btn { display: none; background: transparent; border: 1px solid #1e1e1e; color: #c89633; font-size: 18px; width: 36px; height: 36px; border-radius: 3px; cursor: pointer; align-items: center; justify-content: center; }
        .vp-content { padding: 28px 28px 60px; }
        .vp-section-title { font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: #555; letter-spacing: 2px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
        .vp-section-title::after { content: ''; flex: 1; height: 1px; background: #1a1a1a; }
        .vp-plans-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 40px; }
        .vp-plan-card { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 4px; padding: 20px; cursor: pointer; transition: border-color 0.2s, transform 0.15s; }
        .vp-plan-card:hover { border-color: #2a2a2a; transform: translateY(-2px); }
        .vp-plan-card.active { border-color: #c89633; }
        .vp-plan-name { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: #e8e8e8; letter-spacing: 1.5px; line-height: 1.1; margin-bottom: 6px; }
        .vp-plan-date { font-size: 11px; color: #2a2a2a; margin-bottom: 10px; }
        .vp-plan-worker-count { font-size: 12px; color: #c89633; margin-bottom: 14px; }
        .vp-plan-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .vp-btn-ghost { padding: 6px 12px; border-radius: 3px; border: 1px solid #1e1e1e; background: transparent; color: #555; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; transition: all 0.15s; }
        .vp-btn-ghost:hover { border-color: #c89633; color: #c89633; }
        .vp-btn-danger { padding: 6px 12px; border-radius: 3px; border: 1px solid #2a1212; background: transparent; color: #553333; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; transition: all 0.15s; }
        .vp-btn-danger:hover { border-color: #e07070; color: #e07070; background: #1f0d0d; }
        .vp-rename-wrap { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
        .vp-rename-input { flex: 1; background: #111; border: 1px solid #c89633; border-radius: 3px; padding: 6px 10px; color: #e0e0e0; font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 1px; outline: none; }
        .vp-rename-save { padding: 6px 14px; background: #c89633; color: #0a0a0a; border: none; border-radius: 3px; font-family: 'Bebas Neue', sans-serif; font-size: 14px; cursor: pointer; }
        .vp-detail { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 4px; padding: 24px; }
        .vp-detail-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
        .vp-detail-title { font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: #c89633; letter-spacing: 2px; }
        .vp-detail-subtitle { font-size: 12px; color: #333; margin-top: 2px; }
        .vp-add-worker-btn { padding: 10px 20px; background: #c89633; color: #0a0a0a; border: none; border-radius: 3px; font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 1.5px; cursor: pointer; transition: opacity 0.2s; }
        .vp-add-worker-btn:hover { opacity: 0.88; }
        .vp-workers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
        .vp-worker-card { background: #111; border: 1px solid #1a1a1a; border-radius: 4px; padding: 16px; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .vp-worker-pic { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid #c89633; margin-bottom: 10px; }
        .vp-worker-pic-placeholder { width: 60px; height: 60px; border-radius: 50%; background: #1a1a1a; border: 2px solid #1e1e1e; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 10px; }
        .vp-worker-name { font-family: 'Bebas Neue', sans-serif; font-size: 16px; color: #e8e8e8; letter-spacing: 1px; margin-bottom: 3px; }
        .vp-worker-trade { font-size: 11px; color: #c89633; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .vp-remove-btn { width: 100%; padding: 7px; border-radius: 3px; border: 1px solid #2a1212; background: transparent; color: #553333; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; transition: all 0.15s; }
        .vp-remove-btn:hover { border-color: #e07070; color: #e07070; background: #1f0d0d; }
        .vp-pay-btn { width: 100%; padding: 7px; border-radius: 3px; border: 1px solid #1a3a1a; background: transparent; color: #3a8a3a; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; transition: all 0.15s; margin-bottom: 6px; }
        .vp-pay-btn:hover { border-color: #00A550; color: #00A550; background: #0a1f0a; }
        .vp-empty { text-align: center; padding: 60px 20px; color: #2a2a2a; font-size: 14px; }
        .vp-empty-icon { font-size: 40px; margin-bottom: 12px; }
        .vp-empty-cta { margin-top: 16px; padding: 10px 24px; background: #c89633; color: #0a0a0a; border: none; border-radius: 3px; font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 1.5px; cursor: pointer; }
        .vp-loading { text-align: center; color: #2a2a2a; padding: 60px; font-size: 14px; }
        .vp-overlay { position: fixed; inset: 0; background: #000c; z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
        @media (min-width: 600px) { .vp-overlay { align-items: center; } }
        .vp-modal { background: #0d0d0d; border: 1px solid #1e1e1e; border-radius: 6px 6px 0 0; width: 100%; max-width: 700px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; }
        @media (min-width: 600px) { .vp-modal { border-radius: 6px; } }
        .vp-modal-header { padding: 20px 24px; border-bottom: 1px solid #1a1a1a; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .vp-modal-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; color: #e8e8e8; letter-spacing: 2px; }
        .vp-modal-close { background: transparent; border: 1px solid #2a2a2a; color: #555; width: 32px; height: 32px; border-radius: 3px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
        .vp-modal-close:hover { border-color: #555; color: #aaa; }
        .vp-modal-body { padding: 20px 24px; overflow-y: auto; flex: 1; }
        .vp-modal-search-wrap { position: relative; margin-bottom: 16px; }
        .vp-modal-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 15px; color: #333; pointer-events: none; }
        .vp-modal-search { width: 100%; background: #111; border: 1px solid #1e1e1e; border-radius: 4px; padding: 12px 14px 12px 40px; color: #e0e0e0; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; }
        .vp-modal-search:focus { border-color: #c89633; }
        .vp-modal-search::placeholder { color: #2a2a2a; }
        .vp-modal-cats { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 20px; }
        .vp-modal-cat { padding: 5px 12px; border-radius: 20px; border: 1px solid #1e1e1e; background: transparent; color: #444; font-family: 'DM Sans', sans-serif; font-size: 11px; cursor: pointer; transition: all 0.15s; }
        .vp-modal-cat:hover { border-color: #c89633; color: #c89633; }
        .vp-modal-cat.active { background: #c89633; color: #0a0a0a; border-color: #c89633; }
        .vp-modal-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
        .vp-modal-worker-card { background: #111; border: 1px solid #1a1a1a; border-radius: 4px; padding: 14px; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .vp-modal-pic { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #c89633; margin-bottom: 8px; }
        .vp-modal-pic-placeholder { width: 50px; height: 50px; border-radius: 50%; background: #1a1a1a; border: 2px solid #1e1e1e; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 8px; }
        .vp-modal-name { font-family: 'Bebas Neue', sans-serif; font-size: 15px; color: #e8e8e8; letter-spacing: 1px; margin-bottom: 2px; }
        .vp-modal-trade { font-size: 10px; color: #c89633; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .vp-modal-add-btn { width: 100%; padding: 7px; border-radius: 3px; border: 1px solid #c89633; background: transparent; color: #c89633; font-family: 'Bebas Neue', sans-serif; font-size: 13px; letter-spacing: 1px; cursor: pointer; transition: all 0.15s; }
        .vp-modal-add-btn:hover { background: #c89633; color: #0a0a0a; }
        .vp-modal-add-btn.already { border-color: #2a3a1a; color: #4a8a2a; cursor: default; }
        .vp-confirm-overlay { position: fixed; inset: 0; background: #000c; z-index: 300; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .vp-confirm-box { background: #111; border: 1px solid #2a1212; border-radius: 4px; padding: 28px; max-width: 360px; width: 100%; text-align: center; }
        .vp-confirm-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; color: #e8e8e8; letter-spacing: 1.5px; margin-bottom: 10px; }
        .vp-confirm-text { font-size: 13px; color: #555; margin-bottom: 24px; line-height: 1.6; }
        .vp-confirm-actions { display: flex; gap: 10px; justify-content: center; }
        .vp-confirm-yes { padding: 10px 24px; background: #e07070; color: #fff; border: none; border-radius: 3px; font-family: 'Bebas Neue', sans-serif; font-size: 16px; cursor: pointer; }
        .vp-confirm-no { padding: 10px 24px; background: transparent; border: 1px solid #2a2a2a; color: #555; border-radius: 3px; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; }
        .vp-confirm-no:hover { border-color: #555; color: #aaa; }
        .vp-toast { position: fixed; bottom: 28px; right: 28px; padding: 12px 20px; border-radius: 4px; font-size: 13px; z-index: 500; animation: slideUp 0.3s ease; }
        .vp-toast.success { background: #0d1f0d; color: #4caf65; border: 1px solid #143314; }
        .vp-toast.error { background: #1f0d0d; color: #e07070; border: 1px solid #331414; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .vp-pay-modal { background: #0d0d0d; border: 1px solid #1e1e1e; border-radius: 6px; width: 100%; max-width: 420px; overflow: hidden; }
        .vp-pay-worker-row { display: flex; align-items: center; gap: 12px; padding: 16px 24px; border-bottom: 1px solid #1a1a1a; }
        .vp-pay-worker-pic { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid #c89633; }
        .vp-pay-worker-pic-ph { width: 44px; height: 44px; border-radius: 50%; background: #1a1a1a; border: 2px solid #1e1e1e; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .vp-pay-body { padding: 20px 24px; }
        .vp-pay-field { margin-bottom: 14px; }
        .vp-pay-label { display: block; font-size: 11px; color: #444; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 5px; }
        .vp-pay-input { width: 100%; background: #111; border: 1px solid #1e1e1e; border-radius: 3px; padding: 10px 12px; color: #e0e0e0; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.15s; }
        .vp-pay-input:focus { border-color: #c89633; }
        .vp-pay-input::placeholder { color: #2a2a2a; }
        .vp-pay-summary { background: #111; border: 1px solid #1a1a1a; border-radius: 3px; padding: 14px 16px; margin-bottom: 16px; display: flex; align-items: baseline; justify-content: space-between; }
        .vp-pay-summary-label { font-size: 12px; color: #444; }
        .vp-pay-total { font-family: 'Bebas Neue', sans-serif; font-size: 26px; color: #c89633; letter-spacing: 1.5px; }
        .vp-pay-submit { width: 100%; padding: 12px; background: #00A550; color: #fff; border: none; border-radius: 3px; font-family: 'Bebas Neue', sans-serif; font-size: 17px; letter-spacing: 1.5px; cursor: pointer; transition: opacity 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .vp-pay-submit:hover { opacity: 0.88; }
        .vp-pay-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .vp-pay-status { margin-bottom: 14px; padding: 10px 14px; border-radius: 3px; font-size: 13px; line-height: 1.5; }
        .vp-pay-status.ok { background: #0d1f0d; color: #4caf65; border: 1px solid #143314; }
        .vp-pay-status.err { background: #1f0d0d; color: #e07070; border: 1px solid #331414; }
        .vp-mob-overlay { display: none; position: fixed; inset: 0; background: #000a; z-index: 99; }
        @media (max-width: 768px) {
          .vp-sidebar { position: fixed; top: 0; left: 0; transform: translateX(-100%); }
          .vp-sidebar.open { transform: translateX(0); }
          .vp-mob-overlay { display: block; }
          .vp-mob-overlay.open { opacity: 1; pointer-events: auto; }
          .vp-mobile-btn { display: flex; }
          .vp-content { padding: 20px 16px 80px; }
        }
      `}</style>

      <div className={`vp-mob-overlay ${mobileOpen ? "open" : ""}`}
        style={{ opacity: mobileOpen ? 1 : 0, pointerEvents: mobileOpen ? "auto" : "none" }}
        onClick={() => setMobileOpen(false)} />

      <div className="vp-root">
        <aside className={`vp-sidebar ${mobileOpen ? "open" : ""}`}>
          <div className="vp-sidebar-logo">SteelSmith<span>Client Portal</span></div>
          <div className="vp-sidebar-user">
            <div className="vp-avatar">
              {user?.profile_pic
                ? <img src={`${API_BASE}/static/images/${user.profile_pic}`} alt={user?.username} />
                : (user?.username?.[0] || "U").toUpperCase()}
            </div>
            <div>
              <div className="vp-sidebar-name">{user?.username || "User"}</div>
              <div className="vp-sidebar-role">Client</div>
            </div>
          </div>
          <nav className="vp-sidebar-nav">
            <div className="vp-nav-label">Menu</div>
            {NAV.map(item => (
              <button key={item.path} className={`vp-nav-btn ${item.path === "/view-plans" ? "active" : ""}`}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}>
                <span className="vp-nav-icon">{item.icon}</span>{item.label}
              </button>
            ))}
          </nav>
          <div className="vp-sidebar-bottom">
            <button className="vp-signout" onClick={signOut}>🚪 Sign Out</button>
          </div>
        </aside>

        <div className="vp-main">
          <div className="vp-topbar">
            <button className="vp-mobile-btn" onClick={() => setMobileOpen(true)}>☰</button>
            <div className="vp-topbar-title">My Plans</div>
            <div style={{ fontSize: 12, color: "#333" }}>{plans.length} plan{plans.length !== 1 ? "s" : ""}</div>
          </div>

          <div className="vp-content">
            <div className="vp-section-title">Your Plans</div>

            {loadingPlans ? (
              <div className="vp-loading">Loading plans...</div>
            ) : plans.length === 0 ? (
              <div className="vp-empty">
                <div className="vp-empty-icon">📋</div>
                <div>No plans yet.</div>
                <button className="vp-empty-cta" onClick={() => navigate("/add-plan")}>+ Create Your First Plan</button>
              </div>
            ) : (
              <div className="vp-plans-grid">
                {plans.map(plan => (
                  <div key={plan.id}
                    className={`vp-plan-card ${activePlan?.id === plan.id ? "active" : ""}`}
                    onClick={() => setActivePlan(activePlan?.id === plan.id ? null : plan)}>

                    {renamingId === plan.id ? (
                      <div className="vp-rename-wrap" onClick={e => e.stopPropagation()}>
                        <input className="vp-rename-input" value={renameVal}
                          onChange={e => setRenameVal(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && saveRename()} autoFocus />
                        <button className="vp-rename-save" onClick={saveRename}>Save</button>
                      </div>
                    ) : (
                      <div className="vp-plan-name">{plan.name}</div>
                    )}

                    <div className="vp-plan-date">Created {formatDate(plan.created_at)}</div>
                    <div className="vp-plan-worker-count">👷 {plan.workers.length} worker{plan.workers.length !== 1 ? "s" : ""}</div>

                    <div className="vp-plan-actions" onClick={e => e.stopPropagation()}>
                      <button className="vp-btn-ghost" onClick={() => { setRenamingId(plan.id); setRenameVal(plan.name); }}>✏️ Rename</button>
                      <button className="vp-btn-danger" onClick={() => setConfirmDelete(plan.id)}>🗑 Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activePlan && (
              <>
                <div className="vp-section-title">Editing: {activePlan.name}</div>
                <div className="vp-detail">
                  <div className="vp-detail-header">
                    <div>
                      <div className="vp-detail-title">{activePlan.name}</div>
                      <div className="vp-detail-subtitle">{activePlan.workers.length} worker{activePlan.workers.length !== 1 ? "s" : ""} · Created {formatDate(activePlan.created_at)}</div>
                    </div>
                    <button className="vp-add-worker-btn" onClick={() => { setShowAddModal(true); setSearch(""); setCategory(""); }}>
                      + Add Worker
                    </button>
                  </div>

                  {activePlan.workers.length === 0 ? (
                    <div className="vp-empty" style={{ padding: "40px 20px" }}>
                      <div className="vp-empty-icon">👷</div>
                      <div>No workers in this plan yet.</div>
                    </div>
                  ) : (
                    <div className="vp-workers-grid">
                      {activePlan.workers.map(w => (
                        <div className="vp-worker-card" key={w.id}>
                          {w.profile_pic
                            ? <img src={`${API_BASE}/static/images/${w.profile_pic}`} alt={w.username} className="vp-worker-pic" />
                            : <div className="vp-worker-pic-placeholder">👷</div>}
                          <div className="vp-worker-name">{w.username}</div>
                          {w.work && <div className="vp-worker-trade">{w.work}</div>}
                          <button className="vp-pay-btn" onClick={() => openPayModal(w)}>
                            💚 Pay via M-Pesa
                          </button>
                          <button className="vp-remove-btn" onClick={() => removeWorkerFromPlan(activePlan.id, w.id)}>
                            Remove from Plan
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="vp-overlay" onClick={() => setShowAddModal(false)}>
          <div className="vp-modal" onClick={e => e.stopPropagation()}>
            <div className="vp-modal-header">
              <div className="vp-modal-title">Add Worker to Plan</div>
              <button className="vp-modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="vp-modal-body">
              <div className="vp-modal-search-wrap">
                <span className="vp-modal-search-icon">🔍</span>
                <input className="vp-modal-search" placeholder="Search by name or trade..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="vp-modal-cats">
                {CATEGORIES.map(c => (
                  <button key={c.value} className={`vp-modal-cat ${category === c.value ? "active" : ""}`}
                    onClick={() => setCategory(c.value)}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
              {loadingWorkers ? (
                <div style={{ color: "#2a2a2a", textAlign: "center", padding: 40 }}>Loading workers...</div>
              ) : (
                <div className="vp-modal-grid">
                  {filteredWorkers.map(w => (
                    <div key={w.id} className={`vp-modal-worker-card ${isInPlan(w.id) ? "in-plan" : ""}`}>
                      {w.profile_pic
                        ? <img src={`${API_BASE}/static/images/${w.profile_pic}`} alt={w.username} className="vp-modal-pic" />
                        : <div className="vp-modal-pic-placeholder">👷</div>}
                      <div className="vp-modal-name">{w.username}</div>
                      {w.work && <div className="vp-modal-trade">{w.work}</div>}
                      <button className={`vp-modal-add-btn ${isInPlan(w.id) ? "already" : ""}`}
                        onClick={() => !isInPlan(w.id) && addWorkerToPlan(w)}
                        disabled={isInPlan(w.id)}>
                        {isInPlan(w.id) ? "✓ In Plan" : "+ Add"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="vp-confirm-overlay">
          <div className="vp-confirm-box">
            <div className="vp-confirm-title">Delete Plan?</div>
            <div className="vp-confirm-text">This will permanently delete the plan and cannot be undone.</div>
            <div className="vp-confirm-actions">
              <button className="vp-confirm-no" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="vp-confirm-yes" onClick={() => deletePlan(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {payModal && (
        <div className="vp-confirm-overlay" style={{ zIndex: 400 }} onClick={() => setPayModal(null)}>
          <div className="vp-pay-modal" onClick={e => e.stopPropagation()}>

            <div className="vp-modal-header">
              <div className="vp-modal-title">Pay via M-Pesa</div>
              <button className="vp-modal-close" onClick={() => setPayModal(null)}>✕</button>
            </div>

            <div className="vp-pay-worker-row">
              {payModal.worker.profile_pic
                ? <img src={`${API_BASE}/static/images/${payModal.worker.profile_pic}`} alt={payModal.worker.username} className="vp-pay-worker-pic" />
                : <div className="vp-pay-worker-pic-ph">👷</div>}
              <div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: "#e8e8e8", letterSpacing: 1 }}>{payModal.worker.username}</div>
                {payModal.worker.work && <div style={{ fontSize: 11, color: "#c89633", textTransform: "uppercase", letterSpacing: 1 }}>{payModal.worker.work}</div>}
              </div>
            </div>

            <div className="vp-pay-body">
              <div className="vp-pay-field">
                <label className="vp-pay-label">Daily rate (KSh)</label>
                <input className="vp-pay-input" type="number" min="1" placeholder="e.g. 1200"
                  value={payDailyRate} onChange={e => { setPayDailyRate(e.target.value); setPayStatus(null); }} />
              </div>
              <div className="vp-pay-field">
                <label className="vp-pay-label">Number of days worked</label>
                <input className="vp-pay-input" type="number" min="1" placeholder="e.g. 5"
                  value={payDays} onChange={e => { setPayDays(e.target.value); setPayStatus(null); }} />
              </div>
              <div className="vp-pay-field">
                <label className="vp-pay-label">📱 Paying number (STK push sent here)</label>
                <input className="vp-pay-input" type="tel" placeholder="e.g. 0712345678" maxLength={12}
                  value={payPhone} onChange={e => { setPayPhone(e.target.value); setPayStatus(null); }} />
                <div style={{ fontSize: 10, color: "#333", marginTop: 4 }}>Your M-Pesa number — you'll get a prompt to approve</div>
              </div>
              <div className="vp-pay-field">
                <label className="vp-pay-label">💸 Send to (worker's M-Pesa number)</label>
                <input className="vp-pay-input" type="tel" placeholder="e.g. 0798765432" maxLength={12}
                  value={payRecipientPhone} onChange={e => { setPayRecipientPhone(e.target.value); setPayStatus(null); }} />
                <div style={{ fontSize: 10, color: "#333", marginTop: 4 }}>Worker's number — payment will be sent here</div>
              </div>

              <div className="vp-pay-summary">
                <span className="vp-pay-summary-label">
                  {payTotal()
                    ? `KSh ${parseFloat(payDailyRate).toLocaleString()} × ${payDays} day${parseFloat(payDays) !== 1 ? "s" : ""}`
                    : "Enter rate and days above"}
                </span>
                <span className="vp-pay-total">
                  {payTotal() ? `KSh ${Math.round(payTotal()).toLocaleString()}` : "—"}
                </span>
              </div>

              {payStatus && (
                <div className={`vp-pay-status ${payStatus.ok ? "ok" : "err"}`}>{payStatus.msg}</div>
              )}

              <button className="vp-pay-submit" onClick={submitPayment} disabled={payLoading || !payTotal()}>
                {payLoading ? "⏳ Sending..." : <>💚 Send STK Push · {payTotal() ? `KSh ${Math.round(payTotal()).toLocaleString()}` : "—"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`vp-toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
}
