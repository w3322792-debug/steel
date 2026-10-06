import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { apiFetch, parseJsonSafely } from "./apiClient";

export default function UserSignin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus({ type: "error", message: "Enter a valid email address." });
      return;
    }
    if (!form.password || form.password.length > 128) {
      setStatus({ type: "error", message: "Enter your password." });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    const data = new FormData();
    data.append("email", email);
    data.append("password", form.password);

    try {
      const res = await apiFetch("/api/signinuser", {
        method: "POST",
        body: data,
      });
      const json = await parseJsonSafely(res);

      if (res.ok && typeof json.token === "string" && json.token.length > 20) {
        const returnedRole = json.role;

        if (returnedRole !== "user") {
          setStatus({ type: "error", message: "This account cannot use this sign-in page." });
          return;
        }

        localStorage.setItem("token", json.token);
        if (json.user && typeof json.user === "object") {
          localStorage.setItem("user", JSON.stringify(json.user));
        }
        localStorage.setItem("role", returnedRole);
        navigate("/home");
      } else {
        setStatus({
          type: "error",
          message: json.Message || json.error || "Login failed."
        });
      }
    } catch {
      setStatus({ type: "error", message: "Could not reach the server. Please try again." });
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0f0f0f; }

        .usi-root {
          min-height: 100vh;
          background: #0f0f0f;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
        }

        /* Left panel */
        .usi-left {
          display: none;
          flex: 1;
          background: #c89633;
          position: relative;
          overflow: hidden;
          flex-direction: column;
          justify-content: flex-end;
          padding: 48px;
        }

        @media (min-width: 900px) { .usi-left { display: flex; } }

        .usi-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 40px,
            #0f0f0f0a 40px,
            #0f0f0f0a 41px
          );
        }

        .usi-left-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 72px;
          line-height: 0.9;
          color: #0f0f0f;
          letter-spacing: 2px;
          position: relative;
          z-index: 1;
        }

        .usi-left-sub {
          font-size: 14px;
          color: #0f0f0f88;
          margin-top: 16px;
          line-height: 1.6;
          max-width: 300px;
          position: relative;
          z-index: 1;
        }

        .usi-left-circle {
          position: absolute;
          top: -80px; right: -80px;
          width: 350px; height: 350px;
          border-radius: 50%;
          border: 60px solid #0f0f0f11;
        }

        /* Right panel */
        .usi-right {
          width: 100%;
          max-width: 500px;
          background: #0f0f0f;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 40px 36px;
        }

        @media (min-width: 900px) { .usi-right { width: 500px; flex: none; } }

        .usi-logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          color: #c89633;
          letter-spacing: 3px;
          margin-bottom: 48px;
        }

        .usi-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 42px;
          color: #e8e8e8;
          letter-spacing: 1.5px;
          margin-bottom: 6px;
        }

        .usi-sub {
          font-size: 13px;
          color: #444;
          margin-bottom: 36px;
        }

        .usi-field { margin-bottom: 18px; }

        .usi-label {
          display: block;
          font-size: 10px;
          font-weight: 500;
          color: #555;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 7px;
        }

        .usi-input {
          width: 100%;
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 3px;
          padding: 13px 16px;
          color: #e8e8e8;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .usi-input:focus { border-color: #c89633; }

        .usi-alert {
          padding: 10px 14px;
          border-radius: 3px;
          font-size: 13px;
          margin-bottom: 16px;
          border: 1px solid;
        }

        .usi-alert.error { background: #1f0d0d; color: #e07070; border-color: #2a1010; }

        .usi-forgot {
          text-align: right;
          margin-top: -10px;
          margin-bottom: 24px;
        }

        .usi-forgot a { font-size: 12px; color: #444; text-decoration: none; }
        .usi-forgot a:hover { color: #c89633; }

        .usi-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 3px;
          background: #c89633;
          color: #0f0f0f;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          letter-spacing: 2px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
        }

        .usi-btn:hover { opacity: 0.9; }
        .usi-btn:active { transform: scale(0.98); }
        .usi-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .usi-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 28px 0 20px;
        }

        .usi-divider-line { flex: 1; height: 1px; background: #1e1e1e; }
        .usi-divider-text { font-size: 11px; color: #333; letter-spacing: 1px; text-transform: uppercase; }

        .usi-footer {
          font-size: 13px;
          color: #444;
          text-align: center;
          line-height: 2;
        }

        .usi-footer a { color: #c89633; text-decoration: none; }
        .usi-footer a:hover { text-decoration: underline; }
      `}</style>

      <div className="usi-root">
        {/* Left decorative panel */}
        <div className="usi-left">
          <div className="usi-left-circle" />
          <div className="usi-left-title">Welcome<br />Back.</div>
          <div className="usi-left-sub">
            Your next skilled worker is just a few clicks away.
            Sign in to manage your job requests.
          </div>
        </div>

        {/* Right form panel */}
        <div className="usi-right">
          <div className="usi-logo">SteelSmith</div>
          <div className="usi-title">Sign In</div>
          <div className="usi-sub">Access your account to browse workers and manage requests.</div>

          {status.message && (
            <div className={`usi-alert ${status.type}`}>{status.message}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="usi-field">
              <label className="usi-label">Email</label>
              <input className="usi-input" type="email" name="email"
                autoComplete="email"
                maxLength={254}
                value={form.email} onChange={handleChange}
                placeholder="you@example.com" required />
            </div>
            <div className="usi-field">
              <label className="usi-label">Password</label>
              <input className="usi-input" type="password" name="password"
                autoComplete="current-password"
                maxLength={128}
                value={form.password} onChange={handleChange}
                placeholder="••••••••" required />
            </div>

            <div className="usi-forgot"><a href="#">Forgot password?</a></div>

            <button className="usi-btn" type="submit" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="usi-divider">
            <div className="usi-divider-line" />
            <div className="usi-divider-text">New here?</div>
            <div className="usi-divider-line" />
          </div>

          <div className="usi-footer">
            Don't have an account? <Link to="/user-signup">Create Account</Link><br />
            <Link to="/signup-as">← Back to sign up options</Link>
          </div>
        </div>
      </div>
    </>
  );
}
