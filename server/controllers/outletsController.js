const supabase = require('../supabase');

const getAllOutlets = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('outlets')
      .select('*')
      .order('is_main_store', { ascending: false });

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch outlets.' });
  }
};

const getOutletById = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('outlets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch outlet.' });
  }
};

const getOutletStock = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('outlet_stock')
      .select(`
        id,
        quantity,
        updated_at,
        items (id, name, unit)
      `)
      .eq('outlet_id', id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const formatted = data.map(row => ({
      id: row.id,
      item_id: row.items.id,
      item_name: row.items.name,
      unit: row.items.unit,
      quantity: row.quantity,
      updated_at: row.updated_at
    }));

    return res.json(formatted);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch outlet stock.' });
  }
};

module.exports = { getAllOutlets, getOutletById, getOutletStock };
