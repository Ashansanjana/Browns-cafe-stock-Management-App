const supabase = require('../supabase');

exports.getOpeningBalances = async (req, res) => {
  const { data, error } = await supabase.from('opening_balances').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

exports.upsertOpeningBalance = async (req, res) => {
  const { outlet_id, item_id, qty, period_id } = req.body;
  
  if (!outlet_id || !item_id || qty === undefined) {
    return res.status(400).json({ error: 'Missing required fields (outlet_id, item_id, qty)' });
  }

  try {
    const { data, error } = await supabase
      .from('opening_balances')
      .upsert(
        { outlet_id, item_id, qty: Number(qty), period_id },
        { onConflict: 'outlet_id,item_id,period_id' }
      )
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upsert opening balance' });
  }
};
