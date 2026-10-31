import React, { useRef } from 'react';
import { Printer, Download, X, Store, CheckCircle, FileText } from 'lucide-react';
import api from '../../api/client';

export default function PrintableInvoiceModal({ sale, settings, onClose }) {
  const printRef = useRef(null);

  if (!sale) return null;

  const handleBrowserPrint = () => {
    const printContent = printRef.current;
    const windowPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    
    windowPrint.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${sale.invoiceNumber}</title>
          <style>
            @page { size: auto; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 20px; font-size: 13px; }
            .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 15px; margin-bottom: 15px; }
            .title { font-size: 20px; font-weight: bold; margin-bottom: 5px; color: #0f172a; }
            .subtitle { font-size: 12px; color: #64748b; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 12px; }
            .meta-column { width: 48%; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            .table th { background: #f8fafc; border-bottom: 1px solid #cbd5e1; padding: 8px 6px; text-align: left; font-size: 11px; text-transform: uppercase; }
            .table td { border-bottom: 1px solid #f1f5f9; padding: 8px 6px; }
            .totals { width: 45%; margin-left: auto; margin-bottom: 20px; }
            .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
            .grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #0f172a; padding-top: 6px; color: #0284c7; }
            .footer { text-align: center; font-size: 11px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 12px; margin-top: 20px; }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    windowPrint.document.close();
  };

  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      window.open(`/api/sales/${sale._id}/receipt?token=${encodeURIComponent(token)}`, '_blank');
    } catch (err) {
      alert(`PDF download failed: ${err.message}`);
    }
  };

  const sosTotal = settings?.exchangeRate
    ? (sale.totalAmount * settings.exchangeRate).toLocaleString()
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Action Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Print Customer Invoice / Receipt</h3>
              <p className="text-[11px] text-slate-500 font-mono">{sale.invoiceNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Paper Preview */}
        <div className="flex-1 overflow-y-auto my-4 p-5 border border-slate-200 rounded-xl bg-slate-50/50 shadow-inner">
          <div ref={printRef} className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 text-slate-800 font-sans">
            {/* Header */}
            <div className="header text-center border-b border-dashed border-slate-200 pb-4 mb-4">
              <div className="title text-lg font-bold text-slate-900 leading-tight">
                {settings?.businessName || 'Amanah Retail & Wholesale Mart'}
              </div>
              <div className="subtitle text-xs text-slate-500 mt-1">
                {settings?.address || 'Commercial District, Main Street'}
              </div>
              <div className="text-xs text-slate-500">Tel: {settings?.phone || '+252 61 5000000'}</div>
              {settings?.taxNumber && (
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">Tax No: {settings.taxNumber}</div>
              )}
            </div>

            {/* Metadata */}
            <div className="meta flex justify-between text-xs mb-4 pb-3 border-b border-slate-100">
              <div>
                <div><strong>Invoice #:</strong> <span className="font-mono">{sale.invoiceNumber}</span></div>
                <div><strong>Date:</strong> {new Date(sale.saleDate).toLocaleString()}</div>
                <div><strong>Cashier:</strong> {sale.cashierName}</div>
              </div>
              <div className="text-right">
                <div><strong>Customer:</strong> {sale.customerName}</div>
                {sale.customerPhone && <div><strong>Phone:</strong> {sale.customerPhone}</div>}
                <div>
                  <strong>Payment Status: </strong>
                  <span className="font-bold uppercase text-brand-600">{sale.paymentStatus}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="table w-full text-left text-xs mb-4">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-semibold">
                  <th className="py-2 px-1">Item Description</th>
                  <th className="py-2 px-1 text-center">Qty</th>
                  <th className="py-2 px-1 text-right">Unit Price</th>
                  <th className="py-2 px-1 text-right">Total ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-1">
                      <div className="font-medium text-slate-800">{item.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{item.sku}</div>
                    </td>
                    <td className="py-2 px-1 text-center font-bold">{item.quantity}</td>
                    <td className="py-2 px-1 text-right font-mono">${item.unitPrice.toFixed(2)}</td>
                    <td className="py-2 px-1 text-right font-mono font-bold">${item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Summary */}
            <div className="totals ml-auto w-56 text-xs space-y-1 pt-2 border-t border-slate-200">
              <div className="totals-row flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">${sale.subtotal?.toFixed(2)}</span>
              </div>
              {sale.discountTotal > 0 && (
                <div className="totals-row flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span className="font-mono">-${sale.discountTotal?.toFixed(2)}</span>
                </div>
              )}
              {sale.taxTotal > 0 && (
                <div className="totals-row flex justify-between text-slate-600">
                  <span>Sales Tax ({(sale.taxRate * 100).toFixed(0)}%):</span>
                  <span className="font-mono">${sale.taxTotal?.toFixed(2)}</span>
                </div>
              )}
              <div className="grand-total flex justify-between font-bold text-sm text-brand-600 pt-1.5 border-t border-slate-900">
                <span>Total Amount:</span>
                <span className="font-mono">${sale.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="totals-row flex justify-between text-slate-600 pt-1">
                <span>Amount Paid ({sale.paymentMethod}):</span>
                <span className="font-mono font-semibold">${sale.amountPaid?.toFixed(2)}</span>
              </div>
              {sale.amountDue > 0 && (
                <div className="totals-row flex justify-between font-bold text-rose-600">
                  <span>Balance Due (Credit):</span>
                  <span className="font-mono">${sale.amountDue?.toFixed(2)}</span>
                </div>
              )}
              {sosTotal && settings?.secondaryCurrency && (
                <div className="totals-row flex justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-100">
                  <span>Total ({settings.secondaryCurrency}):</span>
                  <span className="font-mono font-semibold">{sosTotal} Sh</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="footer text-center text-[11px] text-slate-500 mt-6 pt-3 border-t border-dashed border-slate-200">
              <div>{settings?.receiptFooter || 'Mahadsanid! Waad ku mahadsantahay iibsashadaada.'}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Goods returnable within 3 days with this invoice receipt.</div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100 shrink-0">
          <button
            onClick={handleBrowserPrint}
            className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md"
          >
            <Printer className="w-4 h-4" /> Daabac Hadda (Print Direct)
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md"
          >
            <Download className="w-4 h-4" /> Download / Fur PDF
          </button>
        </div>
      </div>
    </div>
  );
}

