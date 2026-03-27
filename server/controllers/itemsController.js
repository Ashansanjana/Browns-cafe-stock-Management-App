const supabase = require('../supabase');

const getAllItems = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch items.' });
  }
};

const addItem = async (req, res) => {
  const { name, unit, item_code, category, min_stock } = req.body;
  
  if (!name || !unit) {
    return res.status(400).json({ error: 'Name and unit are required.' });
  }

  try {
    const payload = { 
      name, 
      unit,
      item_code: item_code || null,
      category: category || null,
      min_stock: min_stock ? Number(min_stock) : 5
    };

    const { data, error } = await supabase
      .from('items')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to add item.' });
  }
};

const updateItem = async (req, res) => {
  const { id } = req.params;
  const { name, unit, item_code, category, min_stock } = req.body;

  try {
    const payload = { 
      name, 
      unit,
      item_code: item_code || null,
      category: category || null,
      min_stock: min_stock !== undefined ? Number(min_stock) : undefined
    };

    const { data, error } = await supabase
      .from('items')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update item.' });
  }
};

const deleteItem = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if item has active logs! A strict relational DB constraint is normally `ON DELETE CASCADE` but 
    // it's safer to prevent UI deletion if logs exist. 
    // The user's schema uses `ON DELETE CASCADE` on logs, so deleting an item WILL delete its GRN/Issue/Adj logs.
    // Let's allow deletion but warn heavily on the frontend, or throw safety logic here.
    
    // We'll trust the ON DELETE CASCADE constraint from the database update script.
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) throw error;
    
    return res.json({ message: 'Item deleted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete item.' });
  }
};

module.exports = { getAllItems, addItem, updateItem, deleteItem };
