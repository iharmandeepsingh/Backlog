import React, { useState } from 'react';
import { ShieldCheck, CreditCard, Smartphone, Building, CheckCircle2, Lock, X } from 'lucide-react';
import { registrationService } from '../services/api';

const PaymentGatewayModal = ({ isOpen, onClose, registration, onSuccess }) => {
  const [method, setMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '' });
  const [bank, setBank] = useState('SBI');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  if (!isOpen || !registration) return null;

  const totalAmount = registration.feeBreakdown?.totalFee || 0;

  const handlePayNow = async () => {
    setProcessing(true);

    try {
      // Create mock online order first if not already created
      let orderId = registration.payment?.razorpayOrderId;
      if (!orderId) {
        const orderRes = await registrationService.createOnlineOrder(registration._id);
        if (orderRes.success && orderRes.order) {
          orderId = orderRes.order.id;
        }
      }

      // Simulate payment network roundtrip (1.2 seconds)
      await new Promise(r => setTimeout(r, 1200));

      // Send verification payload to backend
      const verifyRes = await registrationService.verifyOnlinePayment({
        registrationId: registration._id,
        razorpayOrderId: orderId || `order_rzp_${Date.now()}`,
        razorpayPaymentId: `pay_rzp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        razorpaySignature: `sig_verified_${Date.now()}`
      });

      if (verifyRes.success) {
        setPaymentSuccess(true);
        setTimeout(() => {
          if (onSuccess) onSuccess(verifyRes.registration);
          onClose();
        }, 1500);
      } else {
        alert('Payment verification failed on server: ' + (verifyRes.message || 'Error'));
      }
    } catch (err) {
      console.error(err);
      alert('Payment processing error: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded border border-slate-300 shadow-lg max-w-md w-full overflow-hidden">
        {/* Gateway Header */}
        <div className="bg-[#1e3a8a] px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-200" />
            <div>
              <span className="font-bold text-sm block">University Payment Gateway</span>
              <p className="text-[11px] text-blue-100">Secure Online Fee Portal</p>
            </div>
          </div>
          {!processing && (
            <button onClick={onClose} className="text-blue-100 hover:text-white p-1 rounded cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Amount Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 block uppercase font-medium">Exam Fee Amount</span>
            <span className="text-lg font-bold text-slate-900">₹ {totalAmount.toFixed(2)}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-500 block">Registration No</span>
            <span className="text-xs font-mono font-bold text-slate-700">{registration.registrationNumber}</span>
          </div>
        </div>

        {paymentSuccess ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Payment Successful!</h4>
            <p className="text-xs text-slate-600 mt-1">Transaction verified. Updating registration status...</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={`p-2 rounded border text-center transition-colors cursor-pointer ${
                  method === 'upi'
                    ? 'border-[#1e3a8a] bg-blue-50 text-[#1e3a8a] font-semibold'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-4 h-4 mx-auto mb-1 text-slate-700" />
                <span className="text-xs block">UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`p-2 rounded border text-center transition-colors cursor-pointer ${
                  method === 'card'
                    ? 'border-[#1e3a8a] bg-blue-50 text-[#1e3a8a] font-semibold'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4 mx-auto mb-1 text-slate-700" />
                <span className="text-xs block">Debit / Credit</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('netbanking')}
                className={`p-2 rounded border text-center transition-colors cursor-pointer ${
                  method === 'netbanking'
                    ? 'border-[#1e3a8a] bg-blue-50 text-[#1e3a8a] font-semibold'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Building className="w-4 h-4 mx-auto mb-1 text-slate-700" />
                <span className="text-xs block">NetBanking</span>
              </button>
            </div>

            {/* Form per method */}
            {method === 'upi' && (
              <div className="space-y-2 bg-slate-50 p-3 rounded border border-slate-300">
                <label className="block text-xs font-semibold text-slate-700">Enter UPI Virtual Address / VPA</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="student@okaxis or 9811122233@paytm"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-700 focus:outline-none"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Fast Simulation Mode:</span>
                  <span className="text-[#1e3a8a] font-semibold hover:underline cursor-pointer" onClick={() => setUpiId('student.exam@upi')}>
                    Fill Sample VPA
                  </span>
                </div>
              </div>
            )}

            {method === 'card' && (
              <div className="space-y-2.5 bg-slate-50 p-3 rounded border border-slate-300">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    placeholder="4111 2222 3333 4444"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-700 focus:outline-none font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-700 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">CVV</label>
                    <input
                      type="password"
                      maxLength="3"
                      placeholder="123"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-700 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {method === 'netbanking' && (
              <div className="space-y-2 bg-slate-50 p-3 rounded border border-slate-300">
                <label className="block text-xs font-semibold text-slate-700">Select Bank</label>
                <select
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-700 focus:outline-none"
                >
                  <option value="SBI">State Bank of India (SBI)</option>
                  <option value="HDFC">HDFC Bank</option>
                  <option value="ICICI">ICICI Bank</option>
                  <option value="AXIS">Axis Bank</option>
                  <option value="PNB">Punjab National Bank</option>
                </select>
              </div>
            )}

            <button
              type="button"
              disabled={processing}
              onClick={handlePayNow}
              className="w-full py-2 bg-[#1e3a8a] hover:bg-blue-800 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              {processing ? 'Processing Transaction...' : `Pay ₹ ${totalAmount.toFixed(2)}`}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Official University Payment Gateway Test Environment</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentGatewayModal;
