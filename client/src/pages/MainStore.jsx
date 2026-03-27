import React, { useState } from 'react';
import { useStock } from '../context/StockContext';
import { upsertOpeningBalance, closePeriod } from '../api/logsApi';
import { Store, Search, CalendarCheck, Lock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import PeriodSelector from '../components/PeriodSelector';

const MainStore = () => {
  const { items, outlets, grnLog, issueLog, adjLog, openingBalances, updateOpeningBalanceInState, getMainStoreBalance, loading, activePeriod, activePeriodId, isReadOnly, onPeriodClosed } = useStock();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  if (loading) {
    return <div className="page-body"><div className="skeleton" style={{ height: '400px', borderRadius: '12px' }} /></div>;
  }

  // --- Month-End Close Confirmation Modal ---
  const CloseModal = () => (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'var(--color-white)', borderRadius:'16px', padding:'32px', maxWidth:'440px', width:'90%', boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
          <AlertTriangle size={28} style={{ color:'#E67E22' }} />
          <h3 style={{ fontFamily:'Playfair Display', fontSize:'20px', margin:0 }}>Close Month: {activePeriod?.label}?</h3>
        </div>
        <p style={{ color:'var(--color-text-muted)', marginBottom:'24px', lineHeight:'1.6' }}>
          This will <strong>lock</strong> the current period and automatically carry the closing balance forward as the <strong>opening balance</strong> for the new period. All log pages will start fresh for the new month.
        </p>
        <div style={{ display:'flex', gap:'12px', justifyContent:'flex-end' }}>
          <button className="btn-secondary" onClick={() => setShowCloseModal(false)} disabled={isClosing}>Cancel</button>
          <button className="btn-primary" onClick={handleClosePeriod} disabled={isClosing} style={{ background:'#E67E22', borderColor:'#E67E22' }}>
            {isClosing ? 'Processing...' : '✓ Confirm Month-End Close'}
          </button>
        </div>
      </div>
    </div>
  );

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (i.item_code && i.item_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (i.category && i.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const mainStoreOutlet = outlets.find(o => o.is_main_store) || {};

  const handleOpeningChange = async (itemId, inputQty) => {
    const numericQty = inputQty === '' ? 0 : Number(inputQty);
    if (numericQty < 0) {
      toast.error('Opening balance cannot be negative.');
      return;
    }

    try {
      const payload = { item_id: itemId, outlet_id: mainStoreOutlet.id, qty: numericQty, period_id: activePeriodId };
      const updatedOB = await upsertOpeningBalance(payload);
      updateOpeningBalanceInState(updatedOB);
      toast.success('Opening balance saved successfully.');
    } catch (err) {
      toast.error('Failed to save opening balance.');
    }
  };

  const handleClosePeriod = async () => {
    setIsClosing(true);
    try {
      const result = await closePeriod(activePeriodId);
      toast.success(`${activePeriod?.label} closed! New period: ${result.newPeriod.label}`);
      setShowCloseModal(false);
      await onPeriodClosed(result.newPeriod.id);
    } catch (err) {
      toast.error('Failed to close period: ' + (err?.response?.data?.error || err.message));
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {showCloseModal && <CloseModal />}
      
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h3 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: 'var(--color-primary)', marginBottom: '8px' }}>
            Main Store Inventory
          </h3>
          <p className="subheading">Set opening balances directly and watch them aggregate dynamically with logs.</p>
        </div>
        
        <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
          <PeriodSelector />
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search items..." 
              className="input-field"
              style={{ paddingLeft: '44px', borderRadius: '24px', background: 'var(--color-white)' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {!isReadOnly && (
            <button
              className="btn-primary"
              style={{ background: '#E67E22', borderColor: '#E67E22', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
              onClick={() => setShowCloseModal(true)}
            >
              <CalendarCheck size={16} /> Close Month
            </button>
          )}
          {isReadOnly && (
            <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', background:'rgba(192,57,43,0.08)', borderRadius:'8px', color:'#C0392B', fontWeight:700, fontSize:'13px' }}>
              <Lock size={14}/> Closed Period
            </div>
          )}
        </div>
      </div>

      {/* Main Store Table */}
      <div className="card table-container" style={{ padding: 0 }}>
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <Store size={48} style={{ opacity: 0.3 }} />
            <p>No items found matching your search.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 240px)' }}>
            <table className="data-table" style={{ border: 'none' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th>Category</th>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Unit</th>
                  <th style={{ textAlign: 'center', background: 'rgba(52, 152, 219, 0.05)', color: '#2980B9' }}>Opening (Edit)</th>
                  <th style={{ textAlign: 'right', color: '#27AE60' }}>Total GRN In</th>
                  <th style={{ textAlign: 'right', color: '#E67E22' }}>Total Issued Out</th>
                  <th style={{ textAlign: 'right' }}>Total ADJ (+/-)</th>
                  <th style={{ textAlign: 'right', background: 'rgba(245, 166, 35, 0.1)', color: 'var(--color-text-dark)' }}>Closing Bal</th>
                  <th style={{ textAlign: 'center' }}>Min Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => {
                  const grn = grnLog
                    .filter(g => g.item_id === item.id)
                    .reduce((sum, g) => sum + Number(g.qty || 0), 0);
                  
                  const issued = issueLog
                    .filter(i => i.item_id === item.id)
                    .reduce((sum, i) => sum + Number(i.qty || 0), 0);
                  
                  const adjs = adjLog
                    .filter(a => a.outlet_id === mainStoreOutlet.id && a.item_id === item.id)
                    .reduce((sum, a) => sum + Number(a.adjustment || 0), 0);

                  const obEntry = openingBalances.find(ob => ob.item_id === item.id && ob.outlet_id === mainStoreOutlet.id);
                  const obQty = obEntry ? obEntry.qty : 0;

                  const balance = getMainStoreBalance(item.id);
                  const minStock = item.min_stock || 5;
                  
                  let badge = <span className="badge badge-success">IN STOCK</span>;
                  if (balance <= 0) badge = <span className="badge badge-empty">OUT OF STOCK</span>;
                  else if (balance <= minStock) badge = <span className="badge badge-low">LOW STOCK</span>;

                  return (
                    <tr key={item.id}>
                      <td style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 700 }}>{item.category || '-'}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{item.item_code || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{item.unit}</td>
                      
                      <td style={{ textAlign: 'center', background: 'rgba(52, 152, 219, 0.02)' }}>
                        {isReadOnly ? (
                          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-dark)', padding: '8px 0', textAlign: 'center' }}>{obQty}</div>
                        ) : (
                          <input 
                            key={`${item.id}-${activePeriodId}`}
                            type="number" 
                            className="input-field" 
                            style={{ width: '80px', padding: '6px', textAlign: 'center', fontWeight: 700, margin: '0 auto', display: 'block' }}
                            defaultValue={obQty}
                            onBlur={(e) => {
                              if (e.target.value !== String(obQty)) {
                                handleOpeningChange(item.id, e.target.value);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.target.blur();
                              }
                            }}
                          />
                        )}
                      </td>

                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#27AE60' }}>{grn > 0 ? `+${grn}` : '-'}</td>
                      
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#E67E22' }}>{issued > 0 ? `-${issued}` : '-'}</td>
                      
                      <td style={{ textAlign: 'right', fontWeight: 700, color: adjs > 0 ? '#27AE60' : adjs < 0 ? '#C0392B' : 'var(--color-text-muted)' }}>
                        {adjs > 0 ? `+${adjs}` : adjs === 0 ? '-' : adjs}
                      </td>
                      
                      <td style={{ textAlign: 'right', fontWeight: 900, background: 'rgba(245, 166, 35, 0.03)', color: balance <= 0 ? 'var(--color-danger)' : 'var(--color-text-dark)', fontSize: '16px', fontFamily: 'Playfair Display' }}>
                        {balance}
                      </td>
                      
                      <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--color-text-muted)' }}>{minStock}</td>
                      
                      <td style={{ textAlign: 'center' }}>{badge}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default MainStore;
