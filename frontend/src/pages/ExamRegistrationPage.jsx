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
  Lock,
  Clock,
  ArrowLeft
} from 'lucide-react';
import PaymentGatewayModal from '../components/PaymentGatewayModal';

const ExamRegistrationPage = ({ onRegistrationSuccess, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionType, setSessionType] = useState('ODD');
  const [selectedSemesterType, setSelectedSemesterType] = useState('ODD');
  const [currentSemester, setCurrentSemester] = useState(user?.currentSemester || 1);
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

  const loadData = async (targetType) => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch system config
      const confRes = await configService.getConfig();
      if (confRes.success) {
        setConfig(confRes.config);
      }

      // 2. Fetch eligible backlogs with requested semester type (ODD, EVEN, or SPECIAL)
      const typeToQuery = targetType || selectedSemesterType;
      const subRes = await subjectService.getEligibleBacklogs(typeToQuery);
      if (subRes.success) {
        setActiveSession(subRes.activeSession);
        const sType = subRes.activeSession?.type || subRes.sessionType || 'ODD';
        setSessionType(sType);
        if (!targetType) {
          setSelectedSemesterType(sType);
        }
        setEligibleSubjects(subRes.eligibleSubjects || []);
        if (subRes.currentSemester) {
          setCurrentSemester(subRes.currentSemester);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load eligible subjects or active session.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchSemesterType = (newType) => {
    if (newType === selectedSemesterType) return;
    setSelectedSemesterType(newType);
    setSelectedSubjectIds([]);
    loadData(newType);
  };

  const isSpecialExam = sessionType === 'SPECIAL' || activeSession?.type === 'SPECIAL' || selectedSemesterType === 'SPECIAL';

  // Separate Theory vs Non-Theory
  const selectedSubjectsList = eligibleSubjects.filter(s => selectedSubjectIds.includes(s._id));
  const selectedTheoryCount = selectedSubjectsList.filter(s => s.isTheory).length;
  const selectedNonTheoryCount = selectedSubjectsList.filter(s => !s.isTheory).length;

  // Real-time Fee Calculation (Special Exam rates apply during Special sessions)
  const theoryFeeRate = activeSession?.theoryFeeOverride ?? (isSpecialExam ? (config.specialTheoryFeePerSubject ?? 1000) : (config.theoryFeePerSubject ?? 500));
  const nonTheoryFeeRate = activeSession?.nonTheoryFeeOverride ?? (isSpecialExam ? (config.specialNonTheoryFeePerSubject ?? 600) : (config.nonTheoryFeePerSubject ?? 300));
  const baseFee = activeSession?.baseFeeOverride ?? (isSpecialExam ? (config.specialBaseRegistrationFee ?? 200) : (config.baseRegistrationFee ?? 100));

  const maxTheoryAllowed = activeSession?.maxTheorySubjectsOverride ?? (isSpecialExam ? (config.specialMaxTheorySubjects ?? 6) : (config.maxTheorySubjects ?? 4));
  const isTheoryLimitReached = selectedTheoryCount >= maxTheoryAllowed;

  const now = new Date();
  const startDate = activeSession?.startDate ? new Date(activeSession.startDate) : null;
  const endDate = activeSession?.endDate ? new Date(activeSession.endDate) : null;
  const isWindowOpen = activeSession && activeSession.isActive && (!startDate || now >= startDate) && (!endDate || now <= endDate);

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
        alert(`Theory Subject Limit Reached: You can select a maximum of ${maxTheoryAllowed} theory subjects. Non-theory subjects can be selected without any numerical limit.`);
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
    if (!isWindowOpen) {
      setError('The examination registration window is currently closed for this session. Submissions are not accepted.');
      return;
    }

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
        if (activeSession?._id) {
          formData.append('sessionId', activeSession._id);
          formData.append('sessionType', activeSession.type || sessionType);
        }
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
          paymentMethod: 'ONLINE',
          sessionId: activeSession?._id,
          sessionType: activeSession?.type || sessionType
        };
        const res = await registrationService.createRegistration(payload);
        if (res.success) {
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
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 text-xs">
        <div className="w-8 h-8 border-3 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Loading eligible backlog examination subjects &amp; fee structures...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Session Header Card */}
      <div className="bg-white rounded border border-slate-300 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {isSpecialExam ? (
              <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                ⭐ SPECIAL EXAMINATION SESSION (ODD &amp; EVEN)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-blue-50 text-blue-900 border border-blue-200">
                {sessionType} SEMESTER SESSION
              </span>
            )}
            <span className="text-xs text-slate-500 font-mono">Academic Year {activeSession?.academicYear || '2026-2027'}</span>
            {isWindowOpen ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                🟢 Window Open
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                🔒 Closed
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            {activeSession?.name || 'Backlog Examination Registration'}
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            {isSpecialExam
              ? 'Special Examination: You can register for failed subjects across BOTH Odd and Even semesters simultaneously.'
              : 'Select your eligible backlog subjects below. Odd sessions permit only past odd semester failures (Sem 1, 3, 5, 7); Even sessions permit only past even semester failures (Sem 2, 4, 6, 8).'}
          </p>

          {/* Session Timing / Dates */}
          {activeSession && (
            <div className="mt-2 text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                <strong>Opening Date:</strong> {new Date(activeSession.startDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
              <span>&bull;</span>
              <span>
                <strong>Closing Deadline:</strong> <span className="font-bold text-slate-900">{new Date(activeSession.endDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </span>
            </div>
          )}

          {/* Extension Notice */}
          {activeSession?.isExtended && (
            <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-1.5">
              <span>🔔</span>
              <div>
                <span className="font-bold">Deadline Extended by Admin:</span> Open until{' '}
                <strong>{new Date(activeSession.extendedDate || activeSession.endDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong>.
                {activeSession.extensionReason && (
                  <span className="block text-[11px] text-amber-800 mt-0.5 font-medium">
                    Order / Circular: {activeSession.extensionReason}
                  </span>
                )}
              </div>
            </div>
          )}

          {!isWindowOpen && (
            <div className="mt-2 p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-rose-600" />
              <span>
                {startDate && now < startDate
                  ? `Registration portal opens on ${startDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}. Submissions are currently disabled.`
                  : `The examination registration deadline has passed (${endDate?.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}). Submissions are now closed.`}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-medium flex items-center gap-1.5 self-start md:self-center cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Odd / Even / Special Session Switcher & Academic Standing Rule Banner */}
      <div className="bg-white rounded border border-slate-300 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
              Select Examination Parity / Scope
            </span>
            <div className="inline-flex rounded border border-slate-300 p-0.5 bg-slate-100 flex-wrap gap-1">
              {isSpecialExam && (
                <button
                  type="button"
                  onClick={() => handleSwitchSemesterType('SPECIAL')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    selectedSemesterType === 'SPECIAL'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  ⭐ All Semesters (Odd &amp; Even)
                  <span className="ml-1.5 text-[9px] bg-amber-100 text-amber-900 px-1 py-0.2 rounded font-bold uppercase">
                    Special Exam
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSwitchSemesterType('ODD')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  selectedSemesterType === 'ODD'
                    ? 'bg-[#1e3a8a] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Odd Semesters (1, 3, 5, 7)
                {sessionType === 'ODD' && (
                  <span className="ml-1.5 text-[9px] bg-blue-200 text-blue-900 px-1 py-0.2 rounded font-bold uppercase">
                    Active
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSwitchSemesterType('EVEN')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  selectedSemesterType === 'EVEN'
                    ? 'bg-[#1e3a8a] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Even Semesters (2, 4, 6, 8)
                {sessionType === 'EVEN' && (
                  <span className="ml-1.5 text-[9px] bg-blue-200 text-blue-900 px-1 py-0.2 rounded font-bold uppercase">
                    Active
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
              Candidate Standing
            </span>
            <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-300 text-slate-800 px-3 py-1 rounded text-xs font-semibold">
              <span>Current Enrolled Semester:</span>
              <span className="font-mono text-xs bg-slate-200 text-slate-900 px-1.5 py-0.5 rounded font-bold">
                Semester {currentSemester}
              </span>
            </div>
          </div>
        </div>

        {/* Rule Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-xs text-amber-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Examination Standing Rule:</strong> You are currently enrolled in <strong>Semester {currentSemester}</strong>.{' '}
            {selectedSemesterType === 'SPECIAL' ? (
              <span>
                In this <strong>Special Examination Session</strong>, you are eligible to register for verified failed subjects across <strong>ALL strictly previous semesters (both Odd and Even: Semesters 1 through {currentSemester - 1})</strong>. Current regular semester ({currentSemester}) subjects are excluded because regular examinations are conducted for them.
              </span>
            ) : (
              <span>
                Only verified failed subjects from <strong>strictly previous {selectedSemesterType === 'ODD' ? 'Odd' : 'Even'} semesters</strong> ({selectedSemesterType === 'ODD' ? '1, 3, 5...' : '2, 4, 6...'} strictly less than Semester {currentSemester}) are eligible. Current regular semester ({currentSemester}) subjects are excluded.
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Subjects Selection (Left) vs Dynamic Fee & Payment Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Subjects Selection */}
        <div className="lg:col-span-8 space-y-4">
          {/* Theory Limits & Category Tabs */}
          <div className="bg-white p-3 rounded border border-slate-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex rounded border border-slate-300 p-0.5 bg-slate-100 text-xs font-medium">
              <button
                type="button"
                onClick={() => setFilterCategory('ALL')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  filterCategory === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Subjects ({eligibleSubjects.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('THEORY')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  filterCategory === 'THEORY' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Theory Only
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('NON_THEORY')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  filterCategory === 'NON_THEORY' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Practical / Clinical / Viva
              </button>
            </div>

            {/* Theory Quota Pill */}
            <div className="flex items-center gap-2 text-xs">
              <div className={`px-2.5 py-1 rounded border font-medium flex items-center gap-1.5 ${
                selectedTheoryCount >= maxTheoryAllowed
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-slate-50 text-slate-800 border-slate-300'
              }`}>
                <span>Theory Quota:</span>
                <span className="font-mono font-bold">
                  {selectedTheoryCount} / {maxTheoryAllowed}
                </span>
                {selectedTheoryCount >= maxTheoryAllowed && (
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-1 rounded font-bold uppercase">Max Limit</span>
                )}
              </div>

              <div className="px-2.5 py-1 rounded border bg-slate-50 text-slate-800 border-slate-300 font-medium">
                <span>Non-Theory:</span>{' '}
                <span className="font-mono font-bold">{selectedNonTheoryCount} (Unlimited)</span>
              </div>
            </div>
          </div>

          {/* Subjects List */}
          {filteredSubjects.length === 0 ? (
            <div className="bg-white rounded border border-slate-300 p-8 text-center text-slate-500 shadow-xs">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800 text-sm">No Backlog Subjects Found</h4>
              <p className="text-xs text-slate-500 mt-1">
                You do not have any pending eligible backlog subjects in this category for the active {sessionType} semester session.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSubjects.map((sub) => {
                const isSelected = selectedSubjectIds.includes(sub._id);
                const isAlreadyRegistered = sub.isAlreadyRegistered;
                const isTheory = sub.isTheory;
                const isTheoryBlocked = !isSelected && isTheory && isTheoryLimitReached;

                return (
                  <div
                    key={sub._id}
                    onClick={() => !isAlreadyRegistered && !isTheoryBlocked && handleToggleSubject(sub)}
                    className={`rounded border p-3.5 transition-colors flex items-start justify-between gap-3 select-none ${
                      isAlreadyRegistered
                        ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-xs cursor-pointer'
                        : isTheoryBlocked
                        ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                        : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50/60 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className="pt-0.5">
                        <input
                          type="checkbox"
                          checked={isSelected || isAlreadyRegistered}
                          disabled={isAlreadyRegistered || isTheoryBlocked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-[#1e3a8a] focus:ring-blue-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono font-bold text-blue-900 text-xs">
                            {sub.code}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                            isTheory ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {sub.type}
                          </span>
                          <span className="text-xs text-slate-600 font-medium">
                            Semester {sub.semester} ({sub.semester % 2 !== 0 ? 'Odd' : 'Even'})
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {sub.credits} Credits
                          </span>
                          <span className="text-[10px] bg-rose-50 text-rose-800 border border-rose-200 font-bold px-1 py-0.2 rounded">
                            Result: {sub.grade || 'F'} (Fail) {sub.marks !== null ? `• ${sub.marks} / ${sub.maxMarks || 100}` : ''}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-xs mt-1">
                          {sub.name}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          {sub.department} &bull; {sub.program || 'B.A., LL.B.'}
                        </p>

                        {!isTheory && (
                          <span className="inline-block text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 border border-emerald-200">
                            Non-Theory: Unlimited selection permitted
                          </span>
                        )}

                        {isAlreadyRegistered && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 mt-1.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Already Registered in this Session
                          </span>
                        )}

                        {isTheoryBlocked && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 mt-1.5 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            Cannot Select: Max Theory Limit ({maxTheoryAllowed}) Reached
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-slate-500 block">Exam Fee</span>
                      <span className="text-xs font-bold text-slate-900 font-mono">
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
        <div className="lg:col-span-4 space-y-4">
          {/* Dynamic Fee Calculator Box */}
          <div className="bg-white rounded border border-slate-300 shadow-xs p-4 sticky top-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2 flex items-center justify-between">
              <span>Fee Calculation Slip</span>
              {isSpecialExam ? (
                <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-bold uppercase border border-amber-300">
                  Special Exam Rates
                </span>
              ) : (
                <span className="text-[11px] text-[#1e3a8a] font-normal lowercase">official rates</span>
              )}
            </h2>

            {/* Selection Breakdown */}
            <div className="py-3 space-y-2 text-xs text-slate-600 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <span>
                  Theory Papers (<strong className="text-slate-900">{selectedTheoryCount}</strong> &times; ₹{theoryFeeRate}):
                </span>
                <span className="font-mono font-medium text-slate-900">₹ {theoryTotal}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>
                  Non-Theory Papers (<strong className="text-slate-900">{selectedNonTheoryCount}</strong> &times; ₹{nonTheoryFeeRate}):
                </span>
                <span className="font-mono font-medium text-slate-900">₹ {nonTheoryTotal}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Base Processing Fee:</span>
                <span className="font-mono font-medium text-slate-900">₹ {selectedSubjectsList.length > 0 ? baseFee : 0}</span>
              </div>
            </div>

            {/* Total Fee Highlight */}
            <div className="py-3 flex justify-between items-center bg-slate-50 -mx-4 px-4 border-b border-slate-200">
              <div>
                <span className="text-[11px] text-slate-500 block uppercase font-semibold">Total Examination Fee</span>
                <span className="text-xl font-bold text-slate-900">
                  ₹ {totalFee.toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block uppercase font-semibold">Papers Selected</span>
                <span className="text-xs font-bold text-slate-800">
                  {selectedSubjectsList.length} Subjects
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-3 space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Payment Option
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('ONLINE')}
                  className={`p-2.5 rounded border text-center transition-colors cursor-pointer ${
                    paymentMethod === 'ONLINE'
                      ? 'border-[#1e3a8a] bg-blue-50 text-[#1e3a8a] font-semibold'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mx-auto mb-1 text-[#1e3a8a]" />
                  <span className="text-xs block font-semibold">Online Gateway</span>
                  <span className="text-[10px] text-slate-500 block">Instant Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('MANUAL')}
                  className={`p-2.5 rounded border text-center transition-colors cursor-pointer ${
                    paymentMethod === 'MANUAL'
                      ? 'border-[#1e3a8a] bg-blue-50 text-[#1e3a8a] font-semibold'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Upload className="w-4 h-4 mx-auto mb-1 text-[#1e3a8a]" />
                  <span className="text-xs block font-semibold">Upload Receipt</span>
                  <span className="text-[10px] text-slate-500 block">Bank / Challan</span>
                </button>
              </div>

              {/* Manual Payment Fields */}
              {paymentMethod === 'MANUAL' && (
                <div className="mt-3 p-3 rounded bg-slate-50 border border-slate-300 space-y-2.5">
                  <div className="bg-white border border-slate-300 p-2 rounded text-[11px] text-slate-800">
                    <div className="font-bold flex items-center gap-1 mb-1 text-[#1e3a8a]">
                      <Building className="w-3.5 h-3.5" />
                      <span>University Bank Account for Fee Deposit:</span>
                    </div>
                    <div className="space-y-0.5 text-slate-600 font-mono text-[10px]">
                      <div>A/C: {config.bankDetails?.accountNumber || '389201948201'}</div>
                      <div>IFSC: {config.bankDetails?.ifscCode || 'SBIN0001423'} ({config.bankDetails?.bankName || 'State Bank of India'})</div>
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
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none font-mono"
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
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
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
                      className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border file:border-slate-300 file:text-[11px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                    />
                    {receiptPreview && (
                      <div className="mt-2 relative rounded border border-slate-300 overflow-hidden max-h-24 flex items-center justify-center bg-white">
                        <img src={receiptPreview} alt="Receipt preview" className="object-contain max-h-24" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                disabled={submitting || selectedSubjectsList.length === 0 || !isWindowOpen}
                onClick={handleSubmit}
                className="w-full mt-3 py-2.5 bg-[#1e3a8a] hover:bg-blue-800 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {!isWindowOpen ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Registration Window Closed</span>
                  </>
                ) : submitting ? (
                  'Submitting Application...'
                ) : paymentMethod === 'ONLINE' ? (
                  <>
                    <span>Proceed to Online Payment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Submit with Payment Proof</span>
                    <FileCheck className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                By submitting, candidate certifies the eligibility of selected papers per university rules.
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
