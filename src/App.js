import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Signin from './components/Signin.jsx';
import WorkerSignup from './components/WorkerSignup.jsx';
import SignupAs from './components/SignupAs.jsx';
import WorkerProfile from './Profile/WorkerProfile';
import WorkerHome from './homepage/WorkerHome.jsx';
import UserSignup from './components/UserSignup';
import UserSignin from './components/UserSignin';
import UserHome from './homepage/UserHome';
import AddPlan from './homepage/AddPlan';
import ViewPlans from './homepage/ViewPlans';
import SentRequests from './homepage/SentRequests';
import ViewReplies from './homepage/ViewReplies';
import UserProfile from './homepage/UserProfile';
import AboutAs from './components/AboutAs';

import fbLogo from './images/fb.png';
import inLogo from './images/in.png';
import xLogo from './images/x.png';
import './App.css';

// Public routes where the Navbar is shown
const PUBLIC_PATHS = ["/signup-as", "/signin", "/worker-signup", "/user-signup", "/user-signin", "/about", "/"];

function NavbarWrapper() {
  const location = useLocation();
  const show = PUBLIC_PATHS.some(p => location.pathname === p);
  return show ? <Navbar /> : null;
}

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <NavbarWrapper />
        <main className="main-content">
          <Routes>
            {/* Public routes */}
            <Route path="/signup-as"     element={<SignupAs />} />
            <Route path="/about"         element={<AboutAs />} />
            <Route path="/signin"        element={<Signin />} />
            <Route path="/worker-signup" element={<WorkerSignup />} />
            <Route path="/user-signup"   element={<UserSignup />} />
            <Route path="/user-signin"   element={<UserSignin />} />

            {/* Worker only */}
            <Route path="/worker" element={
              <ProtectedRoute role="worker">
                <WorkerHome />
              </ProtectedRoute>
            } />
            <Route path="/worker-profile" element={
              <ProtectedRoute role="worker">
                <WorkerProfile />
              </ProtectedRoute>
            } />

            {/* User only */}
            <Route path="/home" element={
              <ProtectedRoute role="user">
                <UserHome />
              </ProtectedRoute>
            } />
            <Route path="/add-plan" element={
              <ProtectedRoute role="user">
                <AddPlan />
              </ProtectedRoute>
            } />
            <Route path="/view-plans" element={
              <ProtectedRoute role="user">
                <ViewPlans />
              </ProtectedRoute>
            } />
            <Route path="/sent-requests" element={
              <ProtectedRoute role="user">
                <SentRequests />
              </ProtectedRoute>
            } />
            <Route path="/view-replies" element={
              <ProtectedRoute role="user">
                <ViewReplies />
              </ProtectedRoute>
            } />
            <Route path="/user-profile" element={
              <ProtectedRoute role="user">
                <UserProfile />
              </ProtectedRoute>
            } />

            {/* Default → go to about page */}
            <Route path="/"  element={<Navigate to="/about" replace />} />
            <Route path="*"  element={<Navigate to="/signup-as" replace />} />
          </Routes>
        </main>

        <footer style={{
          background: '#0d0d0d',
          borderTop: '1px solid #1a1a1a',
          fontFamily: "'DM Sans', sans-serif",
          padding: '48px 40px 28px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #c89633, transparent)' }} />

          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>

              {/* Brand */}
              <div>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 32, color: '#c89633', letterSpacing: 4, lineHeight: 1 }}>SteelSmith</div>
                <div style={{ fontSize: 11, color: '#333', letterSpacing: 2, textTransform: 'uppercase', marginTop: 6 }}>Construction Platform</div>
                <div style={{ width: 36, height: 2, background: '#c89633', marginTop: 12 }} />
                <p style={{ fontSize: 13, color: '#444', marginTop: 14, lineHeight: 1.7, maxWidth: 260 }}>
                  Connecting skilled tradespeople with clients across Kenya's construction industry.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <div style={{ fontSize: 11, color: '#c89633', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16, fontWeight: 500 }}>Quick Links</div>
                {[
                  { label: 'Browse Workers', href: '/home' },
                  { label: 'My Plans',       href: '/view-plans' },
                  { label: 'Sent Requests',  href: '/sent-requests' },
                  { label: 'View Replies',   href: '/view-replies' },
                  { label: 'My Profile',     href: '/user-profile' },
                  { label: 'About Us',       href: '/about' },
                ].map(link => (
                  <a key={link.href} href={link.href} style={{ display: 'block', fontSize: 13, color: '#3a3a3a', textDecoration: 'none', padding: '4px 0', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.target.style.color = '#c89633'}
                    onMouseLeave={e => e.target.style.color = '#3a3a3a'}>
                    {link.label}
                  </a>
                ))}
              </div>

              {/* Social */}
              <div>
                <div style={{ fontSize: 11, color: '#c89633', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16, fontWeight: 500 }}>Stay Connected</div>
                <p style={{ fontSize: 13, color: '#333', marginBottom: 16, lineHeight: 1.6 }}>Follow us for updates<br />and promotions.</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { href: 'https://www.facebook.com',  src: fbLogo, alt: 'Facebook'  },
                    { href: 'https://www.instagram.com', src: inLogo, alt: 'Instagram' },
                    { href: 'https://www.x.com',         src: xLogo,  alt: 'X'         },
                  ].map(s => (
                    <a key={s.alt} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.alt}
                      style={{ width: 38, height: 38, background: '#111', border: '1px solid #1e1e1e', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#c89633'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e1e'}>
                      <img src={s.src} alt={s.alt} style={{ width: 18, height: 18, objectFit: 'contain', filter: 'brightness(0.6)' }} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: '#1a1a1a', marginBottom: 20 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <p style={{ fontSize: 11, color: '#252525', letterSpacing: 0.5 }}>
                &copy; {new Date().getFullYear()} Steel Smith Construction Corporation. All rights reserved.
              </p>
              <p style={{ fontSize: 11, color: '#1e1e1e', letterSpacing: 1, textTransform: 'uppercase' }}>
                Built for Kenya's Builders
              </p>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
