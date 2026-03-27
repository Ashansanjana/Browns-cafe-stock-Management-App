import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getItems } from '../api/itemsApi';
import { getOutlets } from '../api/outletsApi';
import { getGrnLogs, getIssueLogs, getAdjLogs, getUsageLogs, getOpeningBalances, getPeriods } from '../api/logsApi';

const StockContext = createContext();

export const useStock = () => useContext(StockContext);

export const StockProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [allGrnLog, setAllGrnLog] = useState([]);
  const [allIssueLog, setAllIssueLog] = useState([]);
  const [allAdjLog, setAllAdjLog] = useState([]);
  const [allUsageLog, setAllUsageLog] = useState([]);
  const [allOpeningBalances, setAllOpeningBalances] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [activePeriodId, setActivePeriodId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedItems, fetchedOutlets, fetchedGrn, fetchedIssue, fetchedAdj, fetchedUsage, fetchedOB] = await Promise.all([
        getItems(),
        getOutlets(),
        getGrnLogs(),
        getIssueLogs(),
        getAdjLogs(),
        getUsageLogs(),
        getOpeningBalances()
      ]);
      setItems(fetchedItems || []);
      setOutlets(fetchedOutlets || []);
      setAllGrnLog(fetchedGrn || []);
      setAllIssueLog(fetchedIssue || []);
      setAllAdjLog(fetchedAdj || []);
      setAllUsageLog(fetchedUsage || []);
      setAllOpeningBalances(fetchedOB || []);
    } catch (error) {
      console.error('Failed to load stock data:', error);
    } finally {
      setLoading(false);
    }

    // Load periods separately — graceful fallback if table doesn't exist yet
    try {
      const fetchedPeriods = await getPeriods();
      setPeriods(fetchedPeriods || []);
      const openPeriod = (fetchedPeriods || []).find(p => p.status === 'open');
      if (openPeriod) setActivePeriodId(openPeriod.id);
      else if ((fetchedPeriods || []).length > 0) setActivePeriodId(fetchedPeriods[0].id);
    } catch (err) {
      console.warn('Periods table not available yet — run period_migration.sql to enable Month-End Close.', err.message);
      setPeriods([]);
      setActivePeriodId(null);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Filter all logs by activePeriodId
  const grnLog = useMemo(() => activePeriodId ? allGrnLog.filter(g => g.period_id === activePeriodId) : allGrnLog, [allGrnLog, activePeriodId]);
  const issueLog = useMemo(() => activePeriodId ? allIssueLog.filter(i => i.period_id === activePeriodId) : allIssueLog, [allIssueLog, activePeriodId]);
  const adjLog = useMemo(() => activePeriodId ? allAdjLog.filter(a => a.period_id === activePeriodId) : allAdjLog, [allAdjLog, activePeriodId]);
  const usageLog = useMemo(() => activePeriodId ? allUsageLog.filter(u => u.period_id === activePeriodId) : allUsageLog, [allUsageLog, activePeriodId]);
  const openingBalances = useMemo(() => activePeriodId ? allOpeningBalances.filter(ob => ob.period_id === activePeriodId) : allOpeningBalances, [allOpeningBalances, activePeriodId]);

  const activePeriod = useMemo(() => periods.find(p => p.id === activePeriodId) || null, [periods, activePeriodId]);
  const isReadOnly = activePeriod?.status === 'closed';

  // State mutators
  const addGrnToState = (entry) => setAllGrnLog(prev => [entry, ...prev]);
  const removeGrnFromState = (id) => setAllGrnLog(prev => prev.filter(g => g.id !== id));
  const addIssueToState = (entry) => setAllIssueLog(prev => [entry, ...prev]);
  const removeIssueFromState = (id) => setAllIssueLog(prev => prev.filter(i => i.id !== id));
  const addAdjToState = (entry) => setAllAdjLog(prev => [entry, ...prev]);
  const removeAdjFromState = (id) => setAllAdjLog(prev => prev.filter(a => a.id !== id));
  const addUsageToState = (entry) => setAllUsageLog(prev => [entry, ...prev]);
  const removeUsageFromState = (id) => setAllUsageLog(prev => prev.filter(u => u.id !== id));
  const addItemToState = (item) => setItems(prev => [...prev, item]);
  const updateItemInState = (updatedItem) => setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
  const removeItemFromState = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const updateOpeningBalanceInState = (ob) => {
    setAllOpeningBalances(prev => {
      const exists = prev.find(p => p.item_id === ob.item_id && p.outlet_id === ob.outlet_id && p.period_id === ob.period_id);
      if (exists) return prev.map(p => p.id === ob.id ? ob : p);
      return [...prev, ob];
    });
  };

  // After month-end close, refresh all data and switch to new period
  const onPeriodClosed = async (newPeriodId) => {
    await loadData();
    setActivePeriodId(newPeriodId);
  };

  // --- COMPUTED VALUES ---
  const getMainStoreBalance = (itemId) => {
    const mainStore = outlets.find(o => o.is_main_store);
    if (!mainStore) return 0;
    const openingStock = openingBalances.find(ob => ob.item_id === itemId && ob.outlet_id === mainStore.id)?.qty || 0;
    const totalGRN  = grnLog.filter(g => g.item_id === itemId).reduce((sum, g) => sum + Number(g.qty || 0), 0);
    const totalIssued = issueLog.filter(i => i.item_id === itemId).reduce((sum, i) => sum + Number(i.qty || 0), 0);
    const totalAdj  = adjLog.filter(a => a.outlet_id === mainStore.id && a.item_id === itemId).reduce((sum, a) => sum + Number(a.adjustment || 0), 0);
    return Number(openingStock) + totalGRN - totalIssued + totalAdj;
  };

  const getOutletBalance = (itemId, outletId) => {
    const openingStock = openingBalances.find(ob => ob.item_id === itemId && ob.outlet_id === outletId)?.qty || 0;
    const totalReceived = issueLog.filter(i => i.item_id === itemId && i.outlet_id === outletId).reduce((sum, i) => sum + Number(i.qty || 0), 0);
    const totalUsage    = usageLog.filter(u => u.item_id === itemId && u.outlet_id === outletId).reduce((sum, u) => sum + Number(u.qty || 0), 0);
    const totalAdj      = adjLog.filter(a => a.outlet_id === outletId && a.item_id === itemId).reduce((sum, a) => sum + Number(a.adjustment || 0), 0);
    return Number(openingStock) + totalReceived - totalUsage + totalAdj;
  };

  const getSystemCountAtDate = (itemId, outletId, asOfDate) => {
    const mainStore = outlets.find(o => o.is_main_store);
    const date = new Date(asOfDate);
    const openingStock = openingBalances.find(ob => ob.item_id === itemId && ob.outlet_id === outletId)?.qty || 0;
    if (mainStore && outletId === mainStore.id) {
      const grn   = grnLog.filter(g => g.item_id === itemId && new Date(g.date) <= date).reduce((sum, g) => sum + Number(g.qty || 0), 0);
      const issued = issueLog.filter(i => i.item_id === itemId && new Date(i.date) <= date).reduce((sum, i) => sum + Number(i.qty || 0), 0);
      const adjs  = adjLog.filter(a => a.outlet_id === outletId && a.item_id === itemId && new Date(a.date) <= date).reduce((sum, a) => sum + Number(a.adjustment || 0), 0);
      return Number(openingStock) + grn - issued + adjs;
    } else {
      const received = issueLog.filter(i => i.item_id === itemId && i.outlet_id === outletId && new Date(i.date) <= date).reduce((sum, i) => sum + Number(i.qty || 0), 0);
      const usage    = usageLog.filter(u => u.item_id === itemId && u.outlet_id === outletId && new Date(u.date) <= date).reduce((sum, u) => sum + Number(u.qty || 0), 0);
      const adjs     = adjLog.filter(a => a.outlet_id === outletId && a.item_id === itemId && new Date(a.date) <= date).reduce((sum, a) => sum + Number(a.adjustment || 0), 0);
      return Number(openingStock) + received - usage + adjs;
    }
  };

  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  return (
    <StockContext.Provider value={{
      items, outlets,
      grnLog, issueLog, adjLog, usageLog, openingBalances,
      periods, activePeriod, activePeriodId, setActivePeriodId, isReadOnly,
      loading,
      refreshData: loadData,
      onPeriodClosed,
      addGrnToState, removeGrnFromState,
      addIssueToState, removeIssueFromState,
      addAdjToState, removeAdjFromState,
      addUsageToState, removeUsageFromState,
      addItemToState, updateItemInState, removeItemFromState,
      updateOpeningBalanceInState,
      getMainStoreBalance,
      getOutletBalance,
      getSystemCountAtDate,
      getWeekNumber
    }}>
      {children}
    </StockContext.Provider>
  );
};
