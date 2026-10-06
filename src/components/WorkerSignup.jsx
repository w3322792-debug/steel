import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

import { apiFetch, parseJsonSafely } from "./apiClient";

const WORK_TYPES = [
  "Welder", "Fabricator", "Blacksmith", "Metalworker",
  "Steel Fixer", "Machinist", "Pipe Fitter", "Structural Engineer" , "Painters"
];

export default function WorkerSignup() {
  const [form, setForm] = useState({
    username: "", password: "", email: "", phone: "", work: ""
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState(3);
  const fileRef = useRef();
  const navigate = useNavigate();

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    const maxBytes = 5 * 1024 * 1024;

    if (!allowedTypes.has(file.type)) {
      setStatus({ type: "error", message: "Use a JPG, PNG, or WEBP image." });
      e.target.value = "";
      return;
    }

    if (file.size > maxBytes) {
      setStatus({ type: "error", message: "Profile photo must be 5MB or smaller." });
      e.target.value = "";
      return;
    }

    setPhoto(file);
    setPreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setStatus({ type: "", message: "" });
  };

  const validate = () => {
    const username = form.username.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (!/^[A-Za-z0-9_.-]{3,40}$/.test(username)) {
      return "Username must be 3–40 characters and use letters, numbers, dot, dash, or underscore.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return "Enter a valid email address.";
    }
    if (form.password.length < 12 || form.password.length > 128) {
      return "Password must be 12–128 characters.";
    }
    if (!/^[0-9+() .-]{7,25}$/.test(phone)) {
      return "Enter a valid phone number.";
    }
    if (!WORK_TYPES.includes(form.work)) {
      return "Select a valid work type.";
    }
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      setStatus({ type: "error", message: error });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    const data = new FormData();
    data.append("username", form.username.trim());
    data.append("password", form.password);
    data.append("email", form.email.trim().toLowerCase());
    data.append("phone", form.phone.trim());
    data.append("work", form.work);
    if (photo) data.append("profilepic", photo);

    try {
      const res = await apiFetch("/api/signupworkers", {
        method: "POST",
        body: data,
      });
      const json = await parseJsonSafely(res);
      if (res.ok) {
        setStatus({ type: "success", message: json.Message || "Signed up successfully!" });
        setStep(3);

        // countdown then redirect to signin
        let secs = 3;
        const timer = setInterval(() => {
          secs -= 1;
          setCountdown(secs);
          if (secs <= 0) {
            clearInterval(timer);
            navigate("/signin");
          }
        }, 1000);

      } else {
        setStatus({ type: "error", message: json.error || "Signup failed." });
      }
    } catch {
      setStatus({ type: "error", message: "Could not reach the server." });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!form.username || !form.email || !form.password) {
        setStatus({ type: "error", message: "Please fill in all fields before continuing." });
        return;
      }
    }
    if (step === 2) {
      if (!form.phone || !form.work) {
        setStatus({ type: "error", message: "Please fill in all fields before continuing." });
        return;
      }
    }
    setStatus({ type: "", message: "" });
    setStep(step + 1);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .ws-root {
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

        .ws-root::before {
          content: '';
          position: absolute;
          top: -120px; right: -120px;
          width: 500px; height: 500px;
          background: radial-gradient(circle, #c8963333 0%, transparent 70%);
          pointer-events: none;
        }

        .ws-root::after {
          content: '';
          position: absolute;
          bottom: -100px; left: -100px;
          width: 400px; height: 400px;
          background: radial-gradient(circle, #c8963322 0%, transparent 70%);
          pointer-events: none;
        }

        .ws-card {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 4px;
          width: 100%;
          max-width: 480px;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        .ws-header {
          background: #c89633;
          padding: 32px 36px 24px;
        }

        .ws-logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 36px;
          color: #0f0f0f;
          letter-spacing: 2px;
          line-height: 1;
        }

        .ws-subtitle {
          font-size: 12px;
          color: #0f0f0f99;
          margin-top: 4px;
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .ws-steps {
          display: flex;
          gap: 6px;
          margin-top: 20px;
        }

        .ws-step-dot {
          height: 3px;
          flex: 1;
          background: #0f0f0f33;
          border-radius: 2px;
          transition: background 0.3s;
        }

        .ws-step-dot.active { background: #0f0f0f; }

        .ws-body { padding: 32px 36px; }

        .ws-step-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          color: #e8e8e8;
          letter-spacing: 1px;
          margin-bottom: 20px;
        }

        .ws-field { margin-bottom: 16px; }

        .ws-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: #888;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .ws-input {
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

        .ws-input:focus { border-color: #c89633; }
        .ws-input option { background: #1a1a1a; }

        .ws-photo-area {
          border: 2px dashed #2a2a2a;
          border-radius: 3px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s;
          position: relative;
        }

        .ws-photo-area:hover { border-color: #c89633; }

        .ws-photo-preview {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          margin: 0 auto 8px;
          display: block;
          border: 2px solid #c89633;
        }

        .ws-photo-placeholder {
          width: 56px; height: 56px;
          background: #222;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 8px;
          font-size: 22px;
        }

        .ws-photo-text { font-size: 13px; color: #555; }
        .ws-photo-hint { font-size: 11px; color: #3a3a3a; margin-top: 4px; }

        .ws-alert {
          padding: 10px 14px;
          border-radius: 3px;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .ws-alert.error { background: #2a1212; color: #e07070; border: 1px solid #3a1a1a; }
        .ws-alert.success { background: #122a12; color: #70c070; border: 1px solid #1a3a1a; }

        .ws-actions { display: flex; gap: 10px; margin-top: 24px; }

        .ws-btn {
          flex: 1;
          padding: 13px;
          border: none;
          border-radius: 3px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
        }

        .ws-btn:active { transform: scale(0.98); }

        .ws-btn-primary { background: #c89633; color: #0f0f0f; }
        .ws-btn-primary:hover { opacity: 0.9; }
        .ws-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .ws-btn-ghost {
          background: transparent;
          color: #666;
          border: 1px solid #2a2a2a;
          flex: 0 0 auto;
          padding: 13px 20px;
        }

        .ws-btn-ghost:hover { border-color: #555; color: #aaa; }

        .ws-success {
          text-align: center;
          padding: 12px 0 8px;
        }

        .ws-success-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .ws-success-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          color: #c89633;
          letter-spacing: 2px;
        }

        .ws-success-text {
          font-size: 14px;
          color: #666;
          margin-top: 8px;
          line-height: 1.6;
        }

        .ws-countdown {
          margin-top: 20px;
          font-size: 13px;
          color: #444;
        }

        .ws-countdown span {
          color: #c89633;
          font-weight: 500;
        }

        .ws-signin-link {
          text-align: center;
          margin-top: 20px;
          font-size: 13px;
          color: #555;
        }

        .ws-signin-link a { color: #c89633; text-decoration: none; }
        .ws-signin-link a:hover { text-decoration: underline; }
      `}</style>

      <div className="ws-root">
        <div className="ws-card">
          <div className="ws-header">
            <div className="ws-logo">SteelSmith</div>
            <div className="ws-subtitle">Worker Registration</div>
            <div className="ws-steps">
              {[1, 2, 3].map(s => (
                <div key={s} className={`ws-step-dot ${step >= s ? "active" : ""}`} />
              ))}
            </div>
          </div>

          <div className="ws-body">
            {status.message && step !== 3 && (
              <div className={`ws-alert ${status.type}`}>{status.message}</div>
            )}

            {/* Step 1 — Account */}
            {step === 1 && (
              <>
                <div className="ws-step-title">Account Details</div>
                <div className="ws-field">
                  <label className="ws-label">Username</label>
                  <input className="ws-input" name="username" value={form.username} maxLength={40} autoComplete="username"
                    onChange={handleChange} placeholder="e.g. john_welder" />
                </div>
                <div className="ws-field">
                  <label className="ws-label">Email</label>
                  <input className="ws-input" type="email" name="email" value={form.email} maxLength={254} autoComplete="email"
                    onChange={handleChange} placeholder="you@example.com" />
                </div>
                <div className="ws-field">
                  <label className="ws-label">Password</label>
                  <input className="ws-input" type="password" name="password" value={form.password} minLength={12} maxLength={128} autoComplete="new-password"
                    onChange={handleChange} placeholder="Min. 8 characters" />
                </div>
                <div className="ws-actions">
                  <button className="ws-btn ws-btn-primary" onClick={nextStep}>Continue →</button>
                </div>
              </>
            )}

            {/* Step 2 — Work Info */}
            {step === 2 && (
              <>
                <div className="ws-step-title">Work Info</div>
                <div className="ws-field">
                  <label className="ws-label">Phone</label>
                  <input className="ws-input" name="phone" value={form.phone} maxLength={25} autoComplete="tel"
                    onChange={handleChange} placeholder="+254 700 000 000" />
                </div>
                <div className="ws-field">
                  <label className="ws-label">Trade / Specialisation</label>
                  <select className="ws-input" name="work" value={form.work} onChange={handleChange}>
                    <option value="">Select your trade...</option>
                    {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div className="ws-field">
                  <label className="ws-label">Profile Photo</label>
                  <div className="ws-photo-area" onClick={() => fileRef.current.click()}>
                    {preview
                      ? <img src={preview} alt="preview" className="ws-photo-preview" />
                      : <div className="ws-photo-placeholder">📷</div>
                    }
                    <div className="ws-photo-text">{preview ? "Tap to change photo" : "Tap to upload photo"}</div>
                    <div className="ws-photo-hint">PNG, JPG, WEBP · max 5MB</div>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                      style={{ display: "none" }} onChange={handlePhoto} />
                  </div>
                </div>
                <div className="ws-actions">
                  <button className="ws-btn ws-btn-ghost" onClick={() => setStep(1)}>← Back</button>
                  <button className="ws-btn ws-btn-primary" onClick={handleSubmit}
                    disabled={loading}>{loading ? "Signing up..." : "Sign Up"}</button>
                </div>
              </>
            )}

            {/* Step 3 — Success + countdown */}
            {step === 3 && (
              <div className="ws-success">
                <div className="ws-success-icon">⚒️</div>
                <div className="ws-success-title">Welcome Aboard!</div>
                <div className="ws-success-text">
                  Your worker account has been created.<br />
                  You can now sign in and start receiving job requests.
                </div>
                <div className="ws-countdown">
                  Redirecting to sign in in <span>{countdown}</span> second{countdown !== 1 ? "s" : ""}...
                </div>
              </div>
            )}

            {step !== 3 && (
              <div className="ws-signin-link">
                Already have an account? <a href="/signin">Sign in</a><br />
                <Link to="/signup-as" style={{ color: "#c89633", fontSize: "12px" }}>← Back to sign up options</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
