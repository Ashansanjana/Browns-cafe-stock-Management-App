import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStock } from '../context/StockContext';
import { MapPin, ArrowRight } from 'lucide-react';
import PeriodSelector from '../components/PeriodSelector';

const Outlets = () => {
  const navigate = useNavigate();
  const { outlets, loading } = useStock();

  if (loading) {
    return <div className="page-body"><div className="skeleton" style={{ height: '400px', borderRadius: '12px' }} /></div>;
  }

  const branchOutlets = outlets.filter(o => !o.is_main_store);

  return (
    <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ padding: '0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontFamily: 'Playfair Display', fontSize: '24px', color: 'var(--color-primary)', marginBottom: '8px' }}>
            Branch Outlets
          </h3>
          <p className="subheading">Select an outlet to view its live stock balances derived from Main Store issues and local adjustments.</p>
        </div>
        <PeriodSelector />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {branchOutlets.map((outlet) => (
          <div 
            key={outlet.id} 
            className="card" 
            style={{ 
              cursor: 'pointer', display: 'flex', flexDirection: 'column', padding: '24px',
              transition: 'transform 0.2s', border: '1px solid transparent', gap: '16px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.boxShadow = 'var(--color-card-shadow)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onClick={() => navigate(`/outlets/${outlet.id}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 166, 35, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-secondary)' }}>
                <MapPin size={24} />
              </div>
              <ArrowRight size={20} style={{ color: 'var(--color-text-muted)', opacity: 0.5 }} />
            </div>
            
            <div>
              <h4 style={{ fontFamily: 'Playfair Display', fontSize: '20px', fontWeight: 700, color: 'var(--color-text-dark)', marginBottom: '4px' }}>
                {outlet.name}
              </h4>
              <p style={{ fontFamily: 'Lato', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                {outlet.location || 'View stock & transactions'}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Outlets;
