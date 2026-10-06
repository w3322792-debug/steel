import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";


export default function SignupAs() {
  const [hovered, setHovered] = useState(null);
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .sa-root {
          min-height: 100vh;
          background: #0f0f0f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          padding: 80px 24px 24px;
          position: relative;
          overflow: hidden;
        }

        /* Ambient glow blobs */
        .sa-root::before {
          content: '';
          position: absolute;
          top: -120px; right: -120px;
          width: 500px; height: 500px;
          background: radial-gradient(circle, #c8963333 0%, transparent 75%);
          pointer-events: none;
        }

        .sa-root::after {
          content: '';
          position: absolute;
          bottom: -100px; left: -100px;
          width: 400px; height: 400px;
          background: radial-gradient(circle, #c8963322 0%, transparent 75%);
          pointer-events: none;
        }

        /* Animated grid lines background */
        .sa-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(#c8963308 1px, transparent 1px),
            linear-gradient(90deg, #c8963308 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .sa-wrapper {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 560px;
        }

        /* Header */
        .sa-header {
          text-align: center;
          margin-bottom: 40px;
          animation: fadeDown 0.5s ease both;
        }

        .sa-tagline {
          font-size: 12px;
          color: #555;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 6px;
        }

        .sa-divider {
          width: 40px;
          height: 2px;
          background: #c89633;
          margin: 16px auto 0;
        }

        .sa-question {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 26px;
          color: #e8e8e8;
          letter-spacing: 2px;
          margin-top: 24px;
        }

        .sa-sub {
          font-size: 13px;
          color: #555;
          margin-top: 6px;
        }

        /* Cards row */
        .sa-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          animation: fadeUp 0.5s 0.15s ease both;
        }

        .sa-card {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 4px;
          padding: 32px 24px 28px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: border-color 0.25s, transform 0.2s;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        .sa-card::before {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          background: #c89633;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }

        .sa-card:hover {
          border-color: #c89633;
          transform: translateY(-4px);
        }

        .sa-card:hover::before {
          transform: scaleX(1);
        }

        .sa-card-shine {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 0%, #c8963310 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }

        .sa-card:hover .sa-card-shine { opacity: 1; }

        .sa-icon {
          font-size: 44px;
          margin-bottom: 16px;
          display: block;
          transition: transform 0.3s;
        }

        .sa-card:hover .sa-icon { transform: scale(1.15); }

        .sa-card-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 26px;
          color: #e8e8e8;
          letter-spacing: 2px;
          margin-bottom: 10px;
          transition: color 0.2s;
        }

        .sa-card:hover .sa-card-title { color: #c89633; }

        .sa-card-desc {
          font-size: 12.5px;
          color: #555;
          line-height: 1.65;
          flex: 1;
        }

        .sa-card-cta {
          margin-top: 22px;
          width: 100%;
          padding: 11px;
          border: 1px solid #2a2a2a;
          border-radius: 3px;
          background: transparent;
          color: #666;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
        }

        .sa-card:hover .sa-card-cta {
          background: #c89633;
          color: #0f0f0f;
          border-color: #c89633;
        }

        /* Badges */
        .sa-badge {
          position: absolute;
          top: 12px; right: 12px;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 2px;
          background: #c8963320;
          color: #c89633;
          border: 1px solid #c8963340;
        }

        /* Footer */
        .sa-footer {
          text-align: center;
          margin-top: 28px;
          font-size: 13px;
          color: #444;
          animation: fadeUp 0.5s 0.25s ease both;
        }

        .sa-footer a {
          color: #c89633;
          text-decoration: none;
        }

        .sa-footer a:hover { text-decoration: underline; }

        /* Feature list inside card */
        .sa-features {
          list-style: none;
          margin-top: 12px;
          text-align: left;
          width: 100%;
        }

        .sa-features li {
          font-size: 12px;
          color: #444;
          padding: 4px 0;
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .sa-features li::before {
          content: '—';
          color: #c89633;
          font-size: 10px;
          flex-shrink: 0;
        }

        .sa-card-signin {
          margin-top: 10px;
          font-size: 12px;
          color: #444;
          text-align: center;
        }

        .sa-card-signin a {
          color: #c89633;
          text-decoration: none;
          font-weight: 500;
          letter-spacing: 0.5px;
          transition: opacity 0.2s;
        }

        .sa-card-signin a:hover { opacity: 0.75; text-decoration: underline; }

        /* Logo mark */
        .sa-logo-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin-bottom: 4px;
        }

        .sa-logo-mark {
          width: 52px;
          height: 52px;
          background: #c89633;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
          box-shadow: 0 0 24px #c8963344;
        }

        .sa-logo-mark::before {
          content: '⚙';
          font-size: 28px;
          line-height: 1;
          color: #0f0f0f;
        }

        .sa-logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 48px;
          color: #c89633;
          letter-spacing: 4px;
          line-height: 1;
        }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 480px) {
          .sa-cards { grid-template-columns: 1fr; }
          .sa-logo { font-size: 38px; }
          .sa-question { font-size: 22px; }
        }
      `}</style>

      <div className="sa-root">
        <div className="sa-grid" />

        <div className="sa-wrapper">
          {/* Header */}
          <div className="sa-header">
            <div className="sa-logo-wrap">
              <div className="sa-logo-mark" />
              <div className="sa-logo">SteelSmith</div>
            </div>
            <div className="sa-tagline">Construction Platform</div>
            <div className="sa-divider" />
            <div className="sa-question">Join as who?</div>
            <div className="sa-sub">Choose how you want to use the platform</div>
          </div>

          {/* Choice cards */}
          <div className="sa-cards">
            {/* Worker Card */}
            <div
              className="sa-card"
              onClick={() => navigate("/worker-signup")}
              onMouseEnter={() => setHovered("worker")}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="sa-card-shine" />
              <div className="sa-badge">Earn</div>
              <span className="sa-icon">⚒️</span>
              <div className="sa-card-title">Worker</div>
              <div className="sa-card-desc">
                A skilled tradesperson looking to offer your services and get hired.
              </div>
              <ul className="sa-features">
                <li>Receive job requests</li>
                <li>Showcase your trade</li>
                <li>Build your reputation</li>
              </ul>
              <button className="sa-card-cta">Sign Up as Worker →</button>
              <div className="sa-card-signin">
                Already a worker? <Link to="/signin">Sign in</Link>
              </div>
            </div>

            {/* User / Client Card */}
            <div
              className="sa-card"
              onClick={() => navigate("/user-signup")}
              onMouseEnter={() => setHovered("user")}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="sa-card-shine" />
              <div className="sa-badge">Hire</div>
              <span className="sa-icon">🏗️</span>
              <div className="sa-card-title">Client</div>
              <div className="sa-card-desc">
                A business or individual looking to hire skilled construc professionals.
              </div>
              <ul className="sa-features">
                <li>Post job requests</li>
                <li>Browse skilled workers</li>
                <li>Manage your projects</li>
              </ul>
              <button className="sa-card-cta">Sign Up as Client →</button>
              <div className="sa-card-signin">
                Already a client? <Link to="/user-signin">Sign in</Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sa-footer">
            Already have an account? <a href="/signin">Sign in</a>
          </div>
        </div>
      </div>
    </>
  );
}
