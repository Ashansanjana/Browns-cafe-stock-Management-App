import React from 'react';
import { useStock } from '../context/StockContext';
import { ChevronDown, Lock, Unlock } from 'lucide-react';

const PeriodSelector = ({ style = {} }) => {
  const { periods, activePeriodId, setActivePeriodId, activePeriod } = useStock();

  if (!periods || periods.length === 0) return null;

  const isClosed = activePeriod?.status === 'closed';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      background: 'rgba(255,255,255,0.45)', padding: '8px 14px',
      borderRadius: '10px', border: '1px solid rgba(255,255,255,0.6)',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      ...style
    }}>
      {isClosed
        ? <Lock size={15} style={{ color: '#C0392B', flexShrink: 0 }} />
        : <Unlock size={15} style={{ color: '#27AE60', flexShrink: 0 }} />
      }
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <select
          value={activePeriodId || ''}
          onChange={e => setActivePeriodId(e.target.value)}
          style={{
            appearance: 'none', background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'Lato', fontSize: '13px', fontWeight: 800,
            color: isClosed ? '#C0392B' : '#27AE60',
            cursor: 'pointer', paddingRight: '20px', textTransform: 'uppercase', letterSpacing: '0.5px'
          }}
        >
          {periods.map(p => (
            <option key={p.id} value={p.id}>
              {p.label} {p.status === 'closed' ? '🔒' : '🟢'}
            </option>
          ))}
        </select>
        <ChevronDown size={14} style={{ position: 'absolute', right: 0, pointerEvents: 'none', color: '#888' }} />
      </div>
    </div>
  );
};

export default PeriodSelector;
