const supabase = require('../supabase');

// --- ACCOUNTING PERIODS ---
exports.getPeriods = async (req, res) => {
  const { data, error } = await supabase
    .from('accounting_periods')
    .select('*')
    .order('year', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

exports.closePeriod = async (req, res) => {
  const { period_id } = req.body;
  if (!period_id) return res.status(400).json({ error: 'period_id is required' });

  try {
    // 1. Fetch the period being closed
    const { data: period, error: periodErr } = await supabase
      .from('accounting_periods')
      .select('*')
      .eq('id', period_id)
      .single();
    if (periodErr || !period) return res.status(404).json({ error: 'Period not found' });
    if (period.status === 'closed') return res.status(400).json({ error: 'Period is already closed' });

    // 2. Fetch all opening balances for this period
    const { data: openingBalances } = await supabase
      .from('opening_balances')
      .select('*')
      .eq('period_id', period_id);

    // 3. Fetch all logs for this period
    const { data: grnLogs }   = await supabase.from('grn_log').select('*').eq('period_id', period_id);
    const { data: issueLogs } = await supabase.from('issue_log').select('*').eq('period_id', period_id);
    const { data: adjLogs }   = await supabase.from('adj_log').select('*').eq('period_id', period_id);
    const { data: usageLogs } = await supabase.from('usage_log').select('*').eq('period_id', period_id);
    const { data: outlets }   = await supabase.from('outlets').select('*');
    const { data: items }     = await supabase.from('items').select('*');

    // 4. Calculate closing balance for every outlet + item combo
    const closingBalances = {};
    for (const outlet of outlets) {
      for (const item of items) {
        const key = `${outlet.id}__${item.id}`;
        
        const ob = (openingBalances || []).find(o => o.outlet_id === outlet.id && o.item_id === item.id);
        let bal = ob ? Number(ob.qty) : 0;

        if (outlet.is_main_store) {
          bal += (grnLogs || []).filter(g => g.item_id === item.id).reduce((s, g) => s + Number(g.qty || 0), 0);
          bal -= (issueLogs || []).filter(i => i.item_id === item.id).reduce((s, i) => s + Number(i.qty || 0), 0);
        } else {
          bal += (issueLogs || []).filter(i => i.item_id === item.id && i.outlet_id === outlet.id).reduce((s, i) => s + Number(i.qty || 0), 0);
          bal -= (usageLogs || []).filter(u => u.item_id === item.id && u.outlet_id === outlet.id).reduce((s, u) => s + Number(u.qty || 0), 0);
        }
        // Add adjustments
        bal += (adjLogs || []).filter(a => a.item_id === item.id && a.outlet_id === outlet.id).reduce((s, a) => s + Number(a.adjustment || 0), 0);

        if (bal !== 0) closingBalances[key] = { outlet_id: outlet.id, item_id: item.id, qty: bal };
      }
    }

    // 5. Determine next month/year
    const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const currentMonthIdx = MONTHS.indexOf(period.month);
    const nextMonthIdx = (currentMonthIdx + 1) % 12;
    const nextYear = nextMonthIdx === 0 ? period.year + 1 : period.year;
    const nextMonth = MONTHS[nextMonthIdx];
    const nextLabel = `${nextMonth} ${nextYear}`;

    // 6. Create the new period
    const { data: newPeriod, error: newPeriodErr } = await supabase
      .from('accounting_periods')
      .insert([{ label: nextLabel, month: nextMonth, year: nextYear, status: 'open' }])
      .select('*')
      .single();
    if (newPeriodErr) return res.status(500).json({ error: newPeriodErr.message });

    // 7. Insert new opening balances for next period
    const newObRows = Object.values(closingBalances).map(row => ({
      outlet_id: row.outlet_id, item_id: row.item_id, qty: row.qty, period_id: newPeriod.id
    }));
    console.log(`[ClosePeriod] Inserting ${newObRows.length} opening balances for period ${newPeriod.label}`);
    if (newObRows.length > 0) {
      const { error: obErr } = await supabase
        .from('opening_balances')
        .insert(newObRows);
      if (obErr) {
        console.error('[ClosePeriod] OB insert error:', obErr.message);
        return res.status(500).json({ error: 'Failed to save opening balances: ' + obErr.message });
      }
    }

    // 8. Mark old period as closed
    const { error: closeErr } = await supabase
      .from('accounting_periods')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', period_id);
    if (closeErr) return res.status(500).json({ error: closeErr.message });

    res.json({ success: true, closedPeriod: period, newPeriod });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


// --- GRN LOG ---
exports.getGrnLog = async (req, res) => {
  const { data, error } = await supabase.from('grn_log').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

exports.addGrnEntry = async (req, res) => {
  const { date, item_id, qty, supplier, ref_invoice, notes, period_id } = req.body;
  const { data, error } = await supabase.from('grn_log').insert([{
    date, item_id, qty, supplier, ref_invoice, notes, period_id
  }]).select('*').single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
};

exports.deleteGrnEntry = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('grn_log').delete().match({ id });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Deleted successfully' });
};


// --- ISSUE LOG ---
exports.getIssueLog = async (req, res) => {
  const { data, error } = await supabase.from('issue_log').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

exports.addIssueEntry = async (req, res) => {
  const { date, week_no, month, year, item_id, outlet_id, qty, notes, period_id } = req.body;
  const { data, error } = await supabase.from('issue_log').insert([{
    date, week_no, month, year, item_id, outlet_id, qty, notes, period_id
  }]).select('*').single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
};

exports.deleteIssueEntry = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('issue_log').delete().match({ id });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Deleted successfully' });
};


// --- ADJ LOG ---
exports.getAdjLog = async (req, res) => {
  const { data, error } = await supabase.from('adj_log').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

exports.addAdjEntry = async (req, res) => {
  const { date, outlet_id, item_id, system_count, physical_count, adjustment, counted_by, verified_by, notes, period_id } = req.body;
  const { data, error } = await supabase.from('adj_log').insert([{
    date, outlet_id, item_id, system_count, physical_count, adjustment, counted_by, verified_by, notes, period_id
  }]).select('*').single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
};

exports.deleteAdjEntry = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('adj_log').delete().match({ id });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Deleted successfully' });
};


// --- USAGE LOG ---
exports.getUsageLog = async (req, res) => {
  const { data, error } = await supabase
    .from('usage_log')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

exports.addUsageEntry = async (req, res) => {
  const { date, outlet_id, item_id, qty, logged_by, notes, period_id } = req.body;
  try {
    const { data: logEntry, error: logError } = await supabase
      .from('usage_log')
      .insert([{ date, outlet_id, item_id, qty, logged_by, notes, period_id }])
      .select('*')
      .single();
    if (logError) throw logError;
    res.status(201).json(logEntry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUsageEntry = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('usage_log').delete().match({ id });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Deleted successfully' });
};
