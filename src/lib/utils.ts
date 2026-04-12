export const downloadCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;
  
  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas
        const escaped = ('' + value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
  ];
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const cn = (...classes: any[]) => {
  return classes.filter(Boolean).join(' ');
};
export const calculateTotalMarks = (marks: any) => {
  if (!marks) return 0;
  return Object.values(marks).reduce((total: number, examMarks: any) => {
    if (typeof examMarks === 'number') return total + examMarks;
    if (typeof examMarks === 'object' && examMarks !== null) {
      return total + Object.values(examMarks).reduce((subTotal: number, score: any) => subTotal + (Number(score) || 0), 0);
    }
    return total;
  }, 0);
};

export const getConsolidatedMarks = (marks: any) => {
  if (!marks) return {};
  const consolidated: Record<string, number> = {};
  Object.values(marks).forEach((examMarks: any) => {
    if (typeof examMarks === 'object' && examMarks !== null) {
      Object.entries(examMarks).forEach(([subject, score]) => {
        consolidated[subject] = (consolidated[subject] || 0) + (Number(score) || 0);
      });
    }
  });
  return consolidated;
};
