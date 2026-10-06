import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { apiFetch, parseJsonSafely } from "./apiClient";

export default function Signin() {
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
      const res = await apiFetch("/api/signin", {
        method: "POST",
        body: data,
      });
      const json = await parseJsonSafely(res);

      if (res.ok && typeof json.token === "string" && json.token.length > 20) {
        const returnedRole = json.role;

        if (returnedRole !== "worker") {
          setStatus({ type: "error", message: "This account cannot use this sign-in page." });
          return;
        }

        localStorage.setItem("token", json.token);
        if (json.user && typeof json.user === "object") {
          localStorage.setItem("user", JSON.stringify(json.user));
        }
        localStorage.setItem("role", returnedRole);
        navigate("/worker");
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

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .si-root {
          min-height: 100vh;
          background: #0f0f0f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .si-root::before {
          content: '';
          position: absolute;
          top: -120px; right: -120px;
          width: 500px; height: 500px;
          background: radial-gradient(circle, #c8963333 0%, transparent 70%);
          pointer-events: none;
        }

        .si-root::after {
          content: '';
          position: absolute;
          bottom: -100px; left: -100px;
          width: 400px; height: 400px;
          background: radial-gradient(circle, #c8963322 0%, transparent 70%);
          pointer-events: none;
        }

        .si-card {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 4px;
          width: 100%;
          max-width: 480px;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        .si-header {
          background: #c89633;
          padding: 32px 36px 28px;
        }

        .si-logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 36px;
          color: #0f0f0f;
          letter-spacing: 2px;
          line-height: 1;
        }

        .si-subtitle {
          font-size: 12px;
          color: #0f0f0f99;
          margin-top: 4px;
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .si-body { padding: 32px 36px; }

        .si-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          color: #e8e8e8;
          letter-spacing: 1px;
          margin-bottom: 24px;
        }

        .si-field { margin-bottom: 16px; }

        .si-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: #888;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .si-input {
          width: 100%;
          background: #111;
          border: 1px solid #2a2a2a;
          border-radius: 3px;
          padding: 12px 14px;
          color: #e8e8e8;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .si-input:focus { border-color: #c89633; }

        .si-alert {
          padding: 10px 14px;
          border-radius: 3px;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .si-alert.error { background: #2a1212; color: #e07070; border: 1px solid #3a1a1a; }
        .si-alert.success { background: #122a12; color: #70c070; border: 1px solid #1a3a1a; }

        .si-btn {
          width: 100%;
          margin-top: 8px;
          padding: 14px;
          border: none;
          border-radius: 3px;
          background: #c89633;
          color: #0f0f0f;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 20px;
          letter-spacing: 2px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
        }

        .si-btn:hover { opacity: 0.9; }
        .si-btn:active { transform: scale(0.98); }
        .si-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .si-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0 16px;
        }

        .si-divider-line {
          flex: 1;
          height: 1px;
          background: #2a2a2a;
        }

        .si-divider-text {
          font-size: 11px;
          color: #444;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .si-footer {
          text-align: center;
          font-size: 13px;
          color: #555;
        }

        .si-footer a {
          color: #c89633;
          text-decoration: none;
        }

        .si-footer a:hover { text-decoration: underline; }

        .si-forgot {
          text-align: right;
          margin-top: -8px;
          margin-bottom: 16px;
        }

        .si-forgot a {
          font-size: 12px;
          color: #555;
          text-decoration: none;
        }

        .si-forgot a:hover { color: #c89633; }
      `}</style>

      <div className="si-root">
        <div className="si-card">
          <div className="si-header">
            <div className="si-logo">SteelSmith</div>
            <div className="si-subtitle">Worker Portal</div>
          </div>

          <div className="si-body">
            <div className="si-title">Welcome Back</div>

            {status.message && (
              <div className={`si-alert ${status.type}`}>{status.message}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="si-field">
                <label className="si-label">Email</label>
                <input
                  className="si-input"
                  type="email"
                  name="email"
                  autoComplete="email"
                  maxLength={254}
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="si-field">
                <label className="si-label">Password</label>
                <input
                  className="si-input"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  maxLength={128}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="si-forgot">
                <a href="#">Forgot password?</a>
              </div>

              <button className="si-btn" type="submit" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="si-divider">
              <div className="si-divider-line" />
              <div className="si-divider-text">New here?</div>
              <div className="si-divider-line" />
            </div>

            <div className="si-footer">
              <p>Don't have an account? <Link to="/worker-signup">Create Account</Link></p>
              <p style={{ marginTop: "10px" }}>
                <Link to="/signup-as" style={{ fontSize: "12px", color: "#dabc15444" }}>← Back to sign up options</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
