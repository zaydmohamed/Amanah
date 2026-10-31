const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

class ReportingService {
  /**
   * Generates a printable POS Receipt as PDF
   */
  generateReceiptPDF(sale, setting) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: [226, 600], margin: 10 }); // 80mm POS thermal receipt format
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Business Header
        doc.fontSize(12).font('Helvetica-Bold').text(setting.businessName || 'Amanah Retail Mart', { align: 'center' });
        doc.fontSize(8).font('Helvetica').text(setting.address || '', { align: 'center' });
        doc.text(`Tel: ${setting.phone || ''}`, { align: 'center' });
        if (setting.taxNumber) doc.text(`Tax No: ${setting.taxNumber}`, { align: 'center' });
        doc.moveDown(0.5);

        doc.text('------------------------------------------------', { align: 'center' });
        doc.fontSize(8).font('Helvetica-Bold').text(`INVOICE: ${sale.invoiceNumber}`);
        doc.font('Helvetica').text(`Date: ${new Date(sale.saleDate).toLocaleString()}`);
        doc.text(`Cashier: ${sale.cashierName}`);
        doc.text(`Customer: ${sale.customerName}`);
        doc.text('------------------------------------------------', { align: 'center' });

        // Line Items Table
        doc.font('Helvetica-Bold').text('Item             Qty   Price    Total');
        doc.font('Helvetica');

        for (const item of sale.items) {
          const name = item.name.length > 14 ? item.name.substring(0, 12) + '..' : item.name.padEnd(14);
          const qty = String(item.quantity).padStart(3);
          const price = String(item.unitPrice.toFixed(2)).padStart(6);
          const total = String(item.subtotal.toFixed(2)).padStart(7);
          doc.text(`${name} ${qty} ${price} ${total}`);
        }

        doc.text('------------------------------------------------', { align: 'center' });
        doc.font('Helvetica-Bold');
        doc.text(`Subtotal:                    $${sale.subtotal.toFixed(2)}`, { align: 'right' });
        if (sale.discountTotal > 0) {
          doc.text(`Discount:                   -$${sale.discountTotal.toFixed(2)}`, { align: 'right' });
        }
        if (sale.taxTotal > 0) {
          doc.text(`Tax (${(sale.taxRate * 100).toFixed(0)}%):                   $${sale.taxTotal.toFixed(2)}`, { align: 'right' });
        }
        doc.fontSize(10).text(`TOTAL:     $${sale.totalAmount.toFixed(2)}`, { align: 'right' });
        doc.fontSize(8).font('Helvetica');
        doc.text(`Paid (${sale.paymentMethod}):              $${sale.amountPaid.toFixed(2)}`, { align: 'right' });
        if (sale.amountDue > 0) {
          doc.text(`Change Due / Debt:          $${sale.amountDue.toFixed(2)}`, { align: 'right' });
        }

        // Secondary Currency display (e.g. SOS)
        if (setting.exchangeRate && setting.secondaryCurrency) {
          const sosTotal = (sale.totalAmount * setting.exchangeRate).toLocaleString();
          doc.text(`Total (${setting.secondaryCurrency}):     ${sosTotal} Sh`, { align: 'right' });
        }

        doc.moveDown(0.5);
        doc.text('------------------------------------------------', { align: 'center' });
        doc.fontSize(7).text(setting.receiptFooter || 'Thank you for shopping with us!', { align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Generates Profit & Loss Statement as Excel Workbook
   */
  async generatePnLExcel(pnlData) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Profit & Loss');

    sheet.columns = [
      { header: 'Account / Description', key: 'name', width: 35 },
      { header: 'Code', key: 'code', width: 12 },
      { header: 'Amount ($)', key: 'amount', width: 18 },
    ];

    sheet.addRow(['PROFIT & LOSS STATEMENT', '', '']);
    sheet.addRow([`Period: ${new Date(pnlData.period.start).toLocaleDateString()} to ${new Date(pnlData.period.end).toLocaleDateString()}`, '', '']);
    sheet.addRow([]);

    // Revenue
    sheet.addRow(['1. REVENUE', '', '']);
    sheet.addRow(['Gross Sales', '4010', pnlData.revenue.grossSales]);
    if (pnlData.revenue.salesReturns > 0) sheet.addRow(['Less: Sales Returns', '4020', -pnlData.revenue.salesReturns]);
    if (pnlData.revenue.salesDiscounts > 0) sheet.addRow(['Less: Sales Discounts', '4030', -pnlData.revenue.salesDiscounts]);
    if (pnlData.revenue.otherIncome > 0) sheet.addRow(['Other Income', '4090', pnlData.revenue.otherIncome]);
    sheet.addRow(['NET SALES', '', pnlData.revenue.netSales]);
    sheet.addRow([]);

    // COGS
    sheet.addRow(['2. COST OF GOODS SOLD (COGS)', '', '']);
    for (const c of pnlData.costOfGoodsSold.breakdown) {
      sheet.addRow([c.name, c.code, c.amount]);
    }
    sheet.addRow(['TOTAL COGS', '', pnlData.costOfGoodsSold.total]);
    sheet.addRow([]);

    // GROSS PROFIT
    sheet.addRow(['GROSS PROFIT', '', pnlData.grossProfit]);
    sheet.addRow([`Gross Profit Margin`, '', `${pnlData.margins.grossMarginPercentage}%`]);
    sheet.addRow([]);

    // Operating Expenses
    sheet.addRow(['3. OPERATING EXPENSES', '', '']);
    for (const exp of pnlData.operatingExpenses.breakdown) {
      sheet.addRow([exp.name, exp.code, exp.amount]);
    }
    sheet.addRow(['TOTAL OPERATING EXPENSES', '', pnlData.operatingExpenses.total]);
    sheet.addRow([]);

    // NET PROFIT
    sheet.addRow(['NET PROFIT / (LOSS)', '', pnlData.netProfit]);
    sheet.addRow([`Net Profit Margin`, '', `${pnlData.margins.netMarginPercentage}%`]);

    return await workbook.xlsx.writeBuffer();
  }

  /**
   * Generates Balance Sheet Statement as Excel Workbook
   */
  async generateBalanceSheetExcel(bsData) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Balance Sheet');

    sheet.columns = [
      { header: 'Account Description', key: 'name', width: 35 },
      { header: 'Code', key: 'code', width: 12 },
      { header: 'Balance ($)', key: 'balance', width: 18 },
    ];

    sheet.addRow(['BALANCE SHEET', '', '']);
    sheet.addRow([`As of: ${new Date(bsData.asOfDate).toLocaleDateString()}`, '', '']);
    sheet.addRow([]);

    // Assets
    sheet.addRow(['ASSETS', '', '']);
    for (const a of bsData.assets.accounts) {
      sheet.addRow([a.name, a.code, a.balance]);
    }
    sheet.addRow(['TOTAL ASSETS', '', bsData.assets.total]);
    sheet.addRow([]);

    // Liabilities
    sheet.addRow(['LIABILITIES', '', '']);
    for (const l of bsData.liabilities.accounts) {
      sheet.addRow([l.name, l.code, l.balance]);
    }
    sheet.addRow(['TOTAL LIABILITIES', '', bsData.liabilities.total]);
    sheet.addRow([]);

    // Equity
    sheet.addRow(['OWNER EQUITY', '', '']);
    for (const eq of bsData.equity.accounts) {
      sheet.addRow([eq.name, eq.code, eq.balance]);
    }
    sheet.addRow(['TOTAL OWNER EQUITY', '', bsData.equity.total]);
    sheet.addRow([]);

    sheet.addRow(['TOTAL LIABILITIES & EQUITY', '', bsData.totalLiabilitiesAndEquity]);
    sheet.addRow(['EQUATION BALANCED?', '', bsData.isBalanced ? 'YES (Balanced)' : `NO (Diff: $${bsData.difference})`]);

    return await workbook.xlsx.writeBuffer();
  }
}

module.exports = new ReportingService();

