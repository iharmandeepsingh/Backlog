import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, ExternalLink, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

const ReceiptModal = ({ isOpen, onClose, registration, onApprove, onReject }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  if (!isOpen || !registration) return null;

  const payment = registration.payment || {};
  const receiptUrl = payment.receiptUrl;
  const isPdf = receiptUrl?.toLowerCase().endsWith('.pdf');

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.75));

  const handleAction = async (status) => {
    if (status === 'REJECTED' && !remarks.trim()) {
      alert('Please enter remarks explaining the rejection reason.');
      return;
    }
    setActionLoading(true);
    try {
      if (status === 'APPROVED' && onApprove) {
        await onApprove(registration._id, remarks);
      } else if (status === 'REJECTED' && onReject) {
        await onReject(registration._id, remarks);
      }
      onClose();
    } catch (e) {
      alert('Action failed: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-['Outfit']">
                Payment Proof Verification
              </h3>
              <p className="text-xs text-slate-400">
                Reg No: <span className="text-white font-mono">{registration.registrationNumber}</span> &bull; 
                Roll: <span className="text-white font-mono">{registration.student?.rollNumber}</span> ({registration.student?.name})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">Transaction Reference / UTR</span>
            <span className="font-semibold font-mono text-slate-900">{payment.transactionReference || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Bank / Payment Mode</span>
            <span className="font-semibold text-slate-900">{payment.bankName || payment.method}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Fee Amount Payable</span>
            <span className="font-bold text-emerald-700 text-sm">₹ {registration.feeBreakdown?.totalFee || payment.amount}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Current Status</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              payment.status === 'VERIFIED'
                ? 'bg-emerald-100 text-emerald-800'
                : payment.status === 'REJECTED'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {payment.status}
            </span>
          </div>
        </div>

        {/* Content / Preview Area */}
        <div className="flex-1 overflow-auto p-6 bg-slate-100 flex flex-col items-center justify-center min-h-[350px]">
          {receiptUrl ? (
            isPdf ? (
              <div className="w-full h-96 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-300 p-8 text-center">
                <FileText className="w-16 h-16 text-red-500 mb-3" />
                <h4 className="text-base font-semibold text-slate-800">PDF Document Uploaded</h4>
                <p className="text-xs text-slate-500 mb-4">{payment.receiptOriginalName || 'Transaction_Receipt.pdf'}</p>
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open PDF in New Window
                </a>
              </div>
            ) : (
              <div className="relative overflow-auto max-w-full max-h-[500px] flex items-center justify-center border border-slate-300 rounded-xl bg-white p-2 shadow-inner">
                <img
                  src={receiptUrl}
                  alt="Bank Payment Receipt"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.15s ease' }}
                  className="max-w-full rounded object-contain"
                />
              </div>
            )
          ) : (
            <div className="text-center p-8 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">No physical receipt file attached.</p>
              <p className="text-xs text-slate-500">This registration used online payment gateway or manual reference without image.</p>
            </div>
          )}
        </div>

        {/* Zoom & View Controls */}
        {receiptUrl && !isPdf && (
          <div className="bg-white border-t border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center gap-1"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center gap-1"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={receiptUrl}
                download={payment.receiptOriginalName || 'receipt'}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 font-medium text-slate-700 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download Original
              </a>
              <a
                href={receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 font-medium text-slate-700 flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Full View
              </a>
            </div>
          </div>
        )}

        {/* Admin Action Section */}
        {(onApprove || onReject) && (
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Verification Remarks / Notes {payment.status === 'REJECTED' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g., UTR verified against university account credit. or Incomplete screenshot / UTR not found."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>

              {onReject && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleAction('REJECTED')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Reject Receipt
                </button>
              )}

              {onApprove && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleAction('APPROVED')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve Payment
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptModal;
