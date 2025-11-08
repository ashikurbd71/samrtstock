import ExcelJS from 'exceljs';

export async function generateDailyReportExcel(dateObj, transactions, products) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Daily Report');

  sheet.columns = [
    { header: 'Product Name', key: 'productName', width: 30 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Quantity', key: 'quantity', width: 12 },
    { header: 'Date', key: 'date', width: 18 },
  ];

  const totals = { IN: 0, OUT: 0, RESTOCK: 0, RETURN: 0 };
  for (const tx of transactions) {
    sheet.addRow({
      productName: tx.product?.name || '',
      type: tx.type,
      quantity: tx.quantity,
      date: tx.createdAt.toISOString().slice(0, 19).replace('T', ' '),
    });
    totals[tx.type] += tx.quantity;
  }

  const finalStock = products.reduce((sum, p) => sum + (p.totalStock || 0), 0);

  const summaryRow = sheet.addRow({
    productName: 'Summary',
    type: '',
    quantity: '',
    date: '',
  });

  summaryRow.getCell('A').value = `Total IN: ${totals.IN}`;
  summaryRow.getCell('B').value = `Total OUT: ${totals.OUT}`;
  summaryRow.getCell('C').value = `Total RESTOCK: ${totals.RESTOCK}`;
  summaryRow.getCell('D').value = `Total RETURN: ${totals.RETURN}`;

  const summary2 = sheet.addRow({
    productName: `Final Stock: ${finalStock}`,
    type: '',
    quantity: '',
    date: '',
  });

  // Simple header style
  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `report_${dateStr}.xlsx`;
  return { buffer, filename };
}

export async function generateLogsExcel(logs, dateObj = new Date()) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Logs');

  sheet.columns = [
    { header: 'Product Name', key: 'productName', width: 30 },
    { header: 'Event', key: 'event', width: 18 },
    { header: 'Date & Time', key: 'date', width: 22 },
  ];

  for (const log of logs) {
    sheet.addRow({
      productName: log.product?.name || '',
      event: log.event,
      date: new Date(log.createdAt).toISOString().slice(0, 19).replace('T', ' '),
    });
  }

  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `logs_${dateStr}.xlsx`;
  return { buffer, filename };
}