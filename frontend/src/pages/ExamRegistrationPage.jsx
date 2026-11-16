import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subjectService, configService, registrationService } from '../services/api';
import {
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Upload,
  ArrowRight,
  ShieldCheck,
  Building,
  Info,
  Layers,
  FileCheck,
  Lock
} from 'lucide-react';
import PaymentGatewayModal from '../components/PaymentGatewayModal';

const ExamRegistrationPage = ({ onRegistrationSuccess, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionType, setSessionType] = useState('ODD');
  const [config, setConfig] = useState({
    maxTheorySubjects: 4,
    theoryFeePerSubject: 500,
    nonTheoryFeePerSubject: 300,
    baseRegistrationFee: 100,
    bankDetails: {}
  });

  const [eligibleSubjects, setEligibleSubjects] = useState([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [filterCategory, setFilterCategory] = useState('ALL'); // 'ALL' | 'THEORY' | 'NON_THEORY'

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState('ONLINE'); // 'ONLINE' | 'MANUAL'
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [transactionReference, setTransactionReference] = useState('');
  const [bankName, setBankName] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const [error, setError] = useState('');
  const [gatewayReg, setGatewayReg] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch system config
      const confRes = await configService.getConfig();
      if (confRes.success) {
        setConfig(confRes.config);
      }

      // 2. Fetch eligible backlogs
      const subRes = await subjectService.getEligibleBacklogs();
      if (subRes.success) {
        setActiveSession(subRes.activeSession);
        setSessionType(subRes.sessionType);
        setEligibleSubjects(subRes.eligibleSubjects || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load eligible subjects or active session.');
    } finally {
      setLoading(false);
    }
  };

  // Separate Theory vs Non-Theory
  const selectedSubjectsList = eligibleSubjects.filter(s => selectedSubjectIds.includes(s._id));
  const selectedTheoryCount = selectedSubjectsList.filter(s => s.isTheory).length;
  const selectedNonTheoryCount = selectedSubjectsList.filter(s => !s.isTheory).length;

  const maxTheoryAllowed = config.maxTheorySubjects || 4;
  const isTheoryLimitReached = selectedTheoryCount >= maxTheoryAllowed;

  // Real-time Fee Calculation
  const theoryFeeRate = config.theoryFeePerSubject || 500;
  const nonTheoryFeeRate = config.nonTheoryFeePerSubject || 300;
  const baseFee = config.baseRegistrationFee || 100;

  const theoryTotal = selectedTheoryCount * theoryFeeRate;
  const nonTheoryTotal = selectedNonTheoryCount * nonTheoryFeeRate;
  const totalFee = selectedSubjectsList.length > 0 ? theoryTotal + nonTheoryTotal + baseFee : 0;

  const handleToggleSubject = (subject) => {
    if (subject.isAlreadyRegistered) return;

    if (selectedSubjectIds.includes(subject._id)) {
      // Unselect
      setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== subject._id));
    } else {
      // Select
      if (subject.isTheory && isTheoryLimitReached) {
        alert(`Theory Subject Limit Reached: You can select a maximum of ${maxTheoryAllowed} theory subjects. Non-theory subjects can be selected without any limit.`);
        return;
      }
      setSelectedSubjectIds([...selectedSubjectIds, subject._id]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedSubjectIds.length === 0) {
      setError('Please select at least one backlog subject to register.');
      return;
    }

    if (paymentMethod === 'MANUAL') {
      if (!transactionReference.trim()) {
        setError('Please provide the Bank Transaction Reference / UTR Number.');
        return;
      }
      if (!receiptFile) {
        setError('Please upload a copy/photo of your bank transaction receipt or fee counter slip.');
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      if (paymentMethod === 'MANUAL') {
        const formData = new FormData();
        formData.append('subjectIds', JSON.stringify(selectedSubjectIds));
        formData.append('paymentMethod', 'MANUAL');
        formData.append('transactionReference', transactionReference);
        formData.append('bankName', bankName || 'Bank Transfer');
        formData.append('paymentDate', paymentDate);
        if (receiptFile) {
          formData.append('receipt', receiptFile);
        }

        const res = await registrationService.createRegistration(formData);
        if (res.success) {
          onRegistrationSuccess(res.registration);
        }
      } else {
        // ONLINE payment
        const payload = {
          subjectIds: selectedSubjectIds,
          paymentMethod: 'ONLINE'
        };
        const res = await registrationService.createRegistration(payload);
        if (res.success) {
          // Open Online payment checkout
          setGatewayReg(res.registration);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSubjects = eligibleSubjects.filter(sub => {
    if (filterCategory === 'THEORY') return sub.isTheory;
    if (filterCategory === 'NON_THEORY') return !sub.isTheory;
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Loading eligible backlog examination subjects &amp; fee structures...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Session Header Card */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 rounded-2xl p-6 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold tracking-wide uppercase ${
                sessionType === 'ODD'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
              }`}>
                {sessionType} SEMESTER SESSION
              </span>
              <span className="text-xs text-slate-400 font-mono">Academic Year {activeSession?.academicYear || '2026-2027'}</span>
            </div>
            <h1 className="text-2xl font-bold font-['Outfit'] mt-1">
              {activeSession?.name || 'Backlog Examination Registration'}
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Select your eligible theory and practical backlog subjects below. Odd sessions permit only Sem 1, 3, 5, 7 backlogs; Even sessions permit only Sem 2, 4, 6, 8 backlogs.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold self-start md:self-center transition-colors"
          >
            Cancel &amp; Return
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Subjects Selection (Left) vs Dynamic Fee & Payment Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Subjects Selection */}
        <div className="lg:col-span-8 space-y-5">
          {/* Theory Limits & Category Tabs */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterCategory === 'ALL' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Subjects ({eligibleSubjects.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('THEORY')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterCategory === 'THEORY' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Theory Only
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('NON_THEORY')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterCategory === 'NON_THEORY' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Practical / Lab / Viva
              </button>
            </div>

            {/* Theory Quota Pill */}
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
                selectedTheoryCount >= maxTheoryAllowed
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}>
                <span>Theory Quota:</span>
                <span className="font-mono font-bold text-sm">
                  {selectedTheoryCount} / {maxTheoryAllowed}
                </span>
                {selectedTheoryCount >= maxTheoryAllowed && (
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-1 rounded uppercase font-bold">Max Limit</span>
                )}
              </div>

              <div className="px-3 py-1.5 rounded-xl border bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold">
                <span>Non-Theory:</span>{' '}
                <span className="font-mono font-bold">{selectedNonTheoryCount} (Unlimited)</span>
              </div>
            </div>
          </div>

          {/* Subjects Cards List */}
          {filteredSubjects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800 text-sm">No Backlog Subjects Found</h4>
              <p className="text-xs text-slate-500 mt-1">
                You do not have any pending eligible backlog subjects in this category for the active {sessionType} semester session.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubjects.map((sub) => {
                const isSelected = selectedSubjectIds.includes(sub._id);
                const isAlreadyRegistered = sub.isAlreadyRegistered;
                const isTheory = sub.isTheory;
                const isTheoryBlocked = !isSelected && isTheory && isTheoryLimitReached;

                return (
                  <div
                    key={sub._id}
                    onClick={() => !isAlreadyRegistered && !isTheoryBlocked && handleToggleSubject(sub)}
                    className={`rounded-2xl border p-4.5 transition-all flex items-start justify-between gap-4 select-none ${
                      isAlreadyRegistered
                        ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'bg-blue-50/60 border-blue-500 shadow-sm ring-1 ring-blue-500/30 cursor-pointer'
                        : isTheoryBlocked
                        ? 'bg-white border-slate-200 opacity-50 cursor-not-allowed'
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/60 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Checkbox */}
                      <div className="pt-0.5">
                        <input
                          type="checkbox"
                          checked={isSelected || isAlreadyRegistered}
                          disabled={isAlreadyRegistered || isTheoryBlocked}
                          onChange={() => {}}
                          className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-extrabold text-blue-900 text-sm">
                            {sub.code}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isTheory ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {sub.type}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            Semester {sub.semester} ({sub.semester % 2 !== 0 ? 'Odd' : 'Even'})
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {sub.credits} Credits
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm mt-1">
                          {sub.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {sub.department} &bull; {sub.program || 'B.Tech'}
                        </p>

                        {isAlreadyRegistered && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-2 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Already Registered in this Session
                          </span>
                        )}

                        {isTheoryBlocked && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 mt-2 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            Cannot Select: Max Theory Limit ({maxTheoryAllowed}) Reached
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-slate-400 block font-medium">Exam Fee</span>
                      <span className="text-sm font-extrabold text-slate-900 font-mono">
                        ₹ {isTheory ? theoryFeeRate : nonTheoryFeeRate}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Real-Time Dynamic Fee Calculator & Payment Section */}
        <div className="lg:col-span-4 space-y-6">
          {/* Dynamic Fee Calculator Box */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-20">
            <h2 className="text-base font-bold text-slate-900 font-['Outfit'] border-b border-slate-200 pb-3 flex items-center justify-between">
              <span>Real-Time Fee Calculator</span>
              <span className="text-xs text-blue-600 font-normal font-sans">Active Rates</span>
            </h2>

            {/* Selection Breakdown */}
            <div className="py-4 space-y-2.5 text-xs text-slate-600 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <span>
                  Theory Papers (<strong className="text-slate-900">{selectedTheoryCount}</strong> &times; ₹{theoryFeeRate}):
                </span>
                <span className="font-mono font-bold text-slate-900">₹ {theoryTotal}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>
                  Non-Theory Papers (<strong className="text-slate-900">{selectedNonTheoryCount}</strong> &times; ₹{nonTheoryFeeRate}):
                </span>
                <span className="font-mono font-bold text-slate-900">₹ {nonTheoryTotal}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Base Processing Fee:</span>
                <span className="font-mono font-bold text-slate-900">₹ {selectedSubjectsList.length > 0 ? baseFee : 0}</span>
              </div>
            </div>

            {/* Total Fee Highlight */}
            <div className="py-4 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-500 block">Total Examination Fee</span>
                <span className="text-2xl font-black text-emerald-700 font-['Outfit']">
                  ₹ {totalFee.toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Papers Selected</span>
                <span className="text-sm font-bold text-slate-800">
                  {selectedSubjectsList.length} Subjects
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mt-2 pt-4 border-t border-slate-200 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Choose Payment Option
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('ONLINE')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    paymentMethod === 'ONLINE'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                  <span className="text-xs block">Online Payment</span>
                  <span className="text-[10px] text-slate-400 block font-normal">Instant Approval</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('MANUAL')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    paymentMethod === 'MANUAL'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 font-bold shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Upload className="w-5 h-5 mx-auto mb-1 text-indigo-600" />
                  <span className="text-xs block">Upload Receipt</span>
                  <span className="text-[10px] text-slate-400 block font-normal">Bank / Challan</span>
                </button>
              </div>

              {/* Manual Payment Fields */}
              {paymentMethod === 'MANUAL' && (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
                  <div className="bg-blue-50/70 border border-blue-200 p-2.5 rounded-lg text-[11px] text-blue-900">
                    <div className="font-bold flex items-center gap-1 mb-1">
                      <Building className="w-3.5 h-3.5" />
                      <span>University Account for Fee Deposit:</span>
                    </div>
                    <div className="space-y-0.5 text-slate-700 font-mono">
                      <div>A/C: {config.bankDetails?.accountNumber || '389201948201'}</div>
                      <div>IFSC: {config.bankDetails?.ifscCode || 'SBIN0001423'} ({config.bankDetails?.bankName || 'SBI'})</div>
                      <div>UPI: {config.bankDetails?.upiId || 'university.exam@sbi'}</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Bank Transaction Reference / UTR *
                    </label>
                    <input
                      type="text"
                      required
                      value={transactionReference}
                      onChange={(e) => setTransactionReference(e.target.value)}
                      placeholder="e.g. SBI-UTR-938201948201"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Remitting Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="State Bank of India / HDFC / UPI"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Upload Bank Receipt / Slip (JPG/PNG/PDF) *
                    </label>
                    <input
                      type="file"
                      required
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="w-full text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer"
                    />
                    {receiptPreview && (
                      <div className="mt-2 relative rounded border border-slate-200 overflow-hidden max-h-24 flex items-center justify-center bg-white">
                        <img src={receiptPreview} alt="Receipt preview" className="object-contain max-h-24" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                disabled={submitting || selectedSubjectsList.length === 0}
                onClick={handleSubmit}
                className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  'Submitting Application...'
                ) : paymentMethod === 'ONLINE' ? (
                  <>
                    <span>Proceed to Online Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Submit with Payment Proof</span>
                    <FileCheck className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                By submitting, you certify that all information is accurate per university exam guidelines.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Online Gateway Modal */}
      <PaymentGatewayModal
        isOpen={!!gatewayReg}
        registration={gatewayReg}
        onClose={() => setGatewayReg(null)}
        onSuccess={(updatedReg) => {
          onRegistrationSuccess(updatedReg);
        }}
      />
    </div>
  );
};

export default ExamRegistrationPage;
