const supabase = require('../supabase');

const getDashboard = async (req, res) => {
  try {
    // Get main store
    const { data: mainStore, error: msError } = await supabase
      .from('outlets')
      .select('*')
      .eq('is_main_store', true)
      .single();
    if (msError) throw msError;

    // Get all outlets (non-main)
    const { data: outlets, error: outError } = await supabase
      .from('outlets')
      .select('*')
      .eq('is_main_store', false)
      .order('name');
    if (outError) throw outError;

    // Get all outlet_stock with item info
    const { data: allStock, error: stockError } = await supabase
      .from('outlet_stock')
      .select(`
        outlet_id,
        quantity,
        updated_at,
        items (id, name, unit)
      `);
    if (stockError) throw stockError;

    // Organize stock by outlet_id
    const stockByOutlet = {};
    allStock.forEach(row => {
      if (!stockByOutlet[row.outlet_id]) stockByOutlet[row.outlet_id] = [];
      stockByOutlet[row.outlet_id].push({
        item_id: row.items.id,
        item_name: row.items.name,
        unit: row.items.unit,
        quantity: row.quantity,
        updated_at: row.updated_at
      });
    });

    // Main store data
    const mainStoreData = {
      outlet_info: { id: mainStore.id, name: mainStore.name, location: mainStore.location },
      stock: stockByOutlet[mainStore.id] || []
    };

    // Outlets data
    const outletsData = outlets.map(outlet => ({
      outlet_info: { id: outlet.id, name: outlet.name, location: outlet.location },
      stock: stockByOutlet[outlet.id] || []
    }));

    // Recent transfers (last 20)
    const { data: transfers, error: tError } = await supabase
      .from('stock_transfers')
      .select(`
        id,
        quantity,
        transferred_at,
        note,
        items (name, unit),
        to_outlet:outlets!stock_transfers_to_outlet_id_fkey (name)
      `)
      .order('transferred_at', { ascending: false })
      .limit(20);
    if (tError) throw tError;

    const recentTransfers = transfers.map(t => ({
      id: t.id,
      item_name: t.items?.name,
      unit: t.items?.unit,
      quantity: t.quantity,
      to_outlet_name: t.to_outlet?.name,
      transferred_at: t.transferred_at,
      note: t.note
    }));

    return res.json({
      main_store: mainStoreData,
      outlets: outletsData,
      recent_transfers: recentTransfers
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
};

module.exports = { getDashboard };
