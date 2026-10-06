import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

import { apiFetch, parseJsonSafely } from "./apiClient";

export default function UserSignup() {
  const [form, setForm] = useState({ username: "", email: "", phone: "", password: "" });
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

  const validateAccount = () => {
    const username = form.username.trim();
    const email = form.email.trim().toLowerCase();

    if (!/^[A-Za-z0-9_.-]{3,40}$/.test(username)) {
      return "Username must be 3–40 characters and use letters, numbers, dot, dash, or underscore.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return "Enter a valid email address.";
    }
    if (form.password.length < 12 || form.password.length > 128) {
      return "Password must be 12–128 characters.";
    }
    return null;
  };

  const validate = () => {
    const accountError = validateAccount();
    if (accountError) return accountError;
    if (!/^[0-9+() .-]{7,25}$/.test(form.phone.trim())) {
      return "Enter a valid phone number.";
    }
    return null;
  };

  const nextStep = () => {
    if (step === 1) {
      const error = validateAccount();
      if (error) {
        setStatus({ type: "error", message: error });
        return;
      }
    }
    setStatus({ type: "", message: "" });
    setStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      setStatus({ type: "error", message: error });
      return;
    }

    if (!form.phone.trim()) {
      setStatus({ type: "error", message: "Please enter your phone number." });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    const data = new FormData();
    data.append("username", form.username.trim());
    data.append("email", form.email.trim().toLowerCase());
    data.append("phone", form.phone.trim());
    data.append("password", form.password);
    if (photo) data.append("profilepic", photo);

    try {
      const res = await apiFetch("/api/signupuser", {
        method: "POST",
        body: data,
      });
      const json = await parseJsonSafely(res);
      if (res.ok) {
        setStep(3);
        let secs = 3;
        const timer = setInterval(() => {
          secs -= 1;
          setCountdown(secs);
          if (secs <= 0) { clearInterval(timer); navigate("/user-signin"); }
        }, 1000);
      } else {
        setStatus({ type: "error", message: json.error || "Signup failed." });
      }
    } catch {
      setStatus({ type: "error", message: "Could not reach the server. Is your API running?" });
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

        .us-root {
          min-height: 100vh;
          background: #0f0f0f;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
        }

        /* Left panel */
        .us-left {
          display: none;
          flex: 1;
          background: #c89633;
          position: relative;
          overflow: hidden;
          flex-direction: column;
          justify-content: flex-end;
          padding: 48px;
        }

        @media (min-width: 900px) { .us-left { display: flex; } }

        .us-left::before {
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

        .us-left-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 72px;
          line-height: 0.9;
          color: #0f0f0f;
          letter-spacing: 2px;
          position: relative;
          z-index: 1;
        }

        .us-left-sub {
          font-size: 14px;
          color: #0f0f0f88;
          margin-top: 16px;
          line-height: 1.6;
          max-width: 300px;
          position: relative;
          z-index: 1;
        }

        .us-left-circle {
          position: absolute;
          top: -80px; right: -80px;
          width: 350px; height: 350px;
          border-radius: 50%;
          border: 60px solid #0f0f0f11;
        }

        /* Right panel */
        .us-right {
          width: 100%;
          max-width: 500px;
          background: #0f0f0f;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 40px 36px;
          position: relative;
        }

        @media (min-width: 900px) { .us-right { width: 500px; flex: none; } }

        .us-logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          color: #c89633;
          letter-spacing: 3px;
          margin-bottom: 40px;
        }

        .us-steps {
          display: flex;
          gap: 6px;
          margin-bottom: 32px;
        }

        .us-step-dot {
          height: 3px;
          flex: 1;
          background: #1e1e1e;
          border-radius: 2px;
          transition: background 0.3s;
        }

        .us-step-dot.active { background: #c89633; }

        .us-step-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 36px;
          color: #e8e8e8;
          letter-spacing: 1.5px;
          margin-bottom: 6px;
        }

        .us-step-sub {
          font-size: 13px;
          color: #444;
          margin-bottom: 28px;
        }

        .us-field { margin-bottom: 18px; }

        .us-label {
          display: block;
          font-size: 10px;
          font-weight: 500;
          color: #555;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 7px;
        }

        .us-input {
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

        .us-input:focus { border-color: #c89633; }

        .us-photo-area {
          border: 2px dashed #1e1e1e;
          border-radius: 3px;
          padding: 28px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .us-photo-area:hover { border-color: #c89633; }

        .us-photo-preview {
          width: 80px; height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #c89633;
          margin: 0 auto 10px;
          display: block;
        }

        .us-photo-placeholder {
          width: 60px; height: 60px;
          border-radius: 50%;
          background: #1a1a1a;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 10px;
          font-size: 24px;
        }

        .us-photo-text { font-size: 13px; color: #555; }
        .us-photo-hint { font-size: 11px; color: #2a2a2a; margin-top: 4px; }

        .us-alert {
          padding: 10px 14px;
          border-radius: 3px;
          font-size: 13px;
          margin-bottom: 16px;
          border: 1px solid;
        }

        .us-alert.error { background: #1f0d0d; color: #e07070; border-color: #2a1010; }

        .us-actions { display: flex; gap: 10px; margin-top: 24px; }

        .us-btn {
          flex: 1;
          padding: 14px;
          border: none;
          border-radius: 3px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 20px;
          letter-spacing: 2px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
        }

        .us-btn:active { transform: scale(0.98); }
        .us-btn-primary { background: #c89633; color: #0f0f0f; }
        .us-btn-primary:hover { opacity: 0.9; }
        .us-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .us-btn-ghost {
          background: transparent;
          color: #555;
          border: 1px solid #1e1e1e;
          flex: 0 0 auto;
          padding: 14px 20px;
        }

        .us-btn-ghost:hover { border-color: #444; color: #aaa; }

        .us-success {
          text-align: center;
          padding: 20px 0;
        }

        .us-success-icon { font-size: 52px; margin-bottom: 16px; }

        .us-success-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 36px;
          color: #c89633;
          letter-spacing: 2px;
          margin-bottom: 8px;
        }

        .us-success-text { font-size: 14px; color: #555; line-height: 1.6; }

        .us-countdown { margin-top: 20px; font-size: 13px; color: #333; }
        .us-countdown span { color: #c89633; font-weight: 500; }

        .us-footer {
          margin-top: 28px;
          font-size: 13px;
          color: #444;
          text-align: center;
        }

        .us-footer a { color: #c89633; text-decoration: none; }
        .us-footer a:hover { text-decoration: underline; }
      `}</style>

      <div className="us-root">
        {/* Left decorative panel */}
        <div className="us-left">
          <div className="us-left-circle" />
          <div className="us-left-title">Find The Right Worker.<br />Fast.</div>
          <div className="us-left-sub">
            SteelSmith connects you with skilled metalworkers and fabricators in your area.
            Post a job in seconds.
          </div>
        </div>

        {/* Right form panel */}
        <div className="us-right">
          <div className="us-logo">SteelSmith</div>

          <div className="us-steps">
            {[1, 2, 3].map(s => (
              <div key={s} className={`us-step-dot ${step >= s ? "active" : ""}`} />
            ))}
          </div>

          {status.message && step !== 3 && (
            <div className={`us-alert ${status.type}`}>{status.message}</div>
          )}

          {/* Step 1 — Account */}
          {step === 1 && (
            <>
              <div className="us-step-title">Create Account</div>
              <div className="us-step-sub">Let's get you set up.</div>

              <div className="us-field">
                <label className="us-label">Username</label>
                <input className="us-input" name="username" value={form.username} maxLength={40} autoComplete="username"
                  onChange={handleChange} placeholder="e.g. john_doe" />
              </div>
              <div className="us-field">
                <label className="us-label">Email</label>
                <input className="us-input" type="email" name="email" value={form.email} maxLength={254} autoComplete="email"
                  onChange={handleChange} placeholder="you@example.com" />
              </div>
              <div className="us-field">
                <label className="us-label">Password</label>
                <input className="us-input" type="password" name="password" value={form.password} minLength={12} maxLength={128} autoComplete="new-password"
                  onChange={handleChange} placeholder="Min. 8 characters" />
              </div>

              <div className="us-actions">
                <button className="us-btn us-btn-primary" onClick={nextStep}>Continue →</button>
              </div>
            </>
          )}

          {/* Step 2 — Contact & Photo */}
          {step === 2 && (
            <>
              <div className="us-step-title">Your Details</div>
              <div className="us-step-sub">Almost done — add your contact info and photo.</div>

              <div className="us-field">
                <label className="us-label">Phone</label>
                <input className="us-input" name="phone" value={form.phone} maxLength={25} autoComplete="tel"
                  onChange={handleChange} placeholder="+254 700 000 000" />
              </div>

              <div className="us-field">
                <label className="us-label">Profile Photo (optional)</label>
                <div className="us-photo-area" onClick={() => fileRef.current.click()}>
                  {preview
                    ? <img src={preview} alt="preview" className="us-photo-preview" />
                    : <div className="us-photo-placeholder">📷</div>
                  }
                  <div className="us-photo-text">{preview ? "Tap to change" : "Tap to upload"}</div>
                  <div className="us-photo-hint">PNG, JPG, WEBP · max 5MB</div>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }} onChange={handlePhoto} />
                </div>
              </div>

              <div className="us-actions">
                <button className="us-btn us-btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button className="us-btn us-btn-primary" onClick={handleSubmit}
                  disabled={loading}>{loading ? "Creating..." : "Sign Up"}</button>
              </div>
            </>
          )}

          {/* Step 3 — Success */}
          {step === 3 && (
            <div className="us-success">
              <div className="us-success-icon">🎉🎉🎉🎉</div>
              <div className="us-success-title">You're In!</div>
              <div className="us-success-text">
                Your account has been created.<br />
                You can now browse workers and send job requests.
              </div>
              <div className="us-countdown">
                Redirecting to sign in in <span>{countdown}</span> second{countdown !== 1 ? "s" : ""}...
              </div>
            </div>
          )}

          {step !== 3 && (
            <div className="us-footer">
              Already have an account? <Link to="/user-signin">Sign in</Link>
              <br />
              <Link to="/signup-as">← Back to sign up options</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
