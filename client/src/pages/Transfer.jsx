import { useState, useEffect, useCallback } from 'react';
import { getItems } from '../api/itemsApi';
import { getOutlets } from '../api/outletsApi';
import { transferStock } from '../api/stockApi';
import { getDashboard } from '../api/dashboardApi';
import { toast } from 'sonner';
import { ArrowRightLeft } from 'lucide-react';

const Transfer = () => {
  const [items, setItems] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [itemId, setItemId] = useState('');
  const [outletId, setOutletId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, outletsRes, dashRes] = await Promise.all([
        getItems(),
        getOutlets(),
        getDashboard()
      ]);
      setItems(itemsRes);
      setOutlets(outletsRes.filter(o => !o.is_main_store));
      setTransfers(dashRes.recent_transfers || []);
    } catch {
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemId || !outletId || !quantity || Number(quantity) <= 0) {
      toast.error('Please fill all required fields. Quantity must be > 0.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await transferStock({
        item_id: itemId,
        to_outlet_id: outletId,
        quantity: Number(quantity),
        note: note || undefined
      });
      toast.success(res.message);
      setItemId(''); setOutletId(''); setQuantity(''); setNote('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Transfer failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 className="page-title">Transfer Stock</h1>
        <p className="subheading" style={{ marginTop: '6px' }}>Main Store → Outlet only</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 2fr', gap: '32px', alignItems: 'start' }}>
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Select Item *</label>
              <select className="input-field" value={itemId} onChange={e => setItemId(e.target.value)} id="transfer-item" disabled={loading}>
                <option value="">Choose ingredient...</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Select Outlet *</label>
              <select className="input-field" value={outletId} onChange={e => setOutletId(e.target.value)} id="transfer-outlet" disabled={loading}>
                <option value="">Choose outlet...</option>
                {outlets.map(o => <option key={o.id} value={o.id}>{o.name} — {o.location}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Quantity *</label>
              <input
                type="number" min="0.01" step="0.01" className="input-field"
                placeholder="e.g. 10" value={quantity} onChange={e => setQuantity(e.target.value)}
                id="transfer-qty"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Note (optional)</label>
              <input className="input-field" placeholder="e.g. Weekly distribution" value={note} onChange={e => setNote(e.target.value)} id="transfer-note" />
            </div>

            <button type="submit" className="btn-primary" disabled={submitting || loading} style={{ marginTop: '8px' }}>
              <ArrowRightLeft size={18} />
              {submitting ? 'Transferring...' : 'Transfer Stock'}
            </button>
          </form>
        </div>

        {/* Recent Transfers */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'Playfair Display, serif', fontWeight: 700 }}>
              <ArrowRightLeft size={22} style={{ color: 'var(--color-primary)' }} /> Recent Transfers
            </h2>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '24px' }}>
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '48px' }} />)}
            </div>
          ) : transfers.length === 0 ? (
            <div className="empty-state"><ArrowRightLeft size={48} style={{ color: 'var(--color-primary)' }}/><p>No transfers yet.</p></div>
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr><th>Item</th><th>Qty</th><th>To Outlet</th><th>Note</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {transfers.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.item_name}</td>
                      <td><span className="qty-value">{t.quantity ?? 0}</span> <span className="badge badge-unit">{t.unit}</span></td>
                      <td style={{ color: 'var(--color-text-dark)', fontWeight: 500 }}>{t.to_outlet_name}</td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{t.note || '—'}</td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{new Date(t.transferred_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transfer;
