import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/items': 'Item Master Management',
  '/grn-log': 'GRN LOG',
  '/issue-log': 'ISSUE LOG',
  '/usage-log': 'USAGE LOG',
  '/adj-log': 'ADJ LOG',
  '/main-store': 'Main Store',
  '/outlets': 'Outlets',
  '/weekly-tracker': 'WEEKLY TRACKER',
  '/summary-report': 'SUMMARY REPORT',
};

const Navbar = () => {
  const location = useLocation();
  const pathBase = '/' + location.pathname.split('/')[1];
  const title = pageTitles[pathBase] || 'Browns Café';

  return (
    <header className="top-navbar" style={{ position: 'sticky', top: 0, zIndex: 30 }}>
      <h2 className="page-title" style={{ flex: 1, margin: 0 }}>
        {title}
      </h2>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'rgba(245, 166, 35, 0.1)', border: '1px solid rgba(245, 166, 35, 0.3)',
        borderRadius: '20px', padding: '6px 14px',
      }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }} />
        <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '13px', color: 'var(--color-text-dark)', fontWeight: 600 }}>Admin View</span>
      </div>
    </header>
  );
};

export default Navbar;
