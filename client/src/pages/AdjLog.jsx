import React, { useState, useEffect } from 'react';
import { useStock } from '../context/StockContext';
import { addAdjLog, deleteAdjLog } from '../api/logsApi';
import { toast } from 'sonner';
import { FileEdit, Trash2, Lock } from 'lucide-react';
import PeriodSelector from '../components/PeriodSelector';

const AdjLog = () => {
  const { items, outlets, adjLog, addAdjToState, removeAdjFromState, getSystemCountAtDate, activePeriodId, activePeriod, isReadOnly } = useStock();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    outlet_id: '',
    item_id: '',
    system_count: 0,
    physical_count: '',
    adjustment: 0,
    counted_by: '',
    verified_by: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedItem = items.find(i => i.id === formData.item_id) || {};

  // Recalculate system_count and adjustment
  useEffect(() => {
    if (formData.item_id && formData.outlet_id && formData.date) {
      const sysCount = getSystemCountAtDate(formData.item_id, formData.outlet_id, formData.date);
      const physCount = formData.physical_count !== '' ? Number(formData.physical_count) : sysCount;
      const adj = physCount - sysCount;
      
      setFormData(prev => ({
        ...prev,
        system_count: sysCount,
        adjustment: adj
      }));
    }
  }, [formData.date, formData.outlet_id, formData.item_id, formData.physical_count, getSystemCountAtDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.item_id || !formData.outlet_id || formData.physical_count === '') {
      toast.error("Please fill all required fields including the physical count.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        physical_count: Number(formData.physical_count),
        period_id: activePeriodId
      };

      const newEntry = await addAdjLog(payload);
      addAdjToState(newEntry);
      toast.success("Adjustment entry added successfully");
      setFormData({ ...formData, item_id: '', physical_count: '', adjustment: 0, notes: '' });
    } catch (err) {
      toast.error("Failed to add Adjustment entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this Adjustment entry? This will revert the stock balance to the computed log amount.")) {
      try {
        await deleteAdjLog(id);
        removeAdjFromState(id);
        toast.success("Entry deleted");
      } catch (err) {
        toast.error("Failed to delete entry");
      }
    }
  };

  return (
    <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div style={{ padding: '0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: 'var(--color-primary)', marginBottom: '8px' }}>
            Stock Adjustment Log
          </h3>
          <p className="subheading">Use for physical count corrections only. Overwrites computed balances dynamically.</p>
        </div>
        <PeriodSelector />
      </div>

      {isReadOnly ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'rgba(192, 57, 43, 0.06)', border: '1px solid rgba(192, 57, 43, 0.2)', borderRadius: '12px' }}>
          <Lock size={18} style={{ color: '#C0392B' }} />
          <span style={{ fontWeight: 700, color: '#C0392B' }}>Period "{activePeriod?.label}" is closed. Switch to the current open period to add new entries.</span>
        </div>
      ) : (
      <div className="card">
        <h3 style={{ fontFamily: 'Lato', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileEdit size={18} /> Add Adjustment Entry
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }}>
          
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="input-field" required
              value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">Location (Outlet)</label>
            <select className="input-field" required value={formData.outlet_id} onChange={e => setFormData({...formData, outlet_id: e.target.value})}>
              <option value="">Select Location...</option>
              {outlets.map(o => <option key={o.id} value={o.id}>{o.name} {o.is_main_store ? '(Main Store)' : ''}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Search Item</label>
            <select className="input-field" required value={formData.item_id} onChange={e => setFormData({...formData, item_id: e.target.value})}>
              <option value="">Select an Item...</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name} {i.item_code ? `(${i.item_code})` : ''}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Unit</label>
            <input type="text" className="input-field" value={selectedItem.unit || ''} readOnly disabled style={{ background: '#f5f5f5' }} />
          </div>

          <div className="form-group">
            <label className="form-label">System Count</label>
            <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(52, 152, 219, 0.1)', color: '#2980B9', fontWeight: 800, border: '1.5px solid rgba(52, 152, 219, 0.4)' }}>
              {formData.item_id && formData.outlet_id ? formData.system_count : '-'}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Physical Count</label>
            <input type="number" className="input-field" required min="0" step="0.01" placeholder="Actual"
              value={formData.physical_count} onChange={e => setFormData({...formData, physical_count: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">Adjustment</label>
            <div style={{ 
              padding: '12px 16px', borderRadius: '10px', fontWeight: 800,
              background: formData.adjustment > 0 ? 'rgba(39, 174, 96, 0.1)' : formData.adjustment < 0 ? 'rgba(192, 57, 43, 0.1)' : '#f5f5f5',
              color: formData.adjustment > 0 ? '#27AE60' : formData.adjustment < 0 ? '#C0392B' : '#7f8c8d'
            }}>
              {formData.adjustment > 0 ? '+' : ''}{formData.adjustment}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Counted By</label>
            <input type="text" className="input-field" placeholder="Optional name"
              value={formData.counted_by} onChange={e => setFormData({...formData, counted_by: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">Verified By</label>
            <input type="text" className="input-field" placeholder="Optional name"
              value={formData.verified_by} onChange={e => setFormData({...formData, verified_by: e.target.value})} />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 3' }}>
            <label className="form-label">Notes / Reason</label>
            <input type="text" className="input-field" placeholder="Damage, expiry, miscount..."
              value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: '16px' }}>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Adjustment'}
            </button>
          </div>
        </form>
      </div>
      )}  {/* end isReadOnly */}

      {/* Log Table */}
      <div className="table-container">
        {adjLog.length === 0 ? (
          <div className="empty-state">
            <FileEdit size={48} style={{ opacity: 0.3 }} />
            <p>No adjustments logged. Physical corrections will appear here.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>System</th>
                  <th>Physical</th>
                  <th>Adjustment</th>
                  <th>Counted By</th>
                  <th>Verified By</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adjLog.map((log) => {
                  const itemObj = items.find(i => i.id === log.item_id) || {};
                  const outletObj = outlets.find(o => o.id === log.outlet_id) || {};

                  return (
                    <tr key={log.id}>
                      <td>{new Date(log.date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 700 }}>{outletObj.name || 'Unknown'}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{itemObj.item_code || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{itemObj.name || 'Unknown'}</td>
                      <td style={{ color: '#2980B9', fontWeight: 700 }}>{log.system_count}</td>
                      <td style={{ color: '#F5A623', fontWeight: 700 }}>{log.physical_count}</td>
                      <td style={{ 
                        fontWeight: 800, 
                        color: Number(log.adjustment) > 0 ? '#27AE60' : Number(log.adjustment) < 0 ? '#C0392B' : '#7f8c8d' 
                      }}>
                        {Number(log.adjustment) > 0 ? '+' : ''}{log.adjustment}
                      </td>
                      <td>{log.counted_by || '-'}</td>
                      <td>{log.verified_by || '-'}</td>
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

    </div>
  );
};

export default AdjLog;
