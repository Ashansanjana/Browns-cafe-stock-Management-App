import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Store,
  LogOut,
  ArrowDownToLine,
  ArrowUpRightFromSquare,
  FileEdit,
  MinusCircle,
  CalendarDays,
  PieChart,
  Database
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/items', icon: Database, label: 'Item Master' },
  { to: '/grn-log', icon: ArrowDownToLine, label: 'GRN Log' },
  { to: '/issue-log', icon: ArrowUpRightFromSquare, label: 'Issue Log' },
  { to: '/usage-log', icon: MinusCircle, label: 'Usage Log' },
  { to: '/adj-log', icon: FileEdit, label: 'Adj Log' },
  { to: '/main-store', icon: Store, label: 'Main Store' },
  { to: '/outlets', icon: Package, label: 'Outlets' },
  { to: '/weekly-tracker', icon: CalendarDays, label: 'Weekly Tracker' },
  { to: '/summary-report', icon: PieChart, label: 'Summary Report' }
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo Area */}
      <div className="sidebar-logo-area">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', color: 'var(--color-white)', boxShadow: '0 4px 10px rgba(245, 166, 35, 0.3)'
          }}>☕</div>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-white)', fontWeight: 700, fontSize: '18px', lineHeight: 1.2 }}>
              Browns
            </div>
            <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.6)', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700, marginTop: '2px' }}>
              Stock System
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} style={{ marginRight: '12px' }} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ marginBottom: '16px', padding: '0 8px' }}>
          <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700 }}>Admin</div>
          <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '14px', color: 'var(--color-white)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
            {user?.email || 'Admin'}
          </div>
        </div>
        <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.2)' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
