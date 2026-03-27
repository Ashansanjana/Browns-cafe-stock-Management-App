import React, { useState, useMemo } from 'react';
import { useStock } from '../context/StockContext';
import { exportToCSV } from '../utils/csvExport';
import { CalendarDays, Download } from 'lucide-react';

const CATEGORIES = [
  'BAKERY SUPPLIES', 'PANTRY & CONDIMENTS', 'BEVERAGES & DAIRY',
  'MEAT & SEAFOOD', 'PACKAGING', 'SPICES & HERBS', 'BAKERY & BREADS',
  'CLEANING & HYGIENE', 'SNACKS & FAST FOOD', 'OTHER', 'Uncategorized'
];

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const WeeklyTracker = () => {
  const { items, issueLog, loading } = useStock();
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString('default', { month: 'short' }).toUpperCase();
  
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[1]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const matrixData = useMemo(() => {
    const categoryItems = items.filter(i => (i.category || 'Uncategorized') === selectedCategory);
    
    const monthlyLogs = issueLog.filter(log => 
      log.month === selectedMonth && Number(log.year) === Number(selectedYear)
    );

    return categoryItems.map(item => {
      const itemLogs = monthlyLogs.filter(l => l.item_id === item.id);
      
      let w1=0, w2=0, w3=0, w4=0, w5=0;
      itemLogs.forEach(log => {
        const d = new Date(log.date);
        const wk = Math.ceil(d.getDate() / 7); 

        if (wk === 1) w1 += Number(log.qty);
        else if (wk === 2) w2 += Number(log.qty);
        else if (wk === 3) w3 += Number(log.qty);
        else if (wk === 4) w4 += Number(log.qty);
        else w5 += Number(log.qty);
      });

      return {
        ...item, w1, w2, w3, w4, w5,
        total: w1 + w2 + w3 + w4 + w5
      };
    });
  }, [items, issueLog, selectedCategory, selectedMonth, selectedYear]);

  const handleExport = () => {
    const columns = [
      { header: 'Item Code', key: 'item_code' },
      { header: 'Item Name', key: 'name' },
      { header: 'Unit', key: 'unit' },
      { header: 'Week 1', key: 'w1' },
      { header: 'Week 2', key: 'w2' },
      { header: 'Week 3', key: 'w3' },
      { header: 'Week 4', key: 'w4' },
      { header: 'Week 5', key: 'w5' },
      { header: 'Month Total', key: 'total' }
    ];
    exportToCSV(`Weekly_Tracker_${selectedCategory}_${selectedMonth}_${selectedYear}.csv`, columns, matrixData);
  };

  if (loading) return <div className="page-body"><div className="skeleton" style={{ height: '400px', borderRadius: '12px' }} /></div>;

  return (
    <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: 'var(--color-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarDays size={24} /> Weekly Issue Tracker
          </h3>
          <p className="subheading">Aggregated views of all stock issued from the Main Store, categorized by weeks.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <select className="input-field" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input-field" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="input-field" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
            {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn-secondary" onClick={handleExport} style={{ padding: '0 16px' }}>
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="card table-container" style={{ padding: 0 }}>
        {matrixData.length === 0 ? (
          <div className="empty-state">
            <CalendarDays size={48} style={{ opacity: 0.3 }} />
            <p>No items found for this category.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 240px)' }}>
            <table className="data-table" style={{ border: 'none' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Unit</th>
                  <th style={{ textAlign: 'center', background: 'rgba(52, 152, 219, 0.05)', color: '#2980B9' }}>Week 1</th>
                  <th style={{ textAlign: 'center', background: 'rgba(52, 152, 219, 0.05)', color: '#2980B9' }}>Week 2</th>
                  <th style={{ textAlign: 'center', background: 'rgba(52, 152, 219, 0.05)', color: '#2980B9' }}>Week 3</th>
                  <th style={{ textAlign: 'center', background: 'rgba(52, 152, 219, 0.05)', color: '#2980B9' }}>Week 4</th>
                  <th style={{ textAlign: 'center', background: 'rgba(52, 152, 219, 0.05)', color: '#2980B9' }}>Week 5</th>
                  <th style={{ textAlign: 'right', background: 'rgba(245, 166, 35, 0.1)', color: 'var(--color-primary)' }}>Mth Total</th>
                </tr>
              </thead>
              <tbody>
                {matrixData.map(item => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--color-text-muted)' }}>{item.item_code || '-'}</td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{item.unit}</td>
                    
                    <td style={{ textAlign: 'center', fontWeight: item.w1 > 0 ? 700 : 400, color: item.w1 > 0 ? 'var(--color-text-dark)' : 'var(--color-border)' }}>{item.w1 || '-'}</td>
                    <td style={{ textAlign: 'center', fontWeight: item.w2 > 0 ? 700 : 400, color: item.w2 > 0 ? 'var(--color-text-dark)' : 'var(--color-border)' }}>{item.w2 || '-'}</td>
                    <td style={{ textAlign: 'center', fontWeight: item.w3 > 0 ? 700 : 400, color: item.w3 > 0 ? 'var(--color-text-dark)' : 'var(--color-border)' }}>{item.w3 || '-'}</td>
                    <td style={{ textAlign: 'center', fontWeight: item.w4 > 0 ? 700 : 400, color: item.w4 > 0 ? 'var(--color-text-dark)' : 'var(--color-border)' }}>{item.w4 || '-'}</td>
                    <td style={{ textAlign: 'center', fontWeight: item.w5 > 0 ? 700 : 400, color: item.w5 > 0 ? 'var(--color-text-dark)' : 'var(--color-border)' }}>{item.w5 || '-'}</td>
                    
                    <td style={{ textAlign: 'right', fontWeight: 900, color: item.total > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)', background: 'rgba(245, 166, 35, 0.02)' }}>
                      {item.total || '-'}
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

export default WeeklyTracker;
