import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [signinOpen, setSigninOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const signinRef = useRef(null);
  const signupRef = useRef(null);
  const navigate  = useNavigate();
  const location  = useLocation();

  // Frosted glass effect on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (signinRef.current && !signinRef.current.contains(e.target)) setSigninOpen(false);
      if (signupRef.current && !signupRef.current.contains(e.target)) setSignupOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); setSigninOpen(false); setSignupOpen(false); }, [location]);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

        .nb-root {
          position: fixed; top: 0; left: 0; right: 0; z-index: 999;
          height: 48px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px;
          transition: background 0.3s, border-color 0.3s, backdrop-filter 0.3s;
          font-family: 'DM Sans', sans-serif;
        }

        .nb-root.scrolled {
          background: #0d0d0df2;
          backdrop-filter: blur(16px);
          border-bottom: 1px solid #2a2a2a;
        }

        .nb-root.flat {
          background: #0d0d0df2;
          border-bottom: 1px solid #222;
        }

        /* ── LEFT: LOGO ── */
        .nb-logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px; letter-spacing: 4px; color: #c89633;
          text-decoration: none; cursor: pointer; user-select: none;
          display: flex; align-items: center; gap: 8px;
          flex-shrink: 0;
        }
        .nb-logo-mark {
          width: 26px; height: 26px; background: #c89633; border-radius: 2px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; color: #080808;
        }

        /* ── CENTER: LINKS ── */
        .nb-center {
          display: flex; align-items: center; gap: 6px;
          position: absolute; left: 50%; transform: translateX(-50%);
        }

        .nb-link {
          font-size: 13px; color: #aaa; text-decoration: none;
          padding: 6px 12px; border-radius: 3px;
          transition: color 0.2s, background 0.2s;
          background: transparent; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; letter-spacing: 0.3px;
          white-space: nowrap;
        }
        .nb-link:hover { color: #f0f0f0; background: #ffffff0d; }
        .nb-link.active { color: #c89633; }

        /* ── DROPDOWN ── */
        .nb-dropdown-wrap { position: relative; }

        .nb-dropdown-btn {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: #aaa; background: transparent;
          border: none; cursor: pointer; font-family: 'DM Sans', sans-serif;
          padding: 6px 12px; border-radius: 3px;
          transition: color 0.2s, background 0.2s; white-space: nowrap;
          letter-spacing: 0.3px;
        }
        .nb-dropdown-btn:hover { color: #f0f0f0; background: #ffffff0d; }
        .nb-dropdown-btn.open { color: #c89633; }

        .nb-chevron {
          font-size: 9px; transition: transform 0.2s; display: inline-block;
          opacity: 0.5;
        }
        .nb-dropdown-btn.open .nb-chevron { transform: rotate(180deg); }

        .nb-dropdown {
          position: absolute; top: calc(100% + 8px); left: 50%; transform: translateX(-50%);
          background: #111; border: 1px solid #1e1e1e; border-radius: 4px;
          min-width: 190px; overflow: hidden;
          box-shadow: 0 20px 60px #00000088;
          animation: dropIn 0.18s ease;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .nb-dropdown-item {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 18px; text-decoration: none; color: #888;
          font-size: 13px; transition: all 0.15s; cursor: pointer;
          background: transparent; border: none; width: 100%;
          font-family: 'DM Sans', sans-serif; text-align: left;
          border-bottom: 1px solid #1a1a1a;
        }
        .nb-dropdown-item:last-child { border-bottom: none; }
        .nb-dropdown-item:hover { background: #1a1a1a; color: #e8e8e8; }
        .nb-dropdown-item-icon {
          width: 30px; height: 30px; border-radius: 3px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; flex-shrink: 0;
        }
        .nb-dropdown-item-text { display: flex; flex-direction: column; gap: 1px; }
        .nb-dropdown-item-label { font-size: 13px; font-weight: 500; color: #ccc; line-height: 1; }
        .nb-dropdown-item-sub { font-size: 10px; color: #444; letter-spacing: 0.5px; }
        .nb-dropdown-item:hover .nb-dropdown-item-label { color: #e8e8e8; }

        /* ── RIGHT: CTA BUTTONS ── */
        .nb-right {
          display: flex; align-items: center; gap: 8px; flex-shrink: 0;
        }

        .nb-btn-ghost {
          padding: 6px 16px; background: transparent; border: 1px solid #333;
          color: #aaa; border-radius: 3px; font-family: 'DM Sans', sans-serif;
          font-size: 12px; cursor: pointer; transition: all 0.2s; white-space: nowrap;
          text-decoration: none; display: inline-flex; align-items: center;
        }
        .nb-btn-ghost:hover { border-color: #c89633; color: #c89633; background: #c8963308; }

        .nb-btn-gold {
          padding: 6px 18px; background: #c89633; color: #080808;
          border: none; border-radius: 3px; font-family: 'Bebas Neue', sans-serif;
          font-size: 15px; letter-spacing: 1.5px; cursor: pointer;
          transition: opacity 0.2s, transform 0.1s; white-space: nowrap;
          text-decoration: none; display: inline-flex; align-items: center;
        }
        .nb-btn-gold:hover { opacity: 0.88; }
        .nb-btn-gold:active { transform: scale(0.97); }

        /* Accent divider */
        .nb-divider {
          width: 1px; height: 22px; background: #1e1e1e; margin: 0 4px;
        }

        /* ── MOBILE HAMBURGER ── */
        .nb-hamburger {
          display: none; flex-direction: column; gap: 5px;
          background: transparent; border: none; cursor: pointer; padding: 4px;
        }
        .nb-hamburger span {
          display: block; width: 22px; height: 2px; background: #888;
          border-radius: 2px; transition: all 0.25s;
        }
        .nb-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .nb-hamburger.open span:nth-child(2) { opacity: 0; }
        .nb-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* ── MOBILE DRAWER ── */
        .nb-drawer {
          position: fixed; top: 48px; left: 0; right: 0;
          background: #0d0d0d; border-bottom: 1px solid #1e1e1e;
          padding: 16px 20px 24px;
          display: flex; flex-direction: column; gap: 4px;
          box-shadow: 0 20px 40px #00000066;
          animation: drawerIn 0.2s ease;
          z-index: 998;
        }
        @keyframes drawerIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .nb-drawer-section {
          font-size: 9px; color: #2a2a2a; letter-spacing: 3px;
          text-transform: uppercase; padding: 12px 4px 6px;
        }

        .nb-drawer-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 10px; border-radius: 3px; color: #666;
          font-size: 14px; text-decoration: none; cursor: pointer;
          background: transparent; border: none; font-family: 'DM Sans', sans-serif;
          width: 100%; text-align: left; transition: all 0.15s;
        }
        .nb-drawer-item:hover { background: #161616; color: #c89633; }
        .nb-drawer-item.active { color: #c89633; }
        .nb-drawer-icon {
          width: 32px; height: 32px; background: #141414; border-radius: 3px;
          display: flex; align-items: center; justify-content: center; font-size: 16px;
          flex-shrink: 0;
        }

        .nb-drawer-cta {
          display: flex; gap: 8px; margin-top: 8px;
        }
        .nb-drawer-btn {
          flex: 1; padding: 12px; border-radius: 3px; font-family: 'Bebas Neue', sans-serif;
          font-size: 18px; letter-spacing: 1.5px; cursor: pointer; text-align: center;
          text-decoration: none; transition: all 0.15s; border: none;
          display: flex; align-items: center; justify-content: center;
        }
        .nb-drawer-btn.gold { background: #c89633; color: #080808; }
        .nb-drawer-btn.gold:hover { opacity: 0.88; }
        .nb-drawer-btn.outline { background: transparent; border: 1px solid #2a2a2a; color: #555; }
        .nb-drawer-btn.outline:hover { border-color: #c89633; color: #c89633; }

        /* ── RESPONSIVE ── */
        @media (max-width: 860px) {
          .nb-center { display: none; }
          .nb-right { display: none; }
          .nb-hamburger { display: flex; }
          .nb-root { padding: 0 20px; }
        }
      `}</style>

      {/* ── NAV BAR ── */}
      <nav className={`nb-root ${scrolled ? "scrolled" : "flat"}`}>

        {/* Logo */}
        <Link to="/about" className="nb-logo">
          <div className="nb-logo-mark">⚙</div>
          SteelSmith
        </Link>

        {/* Center links */}
        <div className="nb-center">
          <Link to="/about" className={`nb-link ${isActive("/about") ? "active" : ""}`}>About</Link>

          <div className="nb-divider" />

          {/* Sign In dropdown */}
          <div className="nb-dropdown-wrap" ref={signinRef}>
            <button
              className={`nb-dropdown-btn ${signinOpen ? "open" : ""}`}
              onClick={() => { setSigninOpen(o => !o); setSignupOpen(false); }}>
              Sign In <span className="nb-chevron">▼</span>
            </button>
            {signinOpen && (
              <div className="nb-dropdown">
                <button className="nb-dropdown-item" onClick={() => navigate("/user-signin")}>
                  <div className="nb-dropdown-item-icon" style={{ background: "#1a1500" }}>👨👩</div>
                  <div className="nb-dropdown-item-text">
                    <span className="nb-dropdown-item-label">Sign In as Client</span>
                    <span className="nb-dropdown-item-sub">Browse and hire workers</span>
                  </div>
                </button>
                <button className="nb-dropdown-item" onClick={() => navigate("/signin")}>
                  <div className="nb-dropdown-item-icon" style={{ background: "#0d1a0d" }}>👷‍♀️👷‍♂️</div>
                  <div className="nb-dropdown-item-text">
                    <span className="nb-dropdown-item-label">Sign In as Worker</span>
                    <span className="nb-dropdown-item-sub">Manage your job requests</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Sign Up dropdown */}
          <div className="nb-dropdown-wrap" ref={signupRef}>
            <button
              className={`nb-dropdown-btn ${signupOpen ? "open" : ""}`}
              onClick={() => { setSignupOpen(o => !o); setSigninOpen(false); }}>
              Sign Up <span className="nb-chevron">▼</span>
            </button>
            {signupOpen && (
              <div className="nb-dropdown">
                <button className="nb-dropdown-item" onClick={() => navigate("/user-signup")}>
                  <div className="nb-dropdown-item-icon" style={{ background: "#1a1500" }}>👩👨</div>
                  <div className="nb-dropdown-item-text">
                    <span className="nb-dropdown-item-label">Join as Client</span>
                    <span className="nb-dropdown-item-sub">Post jobs and hire talent</span>
                  </div>
                </button>
                <button className="nb-dropdown-item" onClick={() => navigate("/worker-signup")}>
                  <div className="nb-dropdown-item-icon" style={{ background: "#0d1a0d" }}>👷👷‍♀️</div>
                  <div className="nb-dropdown-item-text">
                    <span className="nb-dropdown-item-label">Join as Worker</span>
                    <span className="nb-dropdown-item-sub">Find jobs and get hired</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right CTAs */}
        <div className="nb-right">
          <button className="nb-btn-ghost" onClick={() => navigate("/user-signin")}>Client Login</button>
          <button className="nb-btn-gold" onClick={() => navigate("/worker-signup")}>Join as Worker</button>
        </div>

        {/* Hamburger */}
        <button
          className={`nb-hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu">
          <span /><span /><span />
        </button>
      </nav>

      {/* ── MOBILE DRAWER ── */}
      {menuOpen && (
        <div className="nb-drawer">
          <div className="nb-drawer-section">Navigate</div>
          <Link to="/about" className={`nb-drawer-item ${isActive("/about") ? "active" : ""}`}>
            <div className="nb-drawer-icon">ℹ️</div> About SteelSmith
          </Link>

          <div className="nb-drawer-section">Sign In</div>
          <button className="nb-drawer-item" onClick={() => navigate("/user-signin")}>
            <div className="nb-drawer-icon">👤</div> Sign In as Client
          </button>
          <button className="nb-drawer-item" onClick={() => navigate("/signin")}>
            <div className="nb-drawer-icon">👷</div> Sign In as Worker
          </button>

          <div className="nb-drawer-section">Create Account</div>
          <button className="nb-drawer-item" onClick={() => navigate("/user-signup")}>
            <div className="nb-drawer-icon">✏️</div> Register as Client
          </button>
          <button className="nb-drawer-item" onClick={() => navigate("/worker-signup")}>
            <div className="nb-drawer-icon">🔧</div> Register as Worker
          </button>

          <div className="nb-drawer-cta">
            <Link to="/user-signin" className="nb-drawer-btn outline">Client Login</Link>
            <Link to="/worker-signup" className="nb-drawer-btn gold">Join as Worker</Link>
          </div>
        </div>
      )}
    </>
  );
}
