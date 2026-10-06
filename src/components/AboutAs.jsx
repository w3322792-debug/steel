import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import { apiFetch, parseJsonSafely } from "./apiClient";

const MAX_CHAT_MESSAGE_LENGTH = 1000;
const MAX_CHAT_HISTORY = 12;
const MAX_CHAT_REPLY_LENGTH = 4000;
const MAX_REVIEWS_DISPLAYED = 100;

const STARS = [1, 2, 3, 4, 5, 6];

const STAR_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Great",
  5: "Excellent",
  6: "Outstanding",
};

const FEATURES = [
  { icon: "🔥", title: "Skilled Tradespeople", desc: "Browse vetted welders, fabricators, blacksmiths, machinists and more — all in one place." },
  { icon: "📋", title: "Project Plans", desc: "Build project plans, assign multiple workers, and manage your construction team like a pro." },
  { icon: "💬", title: "Direct Requests", desc: "Send job requests straight to workers and get responses fast — no middlemen, no delays." },
  { icon: "📱", title: "M-Pesa Payments", desc: "Pay workers securely via M-Pesa STK push. Fast, reliable, and built for Kenya." },
  { icon: "🔒", title: "Secure Accounts", desc: "JWT-protected sessions for both clients and workers. Your data stays yours." },
  { icon: "⚡", title: "Real-time Updates", desc: "Accept, decline, and track requests in real time from any device." },
];

