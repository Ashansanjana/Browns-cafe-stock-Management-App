import { useState, useEffect, useCallback } from 'react';
import { getItems, addItem, updateItem, deleteItem } from '../api/itemsApi';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ListChecks } from 'lucide-react';

const UNITS = ['KG', 'GRM', 'LTR', 'ML', 'NOS', 'PKT', 'BOT', 'TIN', 'CAN', 'TUB', 'SLICE', 'ROLL', 'SASET', 'SHEETS', 'SLAB'];

const ItemModal = ({ initial, onClose, onSuccess }) => {
  const [name, setName] = useState(initial?.name || '');
  const [unit, setUnit] = useState(initial?.unit || 'kg');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Item name is required.'); return; }
    setLoading(true);
    try {
      if (initial) {
        await updateItem(initial.id, { name: name.trim(), unit });
        toast.success('Item updated.');
      } else {
        await addItem({ name: name.trim(), unit });
        toast.success(`✅ Item "${name}" added.`);
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: '24px', fontFamily: 'Playfair Display, serif', fontSize: '24px' }}>{initial ? 'Edit Item' : 'Add New Item'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Item Name</label>
            <input className="input-field" placeholder="e.g. Sugar" value={name} onChange={e => setName(e.target.value)} id="item-name" />
          </div>
          <div className="form-group">
            <label className="form-label">Unit</label>
            <select className="input-field" value={unit} onChange={e => setUnit(e.target.value)} id="item-unit">
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Saving...' : (initial ? 'Update Item' : 'Add Item')}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Items = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await getItems()); }
    catch { toast.error('Failed to load items.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    try {
      await deleteItem(confirmDel.id);
      toast.success('Item deleted.');
      setConfirmDel(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete item.');
      setConfirmDel(null);
    }
  };

  return (
    <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {(showModal || editItem) && (
        <ItemModal
          initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSuccess={load}
        />
      )}
      {confirmDel && (
        <div className="modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="modal-box" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px', fontFamily: 'Playfair Display, serif', fontSize: '24px' }}>Delete Item?</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
              Delete <strong style={{ color: 'var(--color-text-dark)' }}>{confirmDel.name}</strong>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-danger" style={{ flex: 1, textAlign: 'center' }} onClick={handleDelete}>Delete Item</button>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirmDel(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Ingredient Items</h1>
          <p className="subheading" style={{ marginTop: '6px' }}>Manage ingredient master list</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} id="add-item-btn">
          <Plus size={18} /> Add Item
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: '48px' }} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state"><ListChecks size={48} style={{ color: 'var(--color-primary)' }} /><h3 style={{ fontSize: '24px' }}>No items yet</h3><p>Add your first ingredient item.</p></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Name</th><th>Unit</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--color-text-muted)', width: '48px' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td>
                      <span className="badge badge-unit">{item.unit}</span>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-icon" onClick={() => setEditItem(item)} title="Edit"><Pencil size={16} /></button>
                        <button className="btn-icon" onClick={() => setConfirmDel(item)} title="Delete" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Items;
