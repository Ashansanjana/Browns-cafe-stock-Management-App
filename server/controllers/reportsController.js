const supabase = require('../supabase');
const { parse } = require('json2csv');

const getMonthlyReport = async (req, res) => {
  try {
    // 1. Get Outlets
    const { data: outlets, error: outError } = await supabase
      .from('outlets')
      .select('*');
    if (outError) throw outError;

    const outletMap = {};
    outlets.forEach(o => { outletMap[o.id] = o; });

    // 2. Get Current Stock
    const { data: allStock, error: stockError } = await supabase
      .from('outlet_stock')
      .select(`
        outlet_id,
        quantity,
        updated_at,
        items (name, unit)
      `);
    if (stockError) throw stockError;

    const stockData = allStock.map(row => ({
      'Store Type': outletMap[row.outlet_id]?.is_main_store ? 'Main Store' : 'Outlet',
      'Store Name': outletMap[row.outlet_id]?.name || 'Unknown',
      'Item Name': row.items?.name || 'Unknown',
      'Quantity': row.quantity,
      'Unit': row.items?.unit || '',
      'Last Updated': new Date(row.updated_at).toLocaleString()
    }));

    // 3. Get Recent Transfers (Current Month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: transfers, error: tError } = await supabase
      .from('stock_transfers')
      .select(`
        quantity,
        transferred_at,
        note,
        items (name, unit),
        from_outlet_id,
        to_outlet_id
      `)
      .gte('transferred_at', startOfMonth.toISOString())
      .order('transferred_at', { ascending: false });
    
    if (tError) throw tError;

    const transferData = transfers.map(t => ({
      'Date': new Date(t.transferred_at).toLocaleString(),
      'Item Name': t.items?.name,
      'Quantity': t.quantity,
      'Unit': t.items?.unit,
      'From': outletMap[t.from_outlet_id]?.name || 'Unknown',
      'To': outletMap[t.to_outlet_id]?.name || 'Unknown',
      'Note': t.note || ''
    }));

    // Format as CSV
    let csvString = '';
    
    if (stockData.length > 0) {
      csvString += '--- CURRENT STOCK BALANCES ---\n';
      csvString += parse(stockData);
    } else {
      csvString += '--- CURRENT STOCK BALANCES ---\nNo stock available.\n';
    }

    csvString += '\n\n';

    if (transferData.length > 0) {
      csvString += '--- THIS MONTH TRANSFERS ---\n';
      csvString += parse(transferData);
    } else {
      csvString += '--- THIS MONTH TRANSFERS ---\nNo transfers this month.\n';
    }

    res.header('Content-Type', 'text/csv');
    res.attachment(`Monthly_Stock_Report_${new Date().toISOString().slice(0, 7)}.csv`);
    return res.send(csvString);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate monthly report.' });
  }
};

module.exports = { getMonthlyReport };