const WORKERS = [
  { job: "Welder",              desc: "Arc & MIG Welding",       img: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=520&fit=crop" },
  { job: "Fabricator",          desc: "Steel Fabrication",        img: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=520&fit=crop" },
  { job: "Blacksmith",          desc: "Forge & Hammer Work",      img: "https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=400&h=520&fit=crop" },
  { job: "Machinist",           desc: "CNC & Lathe Operation",    img: "https://images.unsplash.com/photo-1565194481237-a80a1d6c0c93?w=400&h=520&fit=crop" },
  { job: "Pipe Fitter",         desc: "Industrial Pipe Systems",  img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=520&fit=crop" },
  { job: "Structural Engineer", desc: "Steel Structure Design",   img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=520&fit=crop" },
  { job: "Metalworker",         desc: "Sheet Metal & Cutting",    img: "https://images.unsplash.com/photo-1565194481091-b5d5d3b3cc7e?w=400&h=520&fit=crop" },
  { job: "Painter",             desc: "Industrial Coating",       img: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&h=520&fit=crop" },
  { job: "Plumber",             desc: "Water & Gas Systems",      img: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&h=520&fit=crop" },
  { job: "Site Supervisor",     desc: "Project Coordination",     img: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400&h=520&fit=crop" },
];

const STATS = [
  { value: "500+", label: "Skilled Workers" },
  { value: "1,200+", label: "Jobs Completed" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "6", label: "Specialisations" },
];

const CAROUSEL_SLIDES = [
  { img: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1400&h=800&fit=crop",  tag: "Welding",       title: "Arc Welding Specialists",   desc: "Precision MIG and arc welding for structural and industrial steel projects across Kenya." },
  { img: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1400&h=800&fit=crop",  tag: "Fabrication",   title: "Steel Fabricators",          desc: "Custom steel fabrication from raw materials to finished structural components." },
  { img: "https://images.unsplash.com/photo-1565194481237-a80a1d6c0c93?w=1400&h=800&fit=crop",  tag: "Machining",     title: "CNC Machinists",             desc: "High-tolerance CNC and lathe operations for precision industrial parts." },
  { img: "https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=1400&h=800&fit=crop",  tag: "Blacksmithing", title: "Expert Blacksmiths",         desc: "Traditional forge and hammer work combined with modern metalworking techniques." },
  { img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&h=800&fit=crop",  tag: "Structural",    title: "Structural Engineers",       desc: "Design and oversight of large-scale steel structures for commercial construction." },
  { img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&h=800&fit=crop",    tag: "Pipe Fitting",  title: "Industrial Pipe Fitters",    desc: "Installation and maintenance of industrial pipe systems for water, gas, and oil." },
  { img: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=1400&h=800&fit=crop",  tag: "Supervision",   title: "Site Supervisors",           desc: "Experienced project coordinators managing teams and timelines on-site." },
  { img: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=1400&h=800&fit=crop",    tag: "Painting",      title: "Industrial Painters",        desc: "Anti-corrosion coating and industrial painting for long-lasting steel protection." },
  { img: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=1400&h=800&fit=crop",  tag: "Plumbing",      title: "Skilled Plumbers",           desc: "Comprehensive water and gas system installation for residential and commercial builds." },
  { img: "https://images.unsplash.com/photo-1565194481091-b5d5d3b3cc7e?w=1400&h=800&fit=crop",  tag: "Metalwork",     title: "Sheet Metal Workers",        desc: "Precision cutting, bending, and forming of sheet metal for industrial applications." },
];

// Keep the assistant system prompt on the server. Never ship it in the browser bundle.
function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function AboutAs() {
  // ── RATINGS STATE ──
  const [ratings, setRatings]       = useState([]);
  const [average, setAverage]       = useState(0);
  const [total, setTotal]           = useState(0);
  const [form, setForm]             = useState({ name: "", stars: 0, comment: "" });
  const [hover, setHover]           = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [toast, setToast]           = useState(null);

  // ── CAROUSEL STATE ──
  const [carouselIdx, setCarouselIdx] = useState(0);

  const carouselPrev = () => setCarouselIdx(i => (i === 0 ? CAROUSEL_SLIDES.length - 1 : i - 1));
  const carouselNext = () => setCarouselIdx(i => (i === CAROUSEL_SLIDES.length - 1 ? 0 : i + 1));

  useEffect(() => {
    const t = setInterval(carouselNext, 5000);
    return () => clearInterval(t);
  }, []);

  // ── CHATBOT STATE ──
  const [chatOpen, setChatOpen]         = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "Hey there! I'm **Smith**, your SteelSmith assistant. Ask me anything about the platform — finding workers, posting jobs, payments, and more!" }
  ]);
  const [chatInput, setChatInput]       = useState("");
  const [chatLoading, setChatLoading]   = useState(false);
  const chatEndRef                      = useRef(null);

  useEffect(() => {
    if (chatOpen && chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatOpen]);

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    if (text.length > MAX_CHAT_MESSAGE_LENGTH) {
      showToast("Message is too long.", "error");
      return;
    }

    setChatInput("");
    const userMsg = { role: "user", content: text };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setChatLoading(true);

    try {
      const messages = updated
        .slice(-MAX_CHAT_HISTORY)
        .map(m => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content).slice(0, MAX_CHAT_MESSAGE_LENGTH),
        }));

      const res = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const data = await parseJsonSafely(res);
      const reply = typeof data.reply === "string"
        ? data.reply.slice(0, MAX_CHAT_REPLY_LENGTH)
        : "Sorry, I couldn't respond. Please try again.";

      setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠️ I couldn't reach the assistant. Please try again."
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── RATINGS LOGIC ──
  useEffect(() => { fetchRatings(); }, []);

  const fetchRatings = async () => {
    try {
      const res = await apiFetch("/api/ratings");
      if (!res.ok) throw new Error("Failed to fetch ratings");

      const json = await parseJsonSafely(res);
      const safeRatings = Array.isArray(json.ratings)
        ? json.ratings
            .filter(r =>
              r &&
              typeof r === "object" &&
              typeof r.name === "string" &&
              typeof r.comment === "string" &&
              Number.isInteger(r.stars) &&
              r.stars >= 1 &&
              r.stars <= 6
            )
            .slice(0, MAX_REVIEWS_DISPLAYED)
        : [];

      setRatings(safeRatings);
      setAverage(typeof json.average === "number" && Number.isFinite(json.average) ? json.average : 0);
      setTotal(Number.isInteger(json.total) && json.total >= 0 ? json.total : safeRatings.length);
    } catch {
      setRatings([]);
      setAverage(0);
      setTotal(0);
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async () => {
    const name = form.name.trim();
    const comment = form.comment.trim();

    if (!name || name.length > 80) {
      showToast("Name must be between 1 and 80 characters.", "error");
      return;
    }
    if (!Number.isInteger(form.stars) || form.stars < 1 || form.stars > 6) {
      showToast("Please select a valid star rating.", "error");
      return;
    }
    if (!comment || comment.length > 1000) {
      showToast("Review must be between 1 and 1000 characters.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, stars: form.stars, comment }),
      });
      const json = await parseJsonSafely(res);

      if (res.ok) {
        setSubmitted(true);
        setForm({ name: "", stars: 0, comment: "" });
        await fetchRatings();
        showToast("Thank you for your review!", "success");
      } else {
        showToast(json.error || "Submission failed.", "error");
      }
    } catch {
      showToast("Could not reach the server.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const starColor = (s) => {
    if (s <= 2) return "#e07070";
    if (s <= 4) return "#c89633";
    return "#4caf65";
  };

  const displayStar = hover || form.stars;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #080808; color: #e0e0e0; font-family: 'DM Sans', sans-serif; }

        /* ── NAV ── */
        .ab-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: #0d0d0df2; backdrop-filter: blur(12px);
          border-bottom: 1px solid #1a1a1a;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 200px; height: 139px;
        }
        .ab-nav-logo { font-family: 'Bebas Neue', sans-serif; font-size: 22px; color: #c89633; letter-spacing: 3px; }
        .ab-nav-links { display: flex; gap: 24px; align-items: center; }
        .ab-nav-link { font-size: 13px; color: #aaa; text-decoration: none; transition: color 0.2s; cursor: pointer; background: none; border: none; font-family: 'DM Sans', sans-serif; }
        .ab-nav-link:hover { color: #f0f0f0; }
        .ab-nav-cta { padding: 6px 18px; background: #c89633; color: #080808; border-radius: 3px; font-family: 'Bebas Neue', sans-serif; font-size: 15px; letter-spacing: 1.5px; text-decoration: none; transition: opacity 0.2s; border: none; cursor: pointer; }
        .ab-nav-cta:hover { opacity: 0.85; }

        /* ── HERO ── */
        .ab-hero {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center; text-align: center;
          padding: 140px 24px 60px; position: relative; overflow: hidden;
        }
        .ab-hero::before {
          content: ''; position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 50% 0%, #c8963318 0%, transparent 70%),
            repeating-linear-gradient(0deg, transparent, transparent 60px, #ffffff04 60px, #ffffff04 61px),
            repeating-linear-gradient(90deg, transparent, transparent 60px, #ffffff04 60px, #ffffff04 61px);
          pointer-events: none;
        }
        .ab-hero-eyebrow { font-size: 11px; color: #c89633; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 20px; }
        .ab-hero-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(56px, 10vw, 120px);
          line-height: 0.92; letter-spacing: 2px; color: #e8e8e8; margin-bottom: 28px;
        }
        .ab-hero-title span { color: #c89633; }
        .ab-hero-desc { font-size: 16px; color: #555; max-width: 560px; line-height: 1.7; margin-bottom: 40px; }
        .ab-hero-btns { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
        .ab-btn-gold { padding: 14px 32px; background: #c89633; color: #080808; border: none; border-radius: 3px; font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 2px; cursor: pointer; transition: opacity 0.2s, transform 0.1s; text-decoration: none; }
        .ab-btn-gold:hover { opacity: 0.88; }
        .ab-btn-gold:active { transform: scale(0.98); }
        .ab-btn-outline { padding: 14px 32px; background: transparent; color: #c89633; border: 1px solid #c89633; border-radius: 3px; font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 2px; cursor: pointer; transition: all 0.2s; text-decoration: none; }
        .ab-btn-outline:hover { background: #c8963312; }

        /* ── STATS ── */
        .ab-stats { display: flex; justify-content: center; flex-wrap: wrap; gap: 0; border-top: 1px solid #1a1a1a; border-bottom: 1px solid #1a1a1a; background: #0d0d0d; }
        .ab-stat { flex: 1; min-width: 160px; padding: 36px 24px; text-align: center; border-right: 1px solid #1a1a1a; }
        .ab-stat:last-child { border-right: none; }
        .ab-stat-val { font-family: 'Bebas Neue', sans-serif; font-size: 48px; color: #c89633; letter-spacing: 2px; line-height: 1; }
        .ab-stat-label { font-size: 11px; color: #333; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px; }

        /* ── CAROUSEL ── */
        .ab-carousel-section { padding: 100px 0; background: #080808; border-top: 1px solid #1a1a1a; border-bottom: 1px solid #1a1a1a; overflow: hidden; }
        .ab-carousel-header { text-align: center; padding: 0 40px; margin-bottom: 52px; }
        .ab-carousel-eyebrow { font-size: 10px; color: #c89633; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 14px; }
        .ab-carousel-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(36px, 5vw, 64px); color: #e8e8e8; letter-spacing: 2px; line-height: 1; }
        .ab-carousel-sub { font-size: 14px; color: #444; margin-top: 14px; line-height: 1.7; }
        .ab-carousel-viewport { position: relative; overflow: hidden; }
        .ab-carousel-track { display: flex; transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1); }
        .ab-carousel-slide { min-width: 100%; position: relative; height: clamp(340px, 55vw, 620px); flex-shrink: 0; }
        .ab-carousel-img { width: 100%; height: 100%; object-fit: cover; display: block; filter: brightness(0.6) saturate(0.85); }
        .ab-carousel-caption { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, #080808f5 0%, #08080866 55%, transparent 100%); padding: 48px 56px 40px; }
        .ab-carousel-cap-tag { font-size: 10px; color: #c89633; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px; }
        .ab-carousel-cap-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(28px, 4vw, 52px); color: #e8e8e8; letter-spacing: 2px; line-height: 1; margin-bottom: 8px; }
        .ab-carousel-cap-desc { font-size: 14px; color: #888; max-width: 480px; line-height: 1.6; }
        .ab-carousel-btn {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 52px; height: 52px; background: #0d0d0dcc; border: 1px solid #2a2a2a;
          border-radius: 3px; color: #aaa; font-size: 20px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
          z-index: 10; backdrop-filter: blur(8px);
        }
        .ab-carousel-btn:hover { background: #c89633; border-color: #c89633; color: #080808; }
        .ab-carousel-btn:active { transform: translateY(-50%) scale(0.95); }
        .ab-carousel-prev { left: 20px; }
        .ab-carousel-next { right: 20px; }
        .ab-carousel-dots { display: flex; justify-content: center; align-items: center; gap: 8px; padding: 28px 0 0; }
        .ab-carousel-dot { width: 6px; height: 6px; border-radius: 50%; background: #2a2a2a; border: none; cursor: pointer; transition: background 0.25s, transform 0.25s; padding: 0; }
        .ab-carousel-dot.active { background: #c89633; transform: scale(1.5); }
        .ab-carousel-dot:hover:not(.active) { background: #555; }
        .ab-carousel-counter { position: absolute; top: 20px; right: 20px; background: #0d0d0dcc; border: 1px solid #1e1e1e; backdrop-filter: blur(8px); border-radius: 3px; padding: 6px 14px; font-size: 11px; color: #555; letter-spacing: 2px; font-family: 'DM Sans', sans-serif; z-index: 10; }
        .ab-carousel-counter span { color: #c89633; }

        /* ── SECTION ── */
        .ab-section { padding: 100px 40px; max-width: 1100px; margin: 0 auto; }
        .ab-section-eyebrow { font-size: 10px; color: #c89633; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 14px; }
        .ab-section-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(36px, 5vw, 64px); color: #e8e8e8; letter-spacing: 2px; line-height: 1; margin-bottom: 16px; }
        .ab-section-sub { font-size: 15px; color: #444; max-width: 520px; line-height: 1.7; margin-bottom: 56px; }

        /* ── FEATURES ── */
        .ab-features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1px; background: #1a1a1a; border: 1px solid #1a1a1a; border-radius: 4px; overflow: hidden; }
        .ab-feature { background: #0d0d0d; padding: 32px; transition: background 0.2s; }
        .ab-feature:hover { background: #111; }
        .ab-feature-icon { font-size: 28px; margin-bottom: 16px; }
        .ab-feature-title { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: #e8e8e8; letter-spacing: 1px; margin-bottom: 8px; }
        .ab-feature-desc { font-size: 13px; color: #444; line-height: 1.7; }

        /* ── MISSION ── */
        .ab-mission { background: #0d0d0d; border-top: 1px solid #1a1a1a; border-bottom: 1px solid #1a1a1a; padding: 100px 40px; text-align: center; }
        .ab-mission-quote { font-family: 'Bebas Neue', sans-serif; font-size: clamp(28px, 4vw, 52px); color: #e8e8e8; letter-spacing: 1.5px; line-height: 1.15; max-width: 820px; margin: 0 auto 24px; }
        .ab-mission-quote span { color: #c89633; }
        .ab-mission-attr { font-size: 12px; color: #2a2a2a; letter-spacing: 2px; text-transform: uppercase; }

        /* ── MARQUEE ── */
        .ab-marquee-section { padding: 80px 0; overflow: hidden; background: #080808; border-top: 1px solid #1a1a1a; border-bottom: 1px solid #1a1a1a; }
        .ab-marquee-eyebrow { font-size: 10px; color: #c89633; letter-spacing: 4px; text-transform: uppercase; text-align: center; margin-bottom: 8px; }
        .ab-marquee-heading { font-family: 'Bebas Neue', sans-serif; font-size: clamp(28px, 4vw, 48px); color: #e8e8e8; letter-spacing: 2px; text-align: center; margin-bottom: 48px; }
        .ab-marquee-track-wrap { mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%); -webkit-mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%); }
        .ab-marquee-track { display: flex; gap: 20px; width: max-content; animation: marqueeScroll 40s linear infinite; }
        .ab-marquee-track:hover { animation-play-state: paused; }
        @keyframes marqueeScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .ab-marquee-card { width: 240px; height: 320px; border-radius: 4px; overflow: hidden; position: relative; flex-shrink: 0; border: 1px solid #1e1e1e; transition: transform 0.35s ease, border-color 0.3s; }
        .ab-marquee-card:hover { transform: scale(1.04); border-color: #c89633; }
        .ab-marquee-img { width: 100%; height: 100%; object-fit: cover; display: block; filter: brightness(0.65) saturate(0.8); transition: filter 0.35s; }
        .ab-marquee-card:hover .ab-marquee-img { filter: brightness(0.82) saturate(1.1); }
        .ab-marquee-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, #080808f0 0%, #08080866 60%, transparent 100%); padding: 20px 16px 18px; }
        .ab-marquee-job { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: #e8e8e8; letter-spacing: 1.5px; margin-bottom: 3px; }
        .ab-marquee-desc { font-size: 11px; color: #c89633; letter-spacing: 1px; text-transform: uppercase; }
        .ab-marquee-badge { position: absolute; top: 12px; right: 12px; background: #c8963322; border: 1px solid #c8963555; border-radius: 2px; padding: 3px 8px; font-size: 10px; color: #c89633; letter-spacing: 1px; text-transform: uppercase; }

        /* ── RATINGS SECTION ── */
        .ab-ratings-section { padding: 100px 40px; max-width: 1100px; margin: 0 auto; }
        .ab-ratings-summary { display: flex; align-items: center; gap: 40px; margin-bottom: 56px; background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 4px; padding: 32px 36px; flex-wrap: wrap; }
        .ab-avg-num { font-family: 'Bebas Neue', sans-serif; font-size: 72px; color: #c89633; letter-spacing: 2px; line-height: 1; }
        .ab-avg-stars { display: flex; gap: 4px; margin: 6px 0; }
        .ab-avg-star { font-size: 22px; }
        .ab-avg-label { font-size: 12px; color: #333; letter-spacing: 1px; text-transform: uppercase; }
        .ab-rating-bars { flex: 1; min-width: 220px; display: flex; flex-direction: column; gap: 6px; }
        .ab-bar-row { display: flex; align-items: center; gap: 10px; }
        .ab-bar-label { font-size: 11px; color: #444; width: 42px; text-align: right; flex-shrink: 0; }
        .ab-bar-track { flex: 1; height: 6px; background: #1a1a1a; border-radius: 3px; overflow: hidden; }
        .ab-bar-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
        .ab-bar-count { font-size: 11px; color: #333; width: 24px; flex-shrink: 0; }
        .ab-reviews-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; margin-bottom: 56px; }
        .ab-review-card { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 4px; padding: 22px; transition: border-color 0.2s; }
        .ab-review-card:hover { border-color: #2a2a2a; }
        .ab-review-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .ab-review-name { font-family: 'Bebas Neue', sans-serif; font-size: 17px; color: #e8e8e8; letter-spacing: 1px; }
        .ab-review-stars { display: flex; gap: 2px; }
        .ab-review-star { font-size: 14px; }
        .ab-review-comment { font-size: 13px; color: #555; line-height: 1.65; margin-bottom: 10px; }
        .ab-review-time { font-size: 10px; color: #2a2a2a; letter-spacing: 1px; text-transform: uppercase; }
        .ab-rate-form { background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 4px; padding: 36px; }
        .ab-rate-title { font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: #e8e8e8; letter-spacing: 2px; margin-bottom: 6px; }
        .ab-rate-sub { font-size: 13px; color: #333; margin-bottom: 28px; }
        .ab-stars-wrap { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
        .ab-star-btn { font-size: 36px; background: transparent; border: none; cursor: pointer; transition: transform 0.15s, filter 0.15s; line-height: 1; filter: grayscale(1) brightness(0.4); }
        .ab-star-btn.lit { filter: grayscale(0) brightness(1); transform: scale(1.1); }
        .ab-star-btn:hover { transform: scale(1.2); }
        .ab-star-label { font-size: 12px; color: #c89633; letter-spacing: 1px; text-transform: uppercase; height: 18px; margin-bottom: 24px; }
        .ab-rate-field { margin-bottom: 16px; }
        .ab-rate-label { display: block; font-size: 10px; color: #333; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 7px; }
        .ab-rate-input { width: 100%; background: #111; border: 1px solid #1e1e1e; border-radius: 3px; padding: 12px 16px; color: #e0e0e0; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s; }
        .ab-rate-input:focus { border-color: #c89633; }
        .ab-rate-input::placeholder { color: #2a2a2a; }
        textarea.ab-rate-input { resize: vertical; min-height: 90px; }
        .ab-submit-btn { width: 100%; padding: 14px; background: #c89633; color: #080808; border: none; border-radius: 3px; font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 2px; cursor: pointer; transition: opacity 0.2s, transform 0.1s; margin-top: 8px; }
        .ab-submit-btn:hover { opacity: 0.88; }
        .ab-submit-btn:active { transform: scale(0.98); }
        .ab-submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .ab-success-box { text-align: center; padding: 40px 20px; }
        .ab-success-icon { font-size: 48px; margin-bottom: 12px; }
        .ab-success-title { font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: #4caf65; letter-spacing: 2px; margin-bottom: 8px; }
        .ab-success-sub { font-size: 13px; color: #444; }
        .ab-rate-again { margin-top: 16px; background: transparent; border: 1px solid #1e1e1e; color: #555; padding: 9px 20px; border-radius: 3px; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.15s; }
        .ab-rate-again:hover { border-color: #c89633; color: #c89633; }

        /* ── TOAST ── */
        .ab-toast { position: fixed; bottom: 100px; right: 28px; padding: 12px 20px; border-radius: 4px; font-size: 13px; z-index: 900; animation: slideUp 0.3s ease; }
        .ab-toast.success { background: #0d1f0d; color: #4caf65; border: 1px solid #143314; }
        .ab-toast.error   { background: #1f0d0d; color: #e07070; border: 1px solid #331414; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* ── CHATBOT ── */
        .ab-chat-fab {
          position: fixed; bottom: 28px; right: 28px; z-index: 1000;
          width: 58px; height: 58px; border-radius: 50%;
          background: #c89633; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; box-shadow: 0 4px 24px #c8963355;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .ab-chat-fab:hover { transform: scale(1.08); box-shadow: 0 6px 32px #c8963377; }
        .ab-chat-fab:active { transform: scale(0.96); }
        .ab-chat-badge { position: absolute; top: -2px; right: -2px; width: 16px; height: 16px; background: #4caf65; border-radius: 50%; border: 2px solid #080808; }
        .ab-chat-window {
          position: fixed; bottom: 100px; right: 28px; z-index: 1000;
          width: 360px; max-height: 520px; background: #0d0d0d;
          border: 1px solid #2a2a2a; border-radius: 8px;
          display: flex; flex-direction: column;
          box-shadow: 0 16px 64px #000000cc;
          animation: chatSlideUp 0.25s cubic-bezier(0.4,0,0.2,1); overflow: hidden;
        }
        @keyframes chatSlideUp { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .ab-chat-header { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #111; border-bottom: 1px solid #1e1e1e; flex-shrink: 0; }
        .ab-chat-avatar { width: 38px; height: 38px; border-radius: 50%; background: #c89633; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .ab-chat-header-info { flex: 1; min-width: 0; }
        .ab-chat-header-name { font-family: 'Bebas Neue', sans-serif; font-size: 17px; color: #e8e8e8; letter-spacing: 1px; line-height: 1; }
        .ab-chat-header-status { font-size: 11px; color: #4caf65; letter-spacing: 0.5px; margin-top: 2px; display: flex; align-items: center; gap: 5px; }
        .ab-chat-header-status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #4caf65; display: inline-block; }
        .ab-chat-close { background: transparent; border: none; color: #333; font-size: 20px; cursor: pointer; padding: 4px; transition: color 0.15s; line-height: 1; }
        .ab-chat-close:hover { color: #e8e8e8; }
        .ab-chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; scrollbar-width: thin; scrollbar-color: #1e1e1e transparent; }
        .ab-chat-messages::-webkit-scrollbar { width: 4px; }
        .ab-chat-messages::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
        .ab-chat-bubble-wrap { display: flex; gap: 8px; align-items: flex-end; }
        .ab-chat-bubble-wrap.user { flex-direction: row-reverse; }
        .ab-chat-bubble-avatar { width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 12px; }
        .ab-chat-bubble-avatar.bot { background: #c8963322; color: #c89633; border: 1px solid #c8963344; }
        .ab-chat-bubble-avatar.user-av { background: #1e1e1e; color: #666; }
        .ab-chat-bubble { max-width: 78%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.65; word-break: break-word; }
        .ab-chat-bubble.bot { background: #161616; border: 1px solid #1e1e1e; color: #ccc; border-bottom-left-radius: 4px; }
        .ab-chat-bubble.user { background: #c89633; color: #080808; border-bottom-right-radius: 4px; font-weight: 500; }
        .ab-chat-typing { display: flex; align-items: center; gap: 4px; padding: 4px 2px; }
        .ab-chat-typing span { width: 6px; height: 6px; border-radius: 50%; background: #c89633; animation: typingDot 1.2s infinite; }
        .ab-chat-typing span:nth-child(2) { animation-delay: 0.2s; }
        .ab-chat-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingDot { 0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1.2); } }
        .ab-chat-suggestions { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 16px 4px; flex-shrink: 0; border-top: 1px solid #141414; }
        .ab-chat-suggestion { background: transparent; border: 1px solid #1e1e1e; color: #555; font-size: 11px; padding: 5px 10px; border-radius: 20px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; white-space: nowrap; }
        .ab-chat-suggestion:hover { border-color: #c89633; color: #c89633; background: #c8963308; }
        .ab-chat-input-row { display: flex; gap: 8px; padding: 12px 14px; border-top: 1px solid #1a1a1a; flex-shrink: 0; background: #0d0d0d; }
        .ab-chat-input { flex: 1; background: #111; border: 1px solid #1e1e1e; border-radius: 20px; padding: 9px 14px; color: #e0e0e0; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; transition: border-color 0.2s; }
        .ab-chat-input:focus { border-color: #c89633; }
        .ab-chat-input::placeholder { color: #2a2a2a; }
        .ab-chat-send { width: 36px; height: 36px; border-radius: 50%; background: #c89633; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; transition: opacity 0.2s, transform 0.1s; }
        .ab-chat-send:hover { opacity: 0.85; }
        .ab-chat-send:active { transform: scale(0.93); }
        .ab-chat-send:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── FOOTER ── */
        .ab-footer { background: #0d0d0d; border-top: 1px solid #1a1a1a; padding: 48px 40px; text-align: center; }
        .ab-footer-logo { font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: #c89633; letter-spacing: 3px; margin-bottom: 10px; }
        .ab-footer-sub { font-size: 12px; color: #2a2a2a; letter-spacing: 1px; }

        @media (max-width: 768px) {
          .ab-nav { padding: 0 20px; }
          .ab-section, .ab-ratings-section { padding: 60px 20px; }
          .ab-stats { flex-direction: column; }
          .ab-stat { border-right: none; border-bottom: 1px solid #1a1a1a; }
          .ab-ratings-summary { flex-direction: column; gap: 24px; padding: 24px; }
          .ab-avg-num { font-size: 56px; }
          .ab-chat-window { width: calc(100vw - 32px); right: 16px; bottom: 90px; }
          .ab-chat-fab { right: 16px; bottom: 20px; }
          .ab-carousel-caption { padding: 32px 24px 24px; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className="ab-nav">
        <div className="ab-nav-logo">SteelSmith</div>
        <div className="ab-nav-links">
          <button className="ab-nav-link" onClick={() => document.getElementById("features").scrollIntoView({ behavior: "smooth" })}>Features</button>
          <button className="ab-nav-link" onClick={() => document.getElementById("reviews").scrollIntoView({ behavior: "smooth" })}>Reviews</button>
          <Link to="/signup-as" className="ab-nav-cta">Get Started</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="ab-hero">
        <div className="ab-hero-eyebrow">Kenya's Construction Labour Platform</div>
        <h1 className="ab-hero-title">
          BUILT FOR<br /><span>STEEL.</span><br />BUILT FOR YOU.
        </h1>
        <p className="ab-hero-desc">
          SteelSmith connects construction clients with skilled tradespeople —
          welders, fabricators, blacksmiths and more. Find the right worker,
          send a request, and pay instantly via M-Pesa.
        </p>
        <div className="ab-hero-btns">
          <Link to="/signup-as" className="ab-btn-gold">Find a Worker</Link>
          <Link to="/worker-signup" className="ab-btn-outline">Join as Worker</Link>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="ab-stats">
        {STATS.map(s => (
          <div className="ab-stat" key={s.label}>
            <div className="ab-stat-val">{s.value}</div>
            <div className="ab-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── CAROUSEL ── */}
      <section className="ab-carousel-section">
        <div className="ab-carousel-header">
          <div className="ab-carousel-eyebrow">In the Field</div>
          <div className="ab-carousel-title">WORKERS IN ACTION</div>
          <div className="ab-carousel-sub">A glimpse into the skilled tradespeople who power Kenya's construction industry.</div>
        </div>
        <div className="ab-carousel-viewport">
          <div className="ab-carousel-track" style={{ transform: `translateX(-${carouselIdx * 100}%)` }}>
            {CAROUSEL_SLIDES.map((slide, i) => (
              <div className="ab-carousel-slide" key={i}>
                <img
                  src={slide.img}
                  alt={slide.title}
                  className="ab-carousel-img"
                  onError={e => { e.currentTarget.style.display = "none"; }}
                />
                <div className="ab-carousel-caption">
                  <div className="ab-carousel-cap-tag">{slide.tag}</div>
                  <div className="ab-carousel-cap-title">{slide.title}</div>
                  <div className="ab-carousel-cap-desc">{slide.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="ab-carousel-btn ab-carousel-prev" onClick={carouselPrev} aria-label="Previous slide">&#8592;</button>
          <button className="ab-carousel-btn ab-carousel-next" onClick={carouselNext} aria-label="Next slide">&#8594;</button>
          <div className="ab-carousel-counter"><span>{carouselIdx + 1}</span> / {CAROUSEL_SLIDES.length}</div>
        </div>
        <div className="ab-carousel-dots">
          {CAROUSEL_SLIDES.map((_, i) => (
            <button
              key={i}
              className={`ab-carousel-dot ${i === carouselIdx ? "active" : ""}`}
              onClick={() => setCarouselIdx(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <section className="ab-marquee-section">
        <div className="ab-marquee-eyebrow">Our Talent</div>
        <div className="ab-marquee-heading">MEET THE PROFESSIONALS</div>
        <div className="ab-marquee-track-wrap">
          <div className="ab-marquee-track">
            {[...WORKERS, ...WORKERS].map((w, i) => (
              <div className="ab-marquee-card" key={i}>
                <img
                  src={w.img}
                  alt={w.job}
                  className="ab-marquee-img"
                  onError={e => { e.currentTarget.style.display = "none"; }}
                />
                <div className="ab-marquee-badge">Pro</div>
                <div className="ab-marquee-overlay">
                  <div className="ab-marquee-job">{w.job}</div>
                  <div className="ab-marquee-desc">{w.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="ab-section" id="features">
        <div className="ab-section-eyebrow">What We Offer</div>
        <div className="ab-section-title">EVERYTHING YOU<br />NEED ON SITE</div>
        <div className="ab-section-sub">
          From hiring to payment, SteelSmith handles every step of connecting
          clients with Kenya's best construction professionals.
        </div>
        <div className="ab-features-grid">
          {FEATURES.map(f => (
            <div className="ab-feature" key={f.title}>
              <div className="ab-feature-icon">{f.icon}</div>
              <div className="ab-feature-title">{f.title}</div>
              <div className="ab-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MISSION ── */}
      <div className="ab-mission">
        <div className="ab-mission-quote">
          "We believe every builder deserves a <span>reliable team</span>,
          and every skilled worker deserves a <span>fair opportunity</span>."
        </div>
        <div className="ab-mission-attr">— The SteelSmith Team</div>
      </div>

      {/* ── RATINGS ── */}
      <section className="ab-ratings-section" id="reviews">
        <div className="ab-section-eyebrow">Community Reviews</div>
        <div className="ab-section-title">WHAT PEOPLE<br />ARE SAYING</div>
        <div className="ab-section-sub" style={{ marginBottom: 40 }}>
          Real feedback from clients and workers who've used SteelSmith.
        </div>

        {total > 0 && (
          <div className="ab-ratings-summary">
            <div>
              <div className="ab-avg-num">{average}</div>
              <div className="ab-avg-stars">
                {STARS.map(s => (
                  <span key={s} className="ab-avg-star" style={{ color: s <= Math.round(average) ? "#c89633" : "#2a2a2a" }}>★</span>
                ))}
              </div>
              <div className="ab-avg-label">out of 6 · {total} review{total !== 1 ? "s" : ""}</div>
            </div>
            <div className="ab-rating-bars">
              {[6, 5, 4, 3, 2, 1].map(s => {
                const count = ratings.filter(r => r.stars === s).length;
                const pct   = total ? (count / total) * 100 : 0;
                return (
                  <div className="ab-bar-row" key={s}>
                    <span className="ab-bar-label">{s} ★</span>
                    <div className="ab-bar-track">
                      <div className="ab-bar-fill" style={{ width: `${pct}%`, background: starColor(s) }} />
                    </div>
                    <span className="ab-bar-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {ratings.length > 0 && (
          <div className="ab-reviews-grid">
            {ratings.map(r => (
              <div className="ab-review-card" key={r.id}>
                <div className="ab-review-header">
                  <div className="ab-review-name">{r.name}</div>
                  <div className="ab-review-stars">
                    {STARS.map(s => (
                      <span key={s} className="ab-review-star" style={{ color: s <= r.stars ? starColor(r.stars) : "#1e1e1e" }}>★</span>
                    ))}
                  </div>
                </div>
                {r.comment && <div className="ab-review-comment">"{r.comment}"</div>}
                <div className="ab-review-time">{timeAgo(r.created_at)}</div>
              </div>
            ))}
          </div>
        )}

        <div className="ab-rate-form">
          {submitted ? (
            <div className="ab-success-box">
              <div className="ab-success-icon">⭐</div>
              <div className="ab-success-title">Review Submitted!</div>
              <div className="ab-success-sub">Thank you — your feedback helps the SteelSmith community.</div>
              <button className="ab-rate-again" onClick={() => setSubmitted(false)}>Leave Another Review</button>
            </div>
          ) : (
            <>
              <div className="ab-rate-title">Leave a Review</div>
              <div className="ab-rate-sub">Rate your experience with SteelSmith (1–6 stars)</div>
              <div className="ab-stars-wrap">
                {STARS.map(s => (
                  <button
                    key={s}
                    className={`ab-star-btn ${s <= displayStar ? "lit" : ""}`}
                    style={s <= displayStar ? { filter: `drop-shadow(0 0 6px ${starColor(displayStar)}88)` } : {}}
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setForm({ ...form, stars: s })}
                    title={`${s} star${s !== 1 ? "s" : ""} — ${STAR_LABELS[s]}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div className="ab-star-label">
                {displayStar ? `${displayStar} Star${displayStar !== 1 ? "s" : ""} — ${STAR_LABELS[displayStar]}` : ""}
              </div>
              <div className="ab-rate-field">
                <label className="ab-rate-label">Your Name</label>
                <input className="ab-rate-input" type="text" placeholder="e.g. John Kamau"
                  value={form.name} maxLength={80} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="ab-rate-field">
                <label className="ab-rate-label">Your Review</label>
                <textarea className="ab-rate-input" placeholder="Tell others about your experience with SteelSmith..."
                  value={form.comment} maxLength={1000} onChange={e => setForm({ ...form, comment: e.target.value })} />
              </div>
              <button className="ab-submit-btn" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Review →"}
              </button>
            </>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="ab-footer">
        <div className="ab-footer-logo">SteelSmith</div>
        <div className="ab-footer-sub">© 2024 Steel Smith Construction Corporation · All rights reserved</div>
      </footer>

      {/* ── CHATBOT WINDOW ── */}
      {chatOpen && (
        <div className="ab-chat-window">
          <div className="ab-chat-header">
            <div className="ab-chat-avatar">🤖</div>
            <div className="ab-chat-header-info">
              <div className="ab-chat-header-name">Smith</div>
              <div className="ab-chat-header-status">Online — SteelSmith Assistant</div>
            </div>
            <button className="ab-chat-close" onClick={() => setChatOpen(false)}>✕</button>
          </div>

          <div className="ab-chat-messages">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`ab-chat-bubble-wrap ${msg.role === "user" ? "user" : ""}`}>
                <div className={`ab-chat-bubble-avatar ${msg.role === "user" ? "user-av" : "bot"}`}>
                  {msg.role === "user" ? "👤" : "🤖"}
                </div>
                <div className={`ab-chat-bubble ${msg.role === "user" ? "user" : "bot"}`}>
                  {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                    part.startsWith("**") && part.endsWith("**")
                      ? <strong key={j} style={{ color: msg.role === "assistant" ? "#c89633" : "#080808" }}>{part.slice(2, -2)}</strong>
                      : part.split("\n").map((line, k, arr) => (
                          <span key={k}>{line}{k < arr.length - 1 && <br />}</span>
                        ))
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="ab-chat-bubble-wrap">
                <div className="ab-chat-bubble-avatar bot">🤖</div>
                <div className="ab-chat-bubble bot">
                  <div className="ab-chat-typing"><span /><span /><span /></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {chatMessages.length <= 2 && (
            <div className="ab-chat-suggestions">
              {["How do I sign up?", "How does payment work?", "What workers are available?", "How do I post a job?"].map(s => (
                <button key={s} className="ab-chat-suggestion" onClick={() => setChatInput(s)}>{s}</button>
              ))}
            </div>
          )}

          <div className="ab-chat-input-row">
            <input
              className="ab-chat-input"
              placeholder="Ask me anything..."
              value={chatInput}
              maxLength={MAX_CHAT_MESSAGE_LENGTH}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendChatMessage()}
              disabled={chatLoading}
            />
            <button className="ab-chat-send" onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()}>➤</button>
          </div>
        </div>
      )}

      {/* ── CHATBOT FAB ── */}
      <button className="ab-chat-fab" onClick={() => setChatOpen(o => !o)} aria-label="Open chat assistant">
        {chatOpen ? "✕" : "💬"}
        {!chatOpen && <div className="ab-chat-badge" />}
      </button>

      {toast && <div className={`ab-toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
