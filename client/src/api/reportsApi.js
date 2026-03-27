import api from './axiosInstance';

export const downloadMonthlyReport = async () => {
  const response = await api.get('/reports/monthly', {
    responseType: 'blob'
  });
  
  // Create a blob from the response data
  const blob = new Blob([response.data], { type: 'text/csv' });
  
  // Create a download link and click it
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Try to extract filename from content-disposition header if available
  let fileName = `Monthly_Stock_Report_${new Date().toISOString().slice(0,7)}.csv`;
  const disposition = response.headers['content-disposition'];
  if (disposition && disposition.indexOf('attachment') !== -1) {
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    if (matches != null && matches[1]) { 
      fileName = matches[1].replace(/['"]/g, '');
    }
  }
  
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
