import React, { useState, useMemo } from 'react';
import { useStock } from '../context/StockContext';
import { exportToCSV } from '../utils/csvExport';
import { PieChart, Download } from 'lucide-react';

const CATEGORIES = [
  'BAKERY SUPPLIES', 'PANTRY & CONDIMENTS', 'BEVERAGES & DAIRY',
  'MEAT & SEAFOOD', 'PACKAGING', 'SPICES & HERBS', 'BAKERY & BREADS',
  'CLEANING & HYGIENE', 'SNACKS & FAST FOOD', 'OTHER', 'Uncategorized'
];

const SummaryReport = () => {
  const { items, outlets, getMainStoreBalance, getOutletBalance, loading } = useStock();
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);

  const branchOutlets = useMemo(() => outlets.filter(o => !o.is_main_store), [outlets]);

  const matrixData = useMemo(() => {
    const categoryItems = items.filter(i => (i.category || 'Uncategorized') === selectedCategory);
    
    return categoryItems.map(item => {
      const mainBalance = getMainStoreBalance(item.id);
      const outletBalances = branchOutlets.map(outlet => getOutletBalance(item.id, outlet.id));
      
      const totalSystemStock = mainBalance + outletBalances.reduce((sum, val) => sum + val, 0);

      return {
        ...item,
        mainBalance,
        outletBalances,
        totalSystemStock
      };
    });
  }, [items, selectedCategory, branchOutlets, getMainStoreBalance, getOutletBalance]);

  const handleExport = () => {
    const columns = [
      { header: 'Item Code', key: 'item_code' },
      { header: 'Item Name', key: 'name' },
      { header: 'Unit', key: 'unit' },
      { header: 'Main Store', key: 'mainBalance' },
      ...branchOutlets.map((o, i) => ({ header: o.name, key: row => row.outletBalances[i] })),
      { header: 'System Total', key: 'totalSystemStock' }
    ];
    exportToCSV(`System_Stock_Summary.csv`, columns, matrixData);
  };

  if (loading) return <div className="page-body"><div className="skeleton" style={{ height: '400px', borderRadius: '12px' }} /></div>;

  return (
    <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: 'var(--color-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PieChart size={24} /> Live System Stock Summary
          </h3>
          <p className="subheading">Bird's-eye view of current inventory levels across the Main Store and all {branchOutlets.length} outlets.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <select className="input-field" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn-secondary" onClick={handleExport} style={{ padding: '0 16px' }}>
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="card table-container" style={{ padding: 0 }}>
        {matrixData.length === 0 ? (
          <div className="empty-state">
            <PieChart size={48} style={{ opacity: 0.3 }} />
            <p>No items found for this category.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 240px)' }}>
            <table className="data-table" style={{ border: 'none', whiteSpace: 'nowrap' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th style={{ position: 'sticky', left: 0, background: 'var(--color-sidebar)', zIndex: 11 }}>Item Code</th>
                  <th style={{ position: 'sticky', left: '80px', background: 'var(--color-sidebar)', zIndex: 11 }}>Item Name</th>
                  <th style={{ textAlign: 'center', background: 'rgba(52, 152, 219, 0.1)', color: '#2980B9' }}>Main Store</th>
                  {branchOutlets.map(outlet => (
                    <th key={outlet.id} style={{ textAlign: 'center', fontSize: '11px', padding: '12px 6px' }}>
                      {outlet.name}
                    </th>
                  ))}
                  <th style={{ textAlign: 'right', background: 'rgba(245, 166, 35, 0.1)', color: 'var(--color-primary)' }}>System Total</th>
                </tr>
              </thead>
              <tbody>
                {matrixData.map(item => (
                  <tr key={item.id} style={{ 
                    background: item.totalSystemStock <= (item.min_stock || 5) ? 'rgba(192, 57, 43, 0.03)' : 'transparent' 
                  }}>
                    <td style={{ position: 'sticky', left: 0, background: 'var(--color-white)', color: 'var(--color-text-muted)', borderRight: '1px solid var(--color-border)', zIndex: 1 }}>{item.item_code || '-'}</td>
                    <td style={{ position: 'sticky', left: '80px', background: 'var(--color-white)', fontWeight: 600, borderRight: '2px solid rgba(0,0,0,0.05)', zIndex: 1 }}>{item.name} <span style={{fontSize: '11px', color: '#999', fontWeight: 400}}>({item.unit})</span></td>
                    
                    <td style={{ textAlign: 'center', fontWeight: 800, color: item.mainBalance <= 0 ? '#C0392B' : '#2980B9', background: 'rgba(52, 152, 219, 0.02)' }}>
                      {item.mainBalance}
                    </td>

                    {item.outletBalances.map((bal, idx) => (
                      <td key={idx} style={{ textAlign: 'center', fontWeight: bal > 0 ? 600 : 400, color: bal > 0 ? 'var(--color-text-dark)' : 'var(--color-border)' }}>
                        {bal || '-'}
                      </td>
                    ))}
                    
                    <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '15px', color: item.totalSystemStock <= 0 ? 'var(--color-danger)' : 'var(--color-text-dark)', background: 'rgba(245, 166, 35, 0.05)' }}>
                      {item.totalSystemStock}
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

export default SummaryReport;
