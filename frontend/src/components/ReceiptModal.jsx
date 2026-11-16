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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded border border-slate-300 shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-[#1e3a8a] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-blue-200" />
            <div>
              <h3 className="text-sm font-bold">
                Payment Proof Verification
              </h3>
              <p className="text-[11px] text-blue-100">
                Reg No: <span className="text-white font-mono">{registration.registrationNumber}</span> &bull; 
                Roll: <span className="text-white font-mono">{registration.student?.rollNumber}</span> ({registration.student?.name})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-blue-200 hover:text-white hover:bg-blue-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Transaction UTR / Ref</span>
            <span className="font-semibold font-mono text-slate-900">{payment.transactionReference || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Bank / Mode</span>
            <span className="font-semibold text-slate-900">{payment.bankName || payment.method}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Fee Payable</span>
            <span className="font-bold text-slate-900">₹ {registration.feeBreakdown?.totalFee || payment.amount}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Status</span>
            <span className={`inline-block px-1.5 py-0.2 rounded text-[11px] font-semibold border ${
              payment.status === 'VERIFIED'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : payment.status === 'REJECTED'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {payment.status}
            </span>
          </div>
        </div>

        {/* Content / Preview Area */}
        <div className="flex-1 overflow-auto p-4 bg-slate-100 flex flex-col items-center justify-center min-h-[300px]">
          {receiptUrl ? (
            isPdf ? (
              <div className="w-full h-80 flex flex-col items-center justify-center bg-white rounded border border-slate-300 p-6 text-center">
                <FileText className="w-12 h-12 text-rose-600 mb-2" />
                <h4 className="text-sm font-semibold text-slate-800">PDF Document Uploaded</h4>
                <p className="text-xs text-slate-500 mb-3">{payment.receiptOriginalName || 'Transaction_Receipt.pdf'}</p>
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#1e3a8a] hover:bg-blue-800 text-white rounded text-xs font-medium flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open PDF in New Window
                </a>
              </div>
            ) : (
              <div className="relative overflow-auto max-w-full max-h-[480px] flex items-center justify-center border border-slate-300 rounded bg-white p-2">
                <img
                  src={receiptUrl}
                  alt="Bank Payment Receipt"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.15s ease' }}
                  className="max-w-full rounded object-contain"
                />
              </div>
            )
          ) : (
            <div className="text-center p-6 bg-white rounded border border-dashed border-slate-300 text-slate-400">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No receipt file uploaded.</p>
              <p className="text-[11px] text-slate-500">Transaction processed via online gateway or direct UTR reference.</p>
            </div>
          )}
        </div>

        {/* Zoom & View Controls */}
        {receiptUrl && !isPdf && (
          <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="p-1 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-xs">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={handleZoomIn}
                className="p-1 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={receiptUrl}
                download={payment.receiptOriginalName || 'receipt'}
                className="px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-100 font-medium text-slate-700 flex items-center gap-1 text-xs"
              >
                <Download className="w-3 h-3" />
                Download
              </a>
              <a
                href={receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-100 font-medium text-slate-700 flex items-center gap-1 text-xs"
              >
                <ExternalLink className="w-3 h-3" />
                Full View
              </a>
            </div>
          </div>
        )}

        {/* Admin Action Section */}
        {(onApprove || onReject) && (
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <div className="mb-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Admin Verification Remarks {payment.status === 'REJECTED' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g., UTR verified against university account credit. or Incomplete screenshot / UTR not found."
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-700 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>

              {onReject && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleAction('REJECTED')}
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Reject Receipt
                </button>
              )}

              {onApprove && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleAction('APPROVED')}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
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
