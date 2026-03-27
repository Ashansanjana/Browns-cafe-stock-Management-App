import React, { useState } from 'react';
import { useStock } from '../context/StockContext';
import { addUsageLog, deleteUsageLog } from '../api/logsApi';
import { exportToCSV } from '../utils/csvExport';
import { toast } from 'sonner';
import { MinusCircle, Trash2, Lock, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PeriodSelector from '../components/PeriodSelector';

const UsageLog = () => {
  const { items, outlets, usageLog, addUsageToState, removeUsageFromState, getOutletBalance, activePeriodId, activePeriod, isReadOnly } = useStock();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    outlet_id: '',
    item_id: '',
    qty: '',
    logged_by: user?.email || '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exportOutletId, setExportOutletId] = useState('');

  // Filter out main store, as usage is typically for branch outlets directly hit in live balance
  const branchOutlets = outlets.filter(o => !o.is_main_store);
  
  const selectedItem = items.find(i => i.id === formData.item_id) || {};
  const currentStock = (formData.item_id && formData.outlet_id) 
    ? getOutletBalance(formData.item_id, formData.outlet_id) 
    : '-';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.item_id || !formData.outlet_id || !formData.qty) {
      toast.error("Please fill all required fields.");
      return;
    }

    if (Number(formData.qty) <= 0) {
      toast.error("Quantity used must be greater than zero.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        qty: Number(formData.qty),
        period_id: activePeriodId
      };

      const newEntry = await addUsageLog(payload);
      addUsageToState(newEntry);
      toast.success("Usage log added successfully");
      setFormData({ ...formData, item_id: '', qty: '', notes: '' });
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to add usage log");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this Usage entry?")) {
      try {
        await deleteUsageLog(id);
        removeUsageFromState(id);
        toast.success("Entry deleted");
      } catch (err) {
        toast.error("Failed to delete entry");
      }
    }
  };

  const handleExport = () => {
    const outletToExport = exportOutletId
      ? outlets.find(o => o.id === exportOutletId)
      : null;

    const dataToExport = exportOutletId
      ? usageLog.filter(u => u.outlet_id === exportOutletId)
      : usageLog;

    if (!dataToExport.length) {
      toast.error('No usage entries found for the selected outlet and period.');
      return;
    }

    const periodLabel = activePeriod?.label || 'Usage';
    const outletLabel = outletToExport ? outletToExport.name.replace(/\s+/g, '_') : 'All_Outlets';
    const filename = `Usage_Report_${outletLabel}_${periodLabel}.csv`;

    const columns = [
      { header: 'Date', key: row => new Date(row.date).toLocaleDateString() },
      { header: 'Outlet', key: row => outlets.find(o => o.id === row.outlet_id)?.name || '-' },
      { header: 'Item Code', key: row => items.find(i => i.id === row.item_id)?.item_code || '-' },
      { header: 'Item Name', key: row => items.find(i => i.id === row.item_id)?.name || '-' },
      { header: 'Unit', key: row => items.find(i => i.id === row.item_id)?.unit || '-' },
      { header: 'Qty Used', key: 'qty' },
      { header: 'Logged By', key: 'logged_by' },
      { header: 'Notes', key: 'notes' },
    ];

    exportToCSV(filename, columns, dataToExport);
    toast.success(`Downloaded: ${filename}`);
  };

  return (
    <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div style={{ padding: '0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: 'var(--color-primary)', marginBottom: '8px', textTransform: 'uppercase' }}>
            BROWN BEAN COFFEE — OUTLET USAGE LOG
          </h3>
          <p className="subheading">Record daily or weekly item consumption directly at the outlets.</p>
        </div>

        {/* Period + Export Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <PeriodSelector />
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: '10px',
            background: 'rgba(255,255,255,0.45)', padding: '10px 14px',
            borderRadius: '12px', border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-text-dark)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>
                Filter Outlet
              </label>
              <select
                className="input-field"
                style={{ height: '36px', padding: '0 10px', background: 'var(--color-white)', border: 'none', borderRadius: '8px', fontFamily: 'Lato', fontSize: '13px', minWidth: '180px' }}
                value={exportOutletId}
                onChange={e => setExportOutletId(e.target.value)}
              >
                <option value="">All Outlets</option>
                {branchOutlets.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleExport}
              className="btn-secondary"
              style={{ height: '36px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 700, border: 'none', background: 'var(--color-secondary)', color: 'var(--color-white)', borderRadius: '8px', whiteSpace: 'nowrap' }}
            >
              <Download size={15} /> Download Report
            </button>
          </div>
        </div>
      </div>

      {/* Form Card */}
      {isReadOnly ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'rgba(192, 57, 43, 0.06)', border: '1px solid rgba(192, 57, 43, 0.2)', borderRadius: '12px' }}>
          <Lock size={18} style={{ color: '#C0392B' }} />
          <span style={{ fontWeight: 700, color: '#C0392B' }}>Period "{activePeriod?.label}" is closed. Switch to the current open period to add new entries.</span>
        </div>
      ) : (
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontFamily: 'Lato', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-dark)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MinusCircle size={18} style={{ color: '#E74C3C' }} /> Log Internal Usage
        </h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 20px' }}>
          
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input type="date" className="input-field" required
              value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">Outlet *</label>
            <select className="input-field" required value={formData.outlet_id} onChange={e => setFormData({...formData, outlet_id: e.target.value})}>
              <option value="">Select outlet...</option>
              {branchOutlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Item Name *</label>
            <select className="input-field" required value={formData.item_id} onChange={e => setFormData({...formData, item_id: e.target.value})}>
              <option value="">Search items...</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name} {i.item_code ? `(${i.item_code})` : ''}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Item Code</label>
            <input type="text" className="input-field" value={selectedItem.item_code || ''} readOnly disabled style={{ background: '#f9f9f9' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Unit</label>
            <input type="text" className="input-field" value={selectedItem.unit || ''} readOnly disabled style={{ background: '#f9f9f9' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Current Stock Available</label>
            <div style={{ 
              padding: '10px 14px', borderRadius: '8px', 
              background: 'rgba(52, 152, 219, 0.05)', color: '#2980B9', 
              fontWeight: 700, border: '1px solid rgba(52, 152, 219, 0.2)',
              fontSize: '14px'
            }}>
              {currentStock}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Quantity Used *</label>
            <input type="number" className="input-field" required min="0.01" step="0.01" style={{ background: '#FFF9F9', borderColor: '#F5B7B1' }}
              value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})} 
              placeholder="0" />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Notes / Reason</label>
            <input type="text" className="input-field" placeholder="Recipe usage, spills, etc..."
              value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Logged By</label>
            <input type="text" className="input-field" placeholder="Name"
              value={formData.logged_by} onChange={e => setFormData({...formData, logged_by: e.target.value})} />
          </div>

          <div style={{ gridColumn: 'span 4', display: 'flex', justifyContent: 'flex-start', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
             <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ background: 'var(--color-text-dark)' }}>
              {isSubmitting ? 'Logging...' : 'Log Usage'}
            </button>
          </div>
          
        </form>
      </div>
      )}  {/* end isReadOnly */}

      {/* Log Table matching Screenshot style */}
      <h3 style={{ fontFamily: 'Lato', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-dark)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
         <MinusCircle size={18} style={{ color: '#E74C3C' }} /> Log Usage {exportOutletId && `- ${outlets.find(o => o.id === exportOutletId)?.name}`}
      </h3>
      
      {(() => {
        const filteredUsageLog = exportOutletId 
          ? usageLog.filter(log => log.outlet_id === exportOutletId)
          : usageLog;

        return (
          <>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '-16px' }}>Showing {filteredUsageLog.length} usage entries</p>
            
            <div className="table-container" style={{ marginTop: '0' }}>
              {filteredUsageLog.length === 0 ? (
          <div className="empty-state" style={{ padding: '64px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
            <MinusCircle size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>No usage logged yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Outlet</th>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Unit</th>
                  <th>Qty Used</th>
                  <th>Logged By</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsageLog.map((log) => {
                  const itemObj = items.find(i => i.id === log.item_id) || {};
                  const outletObj = outlets.find(o => o.id === log.outlet_id) || {};

                  return (
                    <tr key={log.id}>
                      <td>{new Date(log.date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600 }}>{outletObj.name || '-'}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{itemObj.item_code || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{itemObj.name || '-'}</td>
                      <td>{itemObj.unit || '-'}</td>
                      <td style={{ color: '#E74C3C', fontWeight: 700 }}>{log.qty}</td>
                      <td>{log.logged_by || '-'}</td>
                      <td>{log.notes || '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-icon" onClick={() => handleDelete(log.id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
            </div>
          </>
        );
      })()}

    </div>
  );
};

export default UsageLog;
