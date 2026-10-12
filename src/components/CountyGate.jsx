import { useEffect, useRef, useState } from "react";

import { apiFetch, parseJsonSafely } from "./apiClient";
import { KENYA_COUNTIES } from "./counties";

/*
  CountyGate - shown on the worker pages.

  1. "setup"  : the worker has no county saved yet -> pop-up asks them to set it
                (right after sign-in, because the worker dashboard loads first).
  2. "moved"  : the worker HAS a county, location permission was already granted,
                and their current county is different -> pop-up asks if they moved.

  Honest limits of a website: it can only check while the app is open in the
  browser (on load, when the worker comes back to the tab, and every 30 minutes
  while it stays open). It cannot track in the background.

  Privacy: coordinates are sent once to the server, which turns them into a
  county name and forgets them. Only the county name is ever saved.
*/

const CHECK_EVERY_MS = 30 * 60 * 1000; // re-check while the app stays open
const MIN_GAP_MS = 5 * 60 * 1000;      // never check more often than this

// A tag unique to this sign-in, so "later" / "I'm still here" only last for this session.
const tag = () => (localStorage.getItem("token") || "").slice(-16);
const skipKey = () => `county-skip:${tag()}`;
const stillKey = (saved, now) => `county-still:${tag()}:${saved}>${now}`;
const lastKey = () => `county-last:${tag()}`;

function getPosition(options) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({ code: 0 });
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

async function countyFromPosition(pos) {
  const res = await apiFetch("/api/worker/detect_county", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
  });
  const json = await parseJsonSafely(res);
  if (res.ok && json.county) return json.county;
  throw new Error(json.error || "Could not detect your county.");
}

