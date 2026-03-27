import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStock } from '../context/StockContext';
import { upsertOpeningBalance } from '../api/logsApi';
import { exportToCSV } from '../utils/csvExport';
import { toast } from 'sonner';
import { ArrowLeft, Search, MapPin, Download } from 'lucide-react';
import PeriodSelector from '../components/PeriodSelector';

const OutletDetail = () => {
  const { id: outletId } = useParams();
  const navigate = useNavigate();
  
  const { items, outlets, issueLog, adjLog, usageLog, openingBalances, updateOpeningBalanceInState, getOutletBalance, loading, activePeriodId, activePeriod, isReadOnly } = useStock();
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return <div className="page-body"><div className="skeleton" style={{ height: '400px', borderRadius: '12px' }} /></div>;
  }

  const outlet = outlets.find(o => o.id === outletId) || {};

  // Show all items so users can manually set opening stocks for unissued items too
  const relevantItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.item_code && item.item_code.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const handleOpeningChange = async (itemId, inputQty) => {
    const numericQty = inputQty === '' ? 0 : Number(inputQty);
    if (numericQty < 0) {
      toast.error('Opening balance cannot be negative.');
      return;
    }

    try {
      const payload = { item_id: itemId, outlet_id: outletId, qty: numericQty, period_id: activePeriodId };
      const updatedOB = await upsertOpeningBalance(payload);
      updateOpeningBalanceInState(updatedOB);
      toast.success('Opening balance saved successfully.');
    } catch (err) {
      toast.error('Failed to save opening balance.');
    }
  };

  const periodLabel = activePeriod?.label || 'Report';

  const handleExport = () => {
    // Sheet 1 style: Stock Summary
    const summaryColumns = [
      { header: 'Item Code', key: 'item_code' },
      { header: 'Item Name', key: 'name' },
      { header: 'Unit', key: 'unit' },
      { header: 'Opening Stock', key: row => openingBalances.find(ob => ob.item_id === row.id && ob.outlet_id === outletId)?.qty || 0 },
      { header: 'Total Received from Main', key: row => issueLog.filter(i => i.item_id === row.id && i.outlet_id === outletId).reduce((sum, i) => sum + Number(i.qty || 0), 0) },
      { header: 'Total Usage', key: row => usageLog.filter(u => u.item_id === row.id && u.outlet_id === outletId).reduce((sum, u) => sum + Number(u.qty || 0), 0) },
      { header: 'Total Local ADJ', key: row => adjLog.filter(a => a.outlet_id === outletId && a.item_id === row.id).reduce((sum, a) => sum + Number(a.adjustment || 0), 0) },
      { header: 'Live Balance', key: row => getOutletBalance(row.id, outletId) }
    ];
    const filename = `${outlet.name?.replace(/\s+/g, '_')}_Monthly_Report_${periodLabel}.csv`;
    exportToCSV(filename, summaryColumns, relevantItems);
    toast.success(`Downloaded: ${filename}`);
  };

  return (
    <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <button 
            onClick={() => navigate('/outlets')} 
            className="btn-secondary" 
            style={{ marginBottom: '16px', padding: '6px 12px', fontSize: '13px' }}
          >
            <ArrowLeft size={16} /> Back to Outlets
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MapPin size={28} color="var(--color-primary)" />
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: '28px', color: 'var(--color-text-dark)', margin: 0 }}>
              {outlet.name || 'Unknown Outlet'} Stock
            </h3>
          </div>
          <p className="subheading" style={{ marginTop: '8px' }}>
            Branch inventory tracking initial opening stocks and manual physical adjustments.
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <PeriodSelector />
          <div style={{ position: 'relative', width: '250px' }}>
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
          <button className="btn-secondary" onClick={handleExport} style={{ padding: '0 16px', height: '42px' }}>
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* Outlet Store Table */}
      <div className="card table-container" style={{ padding: 0 }}>
        {relevantItems.length === 0 ? (
          <div className="empty-state">
            <MapPin size={48} style={{ opacity: 0.3 }} />
            <p>No items found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
            <table className="data-table" style={{ border: 'none' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Unit</th>
                  <th style={{ textAlign: 'center', background: 'rgba(52, 152, 219, 0.05)', color: '#2980B9' }}>Opening (Edit)</th>
                  <th style={{ textAlign: 'right', color: '#1E8449' }}>Total Received from Main</th>
                  <th style={{ textAlign: 'right', color: '#E74C3C' }}>Total Usage</th>
                  <th style={{ textAlign: 'right' }}>Total Local ADJ (+/-)</th>
                  <th style={{ textAlign: 'right', background: 'rgba(245, 166, 35, 0.1)', color: 'var(--color-text-dark)' }}>Live Balance</th>
                </tr>
              </thead>
              <tbody>
                {relevantItems.map(item => {
                  const received = issueLog
                    .filter(i => i.item_id === item.id && i.outlet_id === outletId)
                    .reduce((sum, i) => sum + Number(i.qty || 0), 0);
                  
                  const usage = usageLog
                    .filter(u => u.item_id === item.id && u.outlet_id === outletId)
                    .reduce((sum, u) => sum + Number(u.qty || 0), 0);
                  
                  const adjs = adjLog
                    .filter(a => a.outlet_id === outletId && a.item_id === item.id)
                    .reduce((sum, a) => sum + Number(a.adjustment || 0), 0);

                  const obEntry = openingBalances.find(ob => ob.item_id === item.id && ob.outlet_id === outletId);
                  const obQty = obEntry ? obEntry.qty : 0;

                  const balance = getOutletBalance(item.id, outletId);

                  return (
                    <tr key={item.id}>
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

                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#1E8449' }}>{received > 0 ? `+${received}` : '-'}</td>
                      
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#E74C3C' }}>{usage > 0 ? `-${usage}` : '-'}</td>
                      
                      <td style={{ textAlign: 'right', fontWeight: 700, color: adjs > 0 ? '#27AE60' : adjs < 0 ? '#C0392B' : 'var(--color-text-muted)' }}>
                        {adjs > 0 ? `+${adjs}` : adjs === 0 ? '-' : adjs}
                      </td>
                      
                      <td style={{ textAlign: 'right', fontWeight: 900, background: 'rgba(245, 166, 35, 0.03)', color: balance <= 0 ? 'var(--color-danger)' : 'var(--color-text-dark)', fontSize: '16px', fontFamily: 'Playfair Display' }}>
                        {balance}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Received from Main Store — Detail Log */}
      {(() => {
        const outletIssues = issueLog.filter(i => i.outlet_id === outletId);
        return outletIssues.length > 0 ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontFamily: 'Lato', fontSize: '15px', fontWeight: 800, color: 'var(--color-text-dark)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#27AE60', borderRadius: '50%' }} />
                Received from Main Store — {periodLabel}
              </h4>
              <button
                onClick={handleExport}
                style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 18px', background: 'var(--color-secondary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontFamily: 'Lato', fontSize: '13px', cursor: 'pointer' }}
              >
                <Download size={14} /> Download Monthly Report
              </button>
            </div>
            <div className="table-container" style={{ marginTop: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Week No.</th>
                      <th>Item Code</th>
                      <th>Item Name</th>
                      <th>Unit</th>
                      <th style={{ textAlign: 'right', color: '#27AE60' }}>Qty Received</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outletIssues.map(issue => {
                      const itemObj = items.find(i => i.id === issue.item_id) || {};
                      return (
                        <tr key={issue.id}>
                          <td>{new Date(issue.date).toLocaleDateString()}</td>
                          <td style={{ color: 'var(--color-text-muted)' }}>W{issue.week_no}</td>
                          <td style={{ color: 'var(--color-text-muted)' }}>{itemObj.item_code || '-'}</td>
                          <td style={{ fontWeight: 600 }}>{itemObj.name || 'Unknown'}</td>
                          <td>{itemObj.unit || '-'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#27AE60' }}>+{issue.qty}</td>
                          <td>{issue.notes || '-'}</td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: 'rgba(39,174,96,0.05)', fontWeight: 700 }}>
                      <td colSpan="5" style={{ textAlign: 'right' }}>Total Received:</td>
                      <td style={{ textAlign: 'right', color: '#27AE60' }}>
                        +{outletIssues.reduce((s, i) => s + Number(i.qty || 0), 0)}
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', fontStyle: 'italic' }}>No stock received from Main Store this period.</p>
            <button
              onClick={handleExport}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 18px', background: 'var(--color-secondary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontFamily: 'Lato', fontSize: '13px', cursor: 'pointer' }}
            >
              <Download size={14} /> Download Monthly Report
            </button>
          </div>
        );
      })()}

    </div>
  );
};

export default OutletDetail;
