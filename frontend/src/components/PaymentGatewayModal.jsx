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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Gateway Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-wide">Razorpay Gateway</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-1.5 py-0.2 rounded border border-emerald-500/30">
                  TEST SECURE
                </span>
              </div>
              <p className="text-xs text-slate-400">University Exam Controller</p>
            </div>
          </div>
          {!processing && (
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Amount Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 px-6 py-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block font-medium">Exam Fee Amount</span>
            <span className="text-xl font-extrabold text-blue-900 font-['Outfit']">₹ {totalAmount.toFixed(2)}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Registration No</span>
            <span className="text-xs font-mono font-bold text-slate-700">{registration.registrationNumber}</span>
          </div>
        </div>

        {paymentSuccess ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 font-['Outfit']">Payment Successful!</h4>
            <p className="text-xs text-slate-600 mt-1">Transaction verified. Updating registration status...</p>
          </div>
        ) : (
          <div className="p-6">
            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  method === 'upi'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs block">UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  method === 'card'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs block">Card</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('netbanking')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  method === 'netbanking'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs block">NetBanking</span>
              </button>
            </div>

            {/* Form per method */}
            {method === 'upi' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Enter UPI VPA / ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="student@okaxis or 9811122233@paytm"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Fast UPI Simulation</span>
                  <span className="text-emerald-600 font-semibold cursor-pointer" onClick={() => setUpiId('student.exam@upi')}>
                    Use Auto UPI ID
                  </span>
                </div>
              </div>
            )}

            {method === 'card' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    placeholder="4111 2222 3333 4444"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Valid Thru</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {method === 'netbanking' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Bank</label>
                <select
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {processing ? 'Processing Secure Transaction...' : `Pay ₹ ${totalAmount.toFixed(2)}`}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>256-Bit SSL Encrypted &bull; PCI-DSS Certified Simulation</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentGatewayModal;