export default function CountyGate({ onCountyChange }) {
  const [mode, setMode] = useState(null); // null | "setup" | "moved"
  const [saved, setSaved] = useState(null);
  const [detected, setDetected] = useState("");
  const [choice, setChoice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const savedRef = useRef(undefined); // undefined = not loaded yet
  const checking = useRef(false);

  // Quietly compare the worker's current county with the saved one.
  // Only runs if the browser has ALREADY been given location permission,
  // so it never pops up a surprise permission prompt.
  const silentCheck = async (force) => {
    const current = savedRef.current;
    if (!current || checking.current || document.visibilityState !== "visible") return;
    if (!navigator.geolocation || !navigator.permissions) return;
    const last = Number(sessionStorage.getItem(lastKey()) || 0);
    if (!force && Date.now() - last < MIN_GAP_MS) return;

    checking.current = true;
    try {
      const perm = await navigator.permissions.query({ name: "geolocation" });
      if (perm.state !== "granted") return;
      sessionStorage.setItem(lastKey(), String(Date.now()));
      const pos = await getPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
      const now = await countyFromPosition(pos);
      if (
        now &&
        now !== savedRef.current &&
        !sessionStorage.getItem(stillKey(savedRef.current, now))
      ) {
        setDetected(now);
        setMode("moved");
      }
    } catch {
      /* stay silent: a failed check must never bother the worker */
    } finally {
      checking.current = false;
    }
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await apiFetch("/api/worker/profile");
        if (!res.ok) return;
        const json = await parseJsonSafely(res);
        const profile = json.worker || json;
        const county = profile.county || null;
        if (!alive) return;
        savedRef.current = county;
        setSaved(county);
        if (!county) {
          if (!sessionStorage.getItem(skipKey())) setMode("setup");
        } else {
          silentCheck(false);
        }
      } catch {
        /* ignore: the page still works without the pop-up */
      }
    })();

    const onVisible = () => {
      if (document.visibilityState === "visible") silentCheck(false);
    };
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(() => silentCheck(false), CHECK_EVERY_MS);

    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectNow = async () => {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const pos = await getPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
      const county = await countyFromPosition(pos);
      setChoice(county);
      setInfo(`We think you are in ${county} County. Press Save to confirm, or pick a different county.`);
    } catch (e) {
      if (e && e.code === 1) {
        setError("Location permission was denied. Please choose your county from the list.");
      } else if (e && typeof e.code === "number") {
        setError("Could not get your location. Please choose your county from the list.");
      } else {
        setError((e && e.message) || "Could not detect your county. Please choose it from the list.");
      }
    } finally {
      setBusy(false);
    }
  };

  const saveCounty = async (county) => {
    if (!KENYA_COUNTIES.includes(county)) {
      setError("Please choose your county.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await apiFetch("/api/worker/county", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ county }),
      });
      const json = await parseJsonSafely(res);
      if (!res.ok) {
        setError(json.error || "Could not save your county.");
        return;
      }
      savedRef.current = county;
      setSaved(county);
      setMode(null);
      setChoice("");
      setInfo("");
      // keep the stored profile in step so other pages don't show an old county
      try {
        const u = JSON.parse(localStorage.getItem("user") || "null");
        if (u) {
          u.county = county;
          localStorage.setItem("user", JSON.stringify(u));
        }
      } catch {
        /* ignore */
      }
      if (onCountyChange) onCountyChange(county);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const remindLater = () => {
    sessionStorage.setItem(skipKey(), "1");
    setMode(null);
  };

  const stillHere = () => {
    sessionStorage.setItem(stillKey(saved, detected), "1");
    setMode(null);
  };

  if (!mode) return null;
  const isSetup = mode === "setup";

  return (
    <>
      <style>{`
        .cg-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.78);
          display: flex; align-items: center; justify-content: center;
          padding: 20px; font-family: 'DM Sans', sans-serif;
        }
        .cg-card {
          background: #1a1a1a; border: 1px solid #2a2a2a; border-top: 3px solid #c89633;
          border-radius: 4px; width: 100%; max-width: 420px; padding: 28px 28px 22px;
          color: #e8e8e8; box-sizing: border-box;
        }
        .cg-pin { font-size: 30px; line-height: 1; margin-bottom: 10px; }
        .cg-title {
          font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 1.5px;
          color: #c89633; margin-bottom: 8px;
        }
        .cg-text { font-size: 13px; color: #999; line-height: 1.65; margin: 0 0 16px; }
        .cg-text b { color: #e8e8e8; font-weight: 500; }
        .cg-select {
          width: 100%; box-sizing: border-box; background: #111; border: 1px solid #2a2a2a;
          border-radius: 3px; padding: 11px 12px; color: #e8e8e8; font-size: 14px;
          font-family: inherit; margin-top: 10px; outline: none;
        }
        .cg-select:focus { border-color: #c89633; }
        .cg-btn {
          width: 100%; box-sizing: border-box; padding: 12px; border-radius: 3px; cursor: pointer;
          font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 1.5px;
          border: 1px solid #c89633; transition: opacity .2s;
        }
        .cg-btn:disabled { opacity: .5; cursor: not-allowed; }
        .cg-primary { background: #c89633; color: #0f0f0f; margin-top: 12px; }
        .cg-ghost { background: transparent; color: #c89633; }
        .cg-link {
          display: block; margin: 14px auto 0; background: none; border: none; cursor: pointer;
          color: #666; font-size: 12px; font-family: inherit; text-decoration: underline;
        }
        .cg-link:hover { color: #c89633; }
        .cg-msg { font-size: 12.5px; line-height: 1.55; margin-top: 12px; }
        .cg-msg.error { color: #e07070; }
        .cg-msg.info { color: #70c070; }
        .cg-fine { font-size: 11px; color: #555; margin-top: 12px; line-height: 1.5; }
      `}</style>

      <div className="cg-overlay">
        <div className="cg-card" role="dialog" aria-modal="true" aria-labelledby="cg-title">
          <div className="cg-pin">📍</div>
          <div className="cg-title" id="cg-title">
            {isSetup ? "Set your county" : "Have you moved?"}
          </div>

          {isSetup ? (
            <p className="cg-text">
              Clients look for workers by area. Tell us which county you work in.
              Clients see <b>only your county</b>, never your exact location.
            </p>
          ) : (
            <p className="cg-text">
              You seem to be in <b>{detected} County</b> now, but your profile says{" "}
              <b>{saved} County</b>. Keep it up to date so clients know where to find you.
            </p>
          )}

          {isSetup ? (
            <>
              <button type="button" className="cg-btn cg-ghost" onClick={detectNow} disabled={busy}>
                {busy ? "Working..." : "📍 Detect my county"}
              </button>
              <select
                className="cg-select"
                aria-label="County"
                value={choice}
                onChange={(e) => { setChoice(e.target.value); setError(""); }}
              >
                <option value="">Or choose your county...</option>
                {KENYA_COUNTIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                type="button"
                className="cg-btn cg-primary"
                onClick={() => saveCounty(choice)}
                disabled={busy || !choice}
              >
                Save county
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="cg-btn cg-primary"
                onClick={() => saveCounty(detected)}
                disabled={busy}
                style={{ marginTop: 0 }}
              >
                Update to {detected}
              </button>
              <button
                type="button"
                className="cg-btn cg-ghost"
                onClick={stillHere}
                disabled={busy}
                style={{ marginTop: 10 }}
              >
                I'm still in {saved}
              </button>
            </>
          )}

          {error && <div className="cg-msg error">{error}</div>}
          {info && !error && <div className="cg-msg info">{info}</div>}

          {isSetup && (
            <button type="button" className="cg-link" onClick={remindLater}>
              Remind me later
            </button>
          )}

          <div className="cg-fine">Your exact location is never saved or shown to anyone.</div>
        </div>
      </div>
    </>
  );
}
