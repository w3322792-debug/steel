import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar({ worker, onSignOut }) {
  const [collapsed, setCollapsed] = useState(true); // closed on mobile by default
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active view from current path (or you can use a prop)
  const path = location.pathname;

  const toggleSidebar = () => setCollapsed(!collapsed);

  const menuItems = [
    {
      label: 'Home',
      icon: '🏠',
      path: '/worker',          // adjust to your route
      action: () => navigate('/worker'),
    },
    {
      label: 'Requests',
      icon: '📋',
      path: '/worker/requests', // or just track with state
      action: () => navigate('/worker/requests'),
    },
    {
      label: 'Profile',
      icon: '👷',
      path: '/worker/profile',
      action: () => navigate('/worker/profile'),
    },
  ];

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="sidebar-hamburger"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        {collapsed ? '☰' : '✕'}
      </button>

      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${!collapsed ? 'visible' : ''}`}
        onClick={toggleSidebar}
      />

      <aside className={`sidebar ${!collapsed ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <span>SteelSmith</span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={`sidebar-item ${path === item.path ? 'active' : ''}`}
              onClick={() => {
                item.action();
                setCollapsed(true); // close on mobile after click
              }}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-user-icon">👷</span>
            <span className="sidebar-username">{worker?.username || 'Worker'}</span>
          </div>
          <button className="sidebar-logout" onClick={onSignOut}>
            <span>🚪</span> Log out
          </button>
        </div>
      </aside>
    </>
  );
}