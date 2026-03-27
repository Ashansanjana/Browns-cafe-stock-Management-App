import React, { useState } from 'react';
import { useStock } from '../context/StockContext';
import { addGrnLog, deleteGrnLog } from '../api/logsApi';
import { toast } from 'sonner';
import { PackageOpen, Trash2, Lock } from 'lucide-react';
import PeriodSelector from '../components/PeriodSelector';

const GRNLog = () => {
  const { items, grnLog, addGrnToState, removeGrnFromState, activePeriodId, activePeriod, isReadOnly } = useStock();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    item_id: '',
    qty: '',
    supplier: '',
    ref_invoice: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive selected item state for read-only fields
  const selectedItem = items.find(i => i.id === formData.item_id) || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.item_id || !formData.qty || Number(formData.qty) <= 0) {
      toast.error("Please provide a valid item and a quantity greater than zero.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newEntry = await addGrnLog({ ...formData, period_id: activePeriodId });
      addGrnToState(newEntry);
      toast.success("GRN entry added successfully");
      setFormData({ ...formData, item_id: '', qty: '', supplier: '', ref_invoice: '', notes: '' });
    } catch (err) {
      toast.error("Failed to add GRN entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this GRN entry?")) {
      try {
        await deleteGrnLog(id);
        removeGrnFromState(id);
        toast.success("Entry deleted");
      } catch (err) {
        toast.error("Failed to delete entry");
      }
    }
  };

  const totalQty = grnLog.reduce((sum, g) => sum + Number(g.qty || 0), 0);

  return (
    <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div style={{ padding: '0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: 'var(--color-primary)', marginBottom: '8px' }}>
            Goods Received Note (GRN)
          </h3>
          <p className="subheading">Record every delivery received into the Main Store here. All entries automatically update live stock balances.</p>
        </div>
        <PeriodSelector />
      </div>

      {/* Add Form Card */}
      {isReadOnly ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'rgba(192, 57, 43, 0.06)', border: '1px solid rgba(192, 57, 43, 0.2)', borderRadius: '12px' }}>
          <Lock size={18} style={{ color: '#C0392B' }} />
          <span style={{ fontWeight: 700, color: '#C0392B' }}>Period "{activePeriod?.label}" is closed. Switch to the current open period to add new entries.</span>
        </div>
      ) : (
      <div className="card">
        <h3 style={{ fontFamily: 'Lato', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PackageOpen size={18} /> Add GRN Entry
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

          <div className="form-group">
            <label className="form-label">Qty Received</label>
            <input type="number" className="input-field" required min="0.01" step="0.01" placeholder="Enter qty"
              value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">Supplier</label>
            <input type="text" className="input-field" placeholder="Optional"
              value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">Ref / Invoice No.</label>
            <input type="text" className="input-field" placeholder="Optional"
              value={formData.ref_invoice} onChange={e => setFormData({...formData, ref_invoice: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <input type="text" className="input-field" placeholder="Optional"
              value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>

          <div style={{ gridColumn: 'span 4', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save GRN Entry'}
            </button>
          </div>
        </form>
      </div>
      )}  {/* end isReadOnly ? ... */}

      {/* Log Table */}
      <div className="table-container">
        {grnLog.length === 0 ? (
          <div className="empty-state">
            <PackageOpen size={48} style={{ opacity: 0.3 }} />
            <p>No GRN entries yet. Add your first delivery above.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Unit</th>
                  <th>Qty</th>
                  <th>Supplier</th>
                  <th>Ref/Invoice</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {grnLog.map((log) => {
                  const itemObj = items.find(i => i.id === log.item_id) || {};
                  return (
                    <tr key={log.id}>
                      <td>{new Date(log.date).toLocaleDateString()}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{itemObj.item_code || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{itemObj.name || 'Unknown Item'}</td>
                      <td>{itemObj.unit || '-'}</td>
                      <td className="qty-value">+{log.qty}</td>
                      <td>{log.supplier || '-'}</td>
                      <td>{log.ref_invoice || '-'}</td>
                      <td>{log.notes || '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-icon" onClick={() => handleDelete(log.id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {/* Footer Totals */}
                <tr style={{ background: 'rgba(245, 166, 35, 0.05)', fontWeight: 700 }}>
                  <td colSpan="4" style={{ textAlign: 'right' }}>Total Entries: {grnLog.length} | Grand Total Qty:</td>
                  <td className="qty-value">{totalQty}</td>
                  <td colSpan="4"></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default GRNLog;
