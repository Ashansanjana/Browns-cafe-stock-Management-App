import React, { useState } from 'react';
import { useStock } from '../context/StockContext';
import { addItem, updateItem, deleteItem } from '../api/itemsApi';
import { toast } from 'sonner';
import { Database, Edit, Trash2, Plus, X } from 'lucide-react';

const CATEGORIES = [
  'Dry Groceries', 'Dairy', 'Meat & Poultry',
  'Beverages', 'Bakery Raw', 'Confectionery & Sweets',
  'Packaging & Disposables', 'Cleaning & Hygiene'
];

const UNITS = ['KG', 'GRM', 'LTR', 'ML', 'NOS', 'PKT', 'BOT', 'TIN', 'CAN', 'TUB', 'SLICE', 'ROLL', 'SASET', 'SHEETS', 'SLAB'];

const ItemMaster = () => {
  const { items, addItemToState, updateItemInState, removeItemFromState, loading } = useStock();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    item_code: '',
    category: CATEGORIES[0],
    unit: UNITS[0],
    min_stock: 5
  });

  const resetForm = () => {
    setFormData({ name: '', item_code: '', category: CATEGORIES[0], unit: UNITS[0], min_stock: 5 });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditClick = (item) => {
    setFormData({
      name: item.name || '',
      item_code: item.item_code || '',
      category: item.category || CATEGORIES[0],
      unit: item.unit || UNITS[0],
      min_stock: item.min_stock || 5
    });
    setEditingId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.unit) {
      toast.error("Name and Unit are strictly required.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (editingId) {
        const updated = await updateItem(editingId, formData);
        updateItemInState(updated);
        toast.success("Item updated successfully");
      } else {
        const created = await addItem(formData);
        addItemToState(created);
        toast.success("Item added successfully");
      }
      resetForm();
    } catch (err) {
      const msg = err.response?.data?.error || "Operation failed.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? WARNING: If this item has tied stock logs, the deletion will fail or cascade-delete dependent logs.`)) {
      try {
        await deleteItem(id);
        removeItemFromState(id);
        toast.success(`${name} deleted permanently.`);
      } catch (err) {
        toast.error(err.response?.data?.error || "Failed to delete item.");
      }
    }
  };

  if (loading) return <div className="page-body"><div className="skeleton" style={{ height: '400px', borderRadius: '12px' }} /></div>;

  return (
    <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header & Controls */}
      <div style={{ padding: '0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: 'var(--color-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={24} /> Item Master List
          </h3>
          <p className="subheading">Manage the core ingredients and products circulating across the business.</p>
        </div>
        
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Add New Item
          </button>
        )}
      </div>

      {/* Add / Edit Form Card */}
      {showForm && (
        <div className="card" style={{ borderTop: '4px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontFamily: 'Lato', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {editingId ? <Edit size={18} /> : <Plus size={18} />}
              {editingId ? 'Edit Item Mapping' : 'Register New Item'}
            </h3>
            <button className="btn-icon" onClick={resetForm}><X size={20} /></button>
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Item Name (Required)</label>
              <input type="text" className="input-field" required placeholder="e.g. Flour Pack 5kg"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Item Code</label>
              <input type="text" className="input-field" placeholder="e.g. RM1001"
                value={formData.item_code} onChange={e => setFormData({...formData, item_code: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Unit of Measure</label>
              <select className="input-field" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Min Stock Level Alert</label>
              <input type="number" className="input-field" required min="0" step="1"
                value={formData.min_stock} onChange={e => setFormData({...formData, min_stock: e.target.value})} />
            </div>

            <div style={{ gridColumn: 'span 4', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Item' : 'Save Item'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Main Reference Table */}
      <div className="card table-container" style={{ padding: 0 }}>
        {items.length === 0 ? (
          <div className="empty-state">
            <Database size={48} style={{ opacity: 0.3 }} />
            <p>No items found in the master list.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 240px)' }}>
            <table className="data-table" style={{ border: 'none' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th style={{ textAlign: 'center' }}>Min Stock</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--color-text-muted)' }}>{item.item_code || '-'}</td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td>{item.category || '-'}</td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{item.unit}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--color-danger)' }}>{item.min_stock || 5}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-icon" onClick={() => handleEditClick(item)} style={{ marginRight: '8px' }}>
                        <Edit size={16} />
                      </button>
                      <button className="btn-icon" onClick={() => handleDelete(item.id, item.name)} style={{ color: 'var(--color-danger)' }}>
                        <Trash2 size={16} />
                      </button>
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

export default ItemMaster;
