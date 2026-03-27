import React, { useState } from 'react';
import { useStock } from '../context/StockContext';
import { addIssueLog, deleteIssueLog } from '../api/logsApi';
import { exportToCSV } from '../utils/csvExport';
import { toast } from 'sonner';
import { ArrowUpRightFromSquare, Trash2, Download, Lock } from 'lucide-react';
import PeriodSelector from '../components/PeriodSelector';

const IssueLog = () => {
  const { items, outlets, issueLog, addIssueToState, removeIssueFromState, getWeekNumber, getMainStoreBalance, activePeriodId, activePeriod, isReadOnly } = useStock();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    item_id: '',
    outlet_id: '',
    qty: '',
    notes: ''
  });

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedItem = items.find(i => i.id === formData.item_id) || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.item_id || !formData.outlet_id || !formData.qty || Number(formData.qty) <= 0) {
      toast.error("Please fill all required fields and provide a valid quantity.");
      return;
    }

    // Block if quantity exceeds available Main Store stock
    const currentMainStoreStock = getMainStoreBalance(formData.item_id);
    if (Number(formData.qty) > currentMainStoreStock) {
      toast.error(
        `❌ Cannot issue ${formData.qty} ${selectedItem.unit || 'units'} of "${selectedItem.name}". Main Store only has ${currentMainStoreStock} ${selectedItem.unit || 'units'} available.`,
        { duration: 5000 }
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedDate = new Date(formData.date);
      const week_no = getWeekNumber(formData.date);
      const month = selectedDate.toLocaleString('default', { month: 'short' }).toUpperCase();
      const year = selectedDate.getFullYear();

      const payload = { ...formData, week_no, month, year, period_id: activePeriodId };

      const newEntry = await addIssueLog(payload);
      addIssueToState(newEntry);
      toast.success("Issue entry added successfully");
      setFormData({ ...formData, item_id: '', outlet_id: '', qty: '', notes: '' });
    } catch (err) {
      toast.error("Failed to add Issue entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this Issue entry?")) {
      try {
        await deleteIssueLog(id);
        removeIssueFromState(id);
        toast.success("Entry deleted");
      } catch (err) {
        toast.error("Failed to delete entry");
      }
    }
  };

  const handleExport = () => {
    let dataToExport = issueLog;
    if (startDate) {
      dataToExport = dataToExport.filter(log => new Date(log.date) >= new Date(startDate));
    }
    if (endDate) {
      dataToExport = dataToExport.filter(log => new Date(log.date) <= new Date(endDate));
    }
    
    if (dataToExport.length === 0) {
      toast.error('No issue logs found in the selected date range.');
      return;
    }

    const columns = [
      { header: 'Date', key: row => new Date(row.date).toLocaleDateString() },
      { header: 'Week No.', key: 'week_no' },
      { header: 'Month', key: 'month' },
      { header: 'Year', key: 'year' },
      { header: 'Item Code', key: row => (items.find(i => i.id === row.item_id) || {}).item_code || '-' },
      { header: 'Item Name', key: row => (items.find(i => i.id === row.item_id) || {}).name || '-' },
      { header: 'Outlet', key: row => (outlets.find(o => o.id === row.outlet_id) || {}).name || '-' },
      { header: 'Qty Issued', key: 'qty' },
      { header: 'Notes', key: 'notes' }
    ];
    
    const startStr = startDate ? `_from_${startDate}` : '';
    const endStr = endDate ? `_to_${endDate}` : '';
    exportToCSV(`Main_Store_Issue_Logs${startStr}${endStr}.csv`, columns, dataToExport);
  };

  return (
    <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Intro Subheading */}
      <div style={{ padding: '0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: 'var(--color-primary)', marginBottom: '8px' }}>
            Issue Log (Transfers)
          </h3>
          <p className="subheading">Enter every stock issue from Main Store to any outlet. This automatically updates both source and destination balances.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <PeriodSelector />
          <div style={{ 
            display: 'flex', gap: '16px', alignItems: 'flex-end', 
            background: 'rgba(255, 255, 255, 0.4)', padding: '12px 16px', 
            borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-text-dark)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Filter From
              </label>
              <input type="date" className="input-field" style={{ padding: '0 12px', height: '38px', background: 'var(--color-white)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Lato' }}
                value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-text-dark)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Filter To
              </label>
              <input type="date" className="input-field" style={{ padding: '0 12px', height: '38px', background: 'var(--color-white)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Lato' }}
                value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <button className="btn-secondary" onClick={handleExport} style={{ height: '38px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, boxShadow: '0 4px 12px rgba(245, 166, 35, 0.3)', border: 'none' }}>
              <Download size={16} /> Export Logs
            </button>
          </div>
        </div>
      </div>

      {isReadOnly ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'rgba(192, 57, 43, 0.06)', border: '1px solid rgba(192, 57, 43, 0.2)', borderRadius: '12px' }}>
          <Lock size={18} style={{ color: '#C0392B' }} />
          <span style={{ fontWeight: 700, color: '#C0392B' }}>Period "{activePeriod?.label}" is closed. Switch to the current open period to add new entries.</span>
        </div>
      ) : (
      <div className="card">
        <h3 style={{ fontFamily: 'Lato', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowUpRightFromSquare size={18} /> Add Issue Entry
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="input-field" required
              value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Search Item</label>
            <select className="input-field" required value={formData.item_id} onChange={e => setFormData({...formData, item_id: e.target.value})}>
              <option value="">Select an Item...</option>
              {items.map(i => (
                <option key={i.id} value={i.id}>{i.name} {i.item_code ? `(${i.item_code})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Unit</label>
            <input type="text" className="input-field" value={selectedItem.unit || ''} readOnly disabled style={{ background: '#f5f5f5' }} />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Select Outlet</label>
            <select className="input-field" required value={formData.outlet_id} onChange={e => setFormData({...formData, outlet_id: e.target.value})}>
              <option value="">Select Destination Outlet...</option>
              {outlets.filter(o => !o.is_main_store).map(o => (
                <option key={o.id} value={o.id}>{o.name} {o.location ? `(${o.location})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Qty Issued</label>
            <input type="number" className="input-field" required min="0.01" step="0.01" placeholder="Enter qty"
              value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <input type="text" className="input-field" placeholder="Optional"
              value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>

          <div style={{ gridColumn: 'span 4', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Issue Entry'}
            </button>
          </div>
        </form>
      </div>
      )}  {/* end isReadOnly */}

      {/* Log Table */}
      <div className="table-container">
        {issueLog.length === 0 ? (
          <div className="empty-state">
            <ArrowUpRightFromSquare size={48} style={{ opacity: 0.3 }} />
            <p>No issues logged yet. Transfer your first stock above.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Wk</th>
                  <th>Mth</th>
                  <th>Yr</th>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Unit</th>
                  <th>Outlet</th>
                  <th>Qty</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {issueLog.map((log) => {
                  const itemObj = items.find(i => i.id === log.item_id) || {};
                  const outletObj = outlets.find(o => o.id === log.outlet_id) || {};

                  return (
                    <tr key={log.id}>
                      <td>{new Date(log.date).toLocaleDateString()}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>W{log.week_no}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{log.month}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{log.year}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{itemObj.item_code || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{itemObj.name || 'Unknown Item'}</td>
                      <td>{itemObj.unit || '-'}</td>
                      <td style={{ color: '#1E8449', fontWeight: 600 }}>{outletObj.name || 'Unknown Outlet'}</td>
                      <td className="qty-value">-{log.qty}</td>
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

export default IssueLog;
