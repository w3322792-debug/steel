// apiClient.js  (Create React App)
//
// Backend URL comes from REACT_APP_API_URL, set at BUILD time:
//   - local dev:   leave it unset -> falls back to http://127.0.0.1:5000
//   - production:  set REACT_APP_API_URL=https://your-backend.onrender.com
//                  in Vercel/Netlify BEFORE building, then redeploy.

const API_BASE = (process.env.REACT_APP_API_URL || "http://127.0.0.1:5000").replace(/\/$/, "");

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

/**
 * fetch() wrapper:
 *  - prefixes the backend base URL
 *  - attaches the JWT as "Authorization: Bearer <token>" when one is stored
 *  - does NOT set Content-Type, so FormData bodies get the correct multipart boundary
 *    (for JSON calls, pass headers: { "Content-Type": "application/json" } yourself)
 */
export function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem("token");
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(apiUrl(path), { ...options, headers });
}

/** Parses a response body as JSON without throwing; returns {} if not JSON. */
export async function parseJsonSafely(res) {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}
