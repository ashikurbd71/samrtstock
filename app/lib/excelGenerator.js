// generateDailyReportExcel()
import ExcelJS from 'exceljs';
import { Transaction } from './models';

export async function generateDailyReportExcel(dateObj, transactions, products) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Stock');

  // Header columns based on the desired pattern
  sheet.columns = [
    { header: 'S/N', key: 'sn', width: 6 },
    { header: 'Product Name', key: 'productName', width: 30 },
    { header: 'IN', key: 'IN', width: 10 },
    { header: 'OUT', key: 'OUT', width: 10 },
    { header: 'RESTOCK', key: 'RESTOCK', width: 12 },
    { header: 'RETURN', key: 'RETURN', width: 12 },
    { header: 'Final Stock', key: 'FINAL', width: 14 },
  ];

  // Build product lookup and aggregate totals per product for the day
  const productMap = new Map(products.map(p => [String(p._id), p]));
  const aggregate = new Map();

  for (const tx of transactions) {
    const pid = String(tx.product?._id ?? tx.product);
    const name = tx.product?.name || productMap.get(pid)?.name || '';
    if (!aggregate.has(pid)) {
      aggregate.set(pid, {
        productName: name,
        totals: { IN: 0, OUT: 0, RESTOCK: 0, RETURN: 0 },
        finalStock: productMap.get(pid)?.totalStock ?? 0,
      });
    }
    const item = aggregate.get(pid);
    item.totals[tx.type] += tx.quantity;
  }

  // Sort by product name for a consistent listing
  const rows = Array.from(aggregate.values()).sort((a, b) =>
    (a.productName || '').localeCompare(b.productName || '')
  );

  // Add rows with serial numbers
  let sn = 1;
  for (const r of rows) {
    sheet.addRow({
      sn,
      productName: r.productName,
      IN: r.totals.IN,
      OUT: r.totals.OUT,
      RESTOCK: r.totals.RESTOCK,
      RETURN: r.totals.RETURN,
      FINAL: r.finalStock,
    });
    sn++;
  }

  // Totals footer
  const totalsAll = rows.reduce(
    (acc, r) => {
      acc.IN += r.totals.IN;
      acc.OUT += r.totals.OUT;
      acc.RESTOCK += r.totals.RESTOCK;
      acc.RETURN += r.totals.RETURN;
      acc.FINAL += r.finalStock;
      return acc;
    },
    { IN: 0, OUT: 0, RESTOCK: 0, RETURN: 0, FINAL: 0 }
  );

  const footer = sheet.addRow({
    sn: '',
    productName: 'Totals',
    IN: totalsAll.IN,
    OUT: totalsAll.OUT,
    RESTOCK: totalsAll.RESTOCK,
    RETURN: totalsAll.RETURN,
    FINAL: totalsAll.FINAL,
  });

  // Style header and footer
  sheet.getRow(1).font = { bold: true };
  footer.font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `report_${dateStr}.xlsx`;
  return { buffer, filename };
}

export async function generateProductsExcel(products, dateObj = new Date()) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Products');

  sheet.columns = [
    { header: 'S/N', key: 'sn', width: 6 },
    { header: 'Product Name', key: 'productName', width: 30 },
    { header: 'Total Stock', key: 'totalStock', width: 14 },
    { header: 'Created At', key: 'createdAt', width: 22 },
  ];

  const rows = [...products].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '')
  );

  let sn = 1;
  for (const p of rows) {
    sheet.addRow({
      sn,
      productName: p.name || '',
      totalStock: p.totalStock ?? 0,
      createdAt: new Date(p.createdAt).toISOString().slice(0, 19).replace('T', ' '),
    });
    sn++;
  }

  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `products_${dateStr}.xlsx`;
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
    { header: 'Amount', key: 'amount', width: 18 },
  ];

  // Collect product IDs present in logs
  const productIds = Array.from(
    new Set(
      logs
        .map((l) => l.product?._id?.toString() || l.product?.toString())
        .filter(Boolean)
    )
  );

  // Derive createdAt range from logs for consistent totals
  let createdAtRange = null;
  if (logs.length) {
    const timestamps = logs.map((l) => new Date(l.createdAt).getTime());
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);
    createdAtRange = { $gte: new Date(min), $lte: new Date(max) };
  }

  // Fetch transactions to compute per-product totals for the same range
  const txQuery = {};
  if (productIds.length) txQuery.product = { $in: productIds };
  if (createdAtRange) txQuery.createdAt = createdAtRange;
  const txs = await Transaction.find(txQuery).select('product type quantity createdAt');

  const txTotalsByProduct = new Map();
  for (const tx of txs) {
    const pid = tx.product?.toString();
    if (!pid) continue;
    const totals =
      txTotalsByProduct.get(pid) || { IN: 0, OUT: 0, RESTOCK: 0, RETURN: 0 };
    totals[tx.type] += tx.quantity;
    txTotalsByProduct.set(pid, totals);
  }

  const eventToTxType = {
    STOCKED: { type: 'IN', label: 'stock in' },
    OUT_OF_STOCK: { type: 'OUT', label: 'stock out' },
    REFUNDED: { type: 'RETURN', label: 'refund' },
  };

  for (const log of logs) {
    const pid = log.product?._id?.toString() || log.product?.toString();
    const mapping = eventToTxType[log.event] || { type: null, label: '' };
    const totals =
      pid
        ? txTotalsByProduct.get(pid) || {
            IN: 0,
            OUT: 0,
            RESTOCK: 0,
            RETURN: 0,
          }
        : { IN: 0, OUT: 0, RESTOCK: 0, RETURN: 0 };
    const stockAmount = mapping.type ? totals[mapping.type] : 0;
    const amountText = `${stockAmount}${
      mapping.label ? ` (${mapping.label})` : ''
    }`;

    sheet.addRow({
      productName: log.product?.name || '',
      event: log.event,
      date: new Date(log.createdAt).toISOString().slice(0, 19).replace('T', ' '),
      amount: amountText,
    });
  }

  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `logs_${dateStr}.xlsx`;
  return { buffer, filename };
}