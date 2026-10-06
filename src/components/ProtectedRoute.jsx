import { Navigate, useLocation } from "react-router-dom";

function getSession() {
  try {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) return { token: null, role: null, expired: true };

    // Decode only for expiry UX. Never use decoded claims as server authorization.
    const parts = token.split(".");
    if (parts.length !== 3) return { token, role, expired: true };

    let payload;
    try {
      payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    } catch {
      return { token, role, expired: true };
    }

    const expired = Number.isFinite(payload.exp) && payload.exp <= Math.floor(Date.now() / 1000);
    return { token, role, expired };
  } catch {
    return { token: null, role: null, expired: true };
  }
}

export default function ProtectedRoute({ children, role }) {
  const location = useLocation();
  const { token, role: savedRole, expired } = getSession();

  if (!token || expired) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    return <Navigate to="/signup-as" replace state={{ from: location.pathname }} />;
  }

  // This is only a client-side routing convenience. The backend MUST enforce role
  // permissions for every protected API/resource as well.
  if (role && savedRole !== role) {
    if (savedRole === "worker") return <Navigate to="/worker" replace />;
    if (savedRole === "user") return <Navigate to="/home" replace />;
    return <Navigate to="/signup-as" replace />;
  }

  return children;
}
