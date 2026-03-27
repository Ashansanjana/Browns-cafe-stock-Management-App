import React from 'react';
import { useStock } from '../context/StockContext';
import { PackageSearch, FileBox, FileDown, FileEdit, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const { items, outlets, grnLog, issueLog, adjLog, getMainStoreBalance, loading } = useStock();

  // Compute Low Stock items
  const lowStockItems = items.filter(item => {
    const bal = getMainStoreBalance(item.id);
    const min = item.min_stock || 5;
    return bal <= min;
  }).map(item => ({
    ...item,
    currentBalance: getMainStoreBalance(item.id)
  }));

  if (loading) {
    return (
      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />)}
      </div>
    );
  }

  const numBranchOutlets = outlets.filter(o => !o.is_main_store).length;

  return (
    <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div style={{ padding: '0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ color: 'var(--color-primary)' }}>☕ BROWN BEAN COFFEE — STORE MANAGEMENT SYSTEM</h1>
          <p className="subheading" style={{ marginTop: '8px', fontSize: '15px' }}>
            Main Store + {numBranchOutlets} Outlets | <strong>{items.length}</strong> Master Items | Live Event-Sourced Updating
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Total Items</span>
            <PackageSearch size={20} color="var(--color-primary)" />
          </div>
          <span className="stat-value">{items.length}</span>
        </div>
        
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Total GRN Entries</span>
            <FileDown size={20} color="var(--color-primary)" />
          </div>
          <span className="stat-value">{grnLog.length}</span>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Total Issues Logged</span>
            <FileBox size={20} color="var(--color-primary)" />
          </div>
          <span className="stat-value">{issueLog.length}</span>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Adjustments Made</span>
            <FileEdit size={20} color="var(--color-primary)" />
          </div>
          <span className="stat-value">{adjLog.length}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
        
        {/* How It Works */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontFamily: 'Playfair Display', fontSize: '22px' }}>System Architecture: How It Works</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</div>
              <div>
                <h4 style={{ fontFamily: 'Lato', fontSize: '14px', fontWeight: 800 }}>RECEIVE STOCK</h4>
                <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: 1.5 }}>Use the <strong>GRN LOG</strong> to record vendor deliveries into the Main Store. Automatically aggregates into current stock levels.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</div>
              <div>
                <h4 style={{ fontFamily: 'Lato', fontSize: '14px', fontWeight: 800 }}>ISSUE TO OUTLET</h4>
                <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: 1.5 }}>Use the <strong>ISSUE LOG</strong> to transfer goods. This continuously deducts from the Main Store and credits the individual outlet logs.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>3</div>
              <div>
                <h4 style={{ fontFamily: 'Lato', fontSize: '14px', fontWeight: 800 }}>STOCK ADJUSTMENTS</h4>
                <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: 1.5 }}>Following a physical tally, use the <strong>ADJ LOG</strong> to explicitly correct a location's balance. Reconciles seamlessly with incoming and outgoing events.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>4</div>
              <div>
                <h4 style={{ fontFamily: 'Lato', fontSize: '14px', fontWeight: 800 }}>TRACK & ACT</h4>
                <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: 1.5 }}>View live status under the <strong>Main Store</strong> and <strong>Outlets</strong> tabs. Monitor trends using the <strong>Weekly Tracker</strong> and <strong>Summary Reports</strong>.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontFamily: 'Playfair Display', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-danger)' }}>
            <AlertTriangle size={24} /> Low Stock Alerts
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Main Store items at or below capacity (≤ 5).</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px', overflowY: 'auto', maxHeight: '300px', paddingRight: '8px' }}>
            {lowStockItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#27AE60', fontWeight: 600, background: 'rgba(39, 174, 96, 0.1)', borderRadius: '12px' }}>
                All stock levels are perfectly healthy!
              </div>
            ) : (
              lowStockItems.map(item => (
                <div key={item.id} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '16px', background: '#FFF9F9', border: '1px solid rgba(192, 57, 43, 0.2)', borderRadius: '12px' 
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-dark)' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{item.item_code || 'Unknown Code'}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span className="badge badge-empty">⛔ {item.currentBalance <= 0 ? 'OUT' : 'LOW'}</span>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--color-danger)', fontFamily: 'Playfair Display' }}>
                      {item.currentBalance} <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'Lato' }}>{item.unit}</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
      </div>
      
    </div>
  );
};

export default Dashboard;
