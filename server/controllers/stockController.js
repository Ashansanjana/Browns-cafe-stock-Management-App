const supabase = require('../supabase');

// Helper: get main store record
const getMainStore = async () => {
  const { data, error } = await supabase
    .from('outlets')
    .select('*')
    .eq('is_main_store', true)
    .single();
  if (error) throw error;
  return data;
};

// POST /api/stock/add — Add stock to main store
const addStock = async (req, res) => {
  const { item_id, quantity } = req.body;

  if (!item_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'item_id and quantity (> 0) are required.' });
  }

  try {
    const mainStore = await getMainStore();

    // Get current quantity if exists
    const { data: existing } = await supabase
      .from('outlet_stock')
      .select('id, quantity')
      .eq('outlet_id', mainStore.id)
      .eq('item_id', item_id)
      .single();

    let newQuantity = Number(quantity);
    if (existing) {
      newQuantity = Number(existing.quantity) + Number(quantity);
    }

    const { data, error } = await supabase
      .from('outlet_stock')
      .upsert(
        {
          outlet_id: mainStore.id,
          item_id,
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'outlet_id,item_id' }
      )
      .select()
      .single();

    if (error) throw error;

    // Get item details for response
    const { data: item } = await supabase.from('items').select('name, unit').eq('id', item_id).single();

    return res.json({
      message: `✅ ${quantity} ${item?.unit || ''} ${item?.name || 'item'} added to Main Store.`,
      stock: data
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to add stock.' });
  }
};

// POST /api/stock/transfer — Transfer from main store to outlet
const transferStock = async (req, res) => {
  const { item_id, to_outlet_id, quantity, note } = req.body;

  if (!item_id || !to_outlet_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'item_id, to_outlet_id, and quantity (> 0) are required.' });
  }

  try {
    const mainStore = await getMainStore();

    if (to_outlet_id === mainStore.id) {
      return res.status(400).json({ error: 'Cannot transfer stock to the Main Store.' });
    }

    // Check main store stock
    const { data: mainStoreStock } = await supabase
      .from('outlet_stock')
      .select('id, quantity')
      .eq('outlet_id', mainStore.id)
      .eq('item_id', item_id)
      .single();

    const available = mainStoreStock ? Number(mainStoreStock.quantity) : 0;
    const requested = Number(quantity);

    // Get item details
    const { data: item } = await supabase.from('items').select('name, unit').eq('id', item_id).single();

    if (available < requested) {
      return res.status(400).json({
        error: `Insufficient stock in Main Store. Available: ${available} ${item?.unit || ''}. Requested: ${requested} ${item?.unit || ''}.`
      });
    }

    // Deduct from main store
    const { error: deductError } = await supabase
      .from('outlet_stock')
      .update({
        quantity: available - requested,
        updated_at: new Date().toISOString()
      })
      .eq('outlet_id', mainStore.id)
      .eq('item_id', item_id);

    if (deductError) throw deductError;

    // Get outlet current stock
    const { data: outletStock } = await supabase
      .from('outlet_stock')
      .select('id, quantity')
      .eq('outlet_id', to_outlet_id)
      .eq('item_id', item_id)
      .single();

    const outletCurrentQty = outletStock ? Number(outletStock.quantity) : 0;

    // Upsert outlet stock
    const { error: upsertError } = await supabase
      .from('outlet_stock')
      .upsert(
        {
          outlet_id: to_outlet_id,
          item_id,
          quantity: outletCurrentQty + requested,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'outlet_id,item_id' }
      );

    if (upsertError) throw upsertError;

    // Log transfer
    await supabase.from('stock_transfers').insert([
      {
        from_outlet_id: mainStore.id,
        to_outlet_id,
        item_id,
        quantity: requested,
        note: note || null
      }
    ]);

    // Get outlet info for response
    const { data: toOutlet } = await supabase.from('outlets').select('name').eq('id', to_outlet_id).single();

    const mainStoreRemaining = available - requested;

    return res.json({
      message: `✅ ${requested} ${item?.unit || ''} ${item?.name || 'item'} transferred to ${toOutlet?.name}. Main Store remaining: ${mainStoreRemaining} ${item?.unit || ''}.`,
      main_store_remaining: mainStoreRemaining,
      outlet_total: outletCurrentQty + requested
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to transfer stock.' });
  }
};

// PUT /api/stock/update — Update quantity directly (for inline edit)
const updateStockQuantity = async (req, res) => {
  const { outlet_id, item_id, quantity } = req.body;

  if (!outlet_id || !item_id || quantity === undefined || quantity < 0) {
    return res.status(400).json({ error: 'outlet_id, item_id, and quantity are required.' });
  }

  try {
    const { data, error } = await supabase
      .from('outlet_stock')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('outlet_id', outlet_id)
      .eq('item_id', item_id)
      .select()
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update stock quantity.' });
  }
};

// DELETE /api/stock — Remove a stock entry
const removeStockEntry = async (req, res) => {
  const { outlet_id, item_id } = req.body;

  try {
    const { error } = await supabase
      .from('outlet_stock')
      .delete()
      .eq('outlet_id', outlet_id)
      .eq('item_id', item_id);

    if (error) throw error;
    return res.json({ message: 'Stock entry removed.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to remove stock entry.' });
  }
};

module.exports = { addStock, transferStock, updateStockQuantity, removeStockEntry };
