export const exportToCSV = (filename, columns, data) => {
  if (!data || !data.length) return;

  // Build CSV headers row
  const headers = columns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',');
  
  // Build rows mapping keys safely
  const rows = data.map(row => {
    return columns.map(col => {
      let val;
      if (typeof col.key === 'function') {
        val = col.key(row);
      } else {
        val = row[col.key];
        if (typeof val === 'function') {
          val = val();
        }
      }
      
      if (val === null || val === undefined) {
        val = '';
      }
      // Excel-safe escaping
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = [headers, ...rows].join('\n');
  
  // Create downloadable BLOB object
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (navigator.msSaveBlob) { 
    // IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    // Other Browsers
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
