import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sessionService, registrationService, subjectService } from '../services/api';
import {
  GraduationCap,
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock3,
  XCircle,
  ArrowRight,
  Printer,
  Eye,
  CreditCard,
  BookOpen
} from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';
import PaymentGatewayModal from '../components/PaymentGatewayModal';

const StudentDashboard = ({ onNavigateToRegister, onSelectRegistrationToPrint }) => {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState(null);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [failedSubjects, setFailedSubjects] = useState([]);
  const [currentSemester, setCurrentSemester] = useState(user?.currentSemester || 1);
  const [loading, setLoading] = useState(true);
  const [selectedReceiptReg, setSelectedReceiptReg] = useState(null);
  const [gatewayReg, setGatewayReg] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch active session
      try {
        const sessRes = await sessionService.getActiveSession();
        if (sessRes.success) {
          setActiveSession(sessRes.session);
          setSessionOpen(sessRes.isOpen);
        }
      } catch (e) {
        console.warn('No active session');
      }

      // 2. Fetch registrations
      const regRes = await registrationService.getMyRegistrations();
      if (regRes.success) {
        setRegistrations(regRes.registrations || []);
      }

      // 3. Fetch eligible backlogs and full failure history
      try {
        const eligRes = await subjectService.getEligibleBacklogs();
        if (eligRes.success) {
          setEligibleCount(eligRes.eligibleSubjects?.length || 0);
          setFailedSubjects(eligRes.allFailedSubjects || []);
          if (eligRes.currentSemester) {
            setCurrentSemester(eligRes.currentSemester);
          }
        }
      } catch (e) {
        console.warn('Could not fetch eligible count');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (reg) => {
    const payment = reg.payment || {};
    const status = payment.status;

    if (status === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Paid &amp; Approved
        </span>
      );
    } else if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
          <XCircle className="w-3.5 h-3.5" />
          Rejected
        </span>
      );
    } else if (status === 'PENDING_PAYMENT') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
          <CreditCard className="w-3.5 h-3.5" />
          Awaiting Payment
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
          <Clock3 className="w-3.5 h-3.5" />
          Pending Verification
        </span>
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Student Profile Box */}
      <div className="bg-white rounded border border-slate-300 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-slate-100 border border-slate-300 flex items-center justify-center text-[#1e3a8a] shrink-0">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
                <span className="bg-blue-50 text-blue-900 border border-blue-200 text-xs font-semibold px-2 py-0.5 rounded">
                  Regular Sem {user?.currentSemester}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Enrollment / Roll No: <span className="font-mono font-bold text-slate-900">{user?.rollNumber}</span> &bull; 
                Programme: <span className="text-slate-800 font-medium">{user?.department}</span> ({user?.program || 'B.A., LL.B.'})
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Email: {user?.email} &bull; Contact: {user?.phone || 'Not Provided'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToRegister}
              disabled={!sessionOpen}
              className="px-4 py-2 bg-[#1e3a8a] hover:bg-blue-800 text-white rounded text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Apply for Backlog Exam</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Session Alert & Rules Bar */}
      {activeSession ? (
        <div className="bg-white rounded border border-slate-300 p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-slate-100 border border-slate-300 flex items-center justify-center text-[#1e3a8a] shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Active Session: {activeSession.name}
                  </h3>
                  <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                    {activeSession.type} SEMESTERS ONLY
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Registration Window: {new Date(activeSession.startDate).toLocaleDateString()} to {new Date(activeSession.endDate).toLocaleDateString()}
                  {sessionOpen ? ' (Portal Open)' : ' (Portal Closed)'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-300 px-3 py-1.5 rounded text-xs text-slate-700 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#1e3a8a]" />
              <span>
                Available Backlogs: <strong className="text-slate-900">{eligibleCount} subjects</strong>
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Examination Rule:</strong> In this <strong>{activeSession.type} Semester Session</strong>, 
              only failed subjects from past {activeSession.type === 'ODD' ? 'Odd (1, 3, 5, 7)' : 'Even (2, 4, 6, 8)'} semesters strictly prior to your current semester (Semester {currentSemester}) are eligible. Theory subjects are capped at maximum 4 papers; practical/clinical subjects have no limit.
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-300 rounded p-6 text-center text-slate-600 shadow-xs">
          <AlertCircle className="w-7 h-7 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-sm">No Active Registration Session</h3>
          <p className="text-xs text-slate-500 mt-1">
            Backlog examination registrations are currently closed. Please check the university examination calendar or contact the controller of examinations.
          </p>
        </div>
      )}

      {/* Failed Subjects & Backlog Records (From University Results) */}
      <div className="bg-white rounded border border-slate-300 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Academic Backlogs &amp; Failed Subjects Record
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                {failedSubjects.length} Failures Recorded
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Official university examination records. Subjects strictly before Semester {currentSemester} are eligible for backlog registration.
            </p>
          </div>

          <div className="text-xs bg-white text-slate-700 px-3 py-1 rounded font-medium border border-slate-300">
            Current Academic Standing: <strong>Semester {currentSemester}</strong>
          </div>
        </div>

        {failedSubjects.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <h4 className="font-bold text-slate-800 text-sm">No Backlog Records on File</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              You have no recorded subject failures from previous semesters. All past semester subjects are cleared!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold">
                  <th className="py-2.5 px-4 border-r border-slate-200">Subject Code</th>
                  <th className="py-2.5 px-4 border-r border-slate-200">Subject Name</th>
                  <th className="py-2.5 px-4 border-r border-slate-200">Semester</th>
                  <th className="py-2.5 px-4 border-r border-slate-200">Type</th>
                  <th className="py-2.5 px-4 border-r border-slate-200">Result / Grade</th>
                  <th className="py-2.5 px-4 border-r border-slate-200">Marks</th>
                  <th className="py-2.5 px-4">Backlog Eligibility Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {failedSubjects.map((sub) => {
                  const subSem = Number(sub.semester);
                  const isPrevious = subSem < currentSemester;
                  const isCurrent = subSem === currentSemester;
                  const isOdd = subSem % 2 !== 0;

                  return (
                    <tr key={sub._id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-900 border-r border-slate-200">{sub.code}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-900 border-r border-slate-200">{sub.name}</td>
                      <td className="py-2.5 px-4 border-r border-slate-200">
                        <span className="font-medium text-slate-800">Sem {sub.semester}</span>
                        <span className="text-[10px] text-slate-500 block">{isOdd ? 'Odd Semester' : 'Even Semester'}</span>
                      </td>
                      <td className="py-2.5 px-4 border-r border-slate-200">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                          sub.isTheory ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {sub.isTheory ? 'Theory (Max 4)' : `${sub.type || 'Practical'} (Unlimited)`}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 border-r border-slate-200">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          {sub.grade || 'F'} (Fail)
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 font-mono border-r border-slate-200">
                        {sub.marks !== null ? `${sub.marks} / ${sub.maxMarks || 100}` : 'Re-appear (RE)'}
                      </td>
                      <td className="py-2.5 px-4">
                        {isCurrent ? (
                          <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Current Sem Regular Exam (Not Backlog)
                          </span>
                        ) : isPrevious ? (
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                            (activeSession?.type === 'ODD' && isOdd) || (activeSession?.type === 'EVEN' && !isOdd)
                              ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                              : 'text-slate-600 bg-slate-100 border-slate-300'
                          }`}>
                            {isOdd ? 'Eligible in Odd Sem Exam' : 'Eligible in Even Sem Exam'}
                            {((activeSession?.type === 'ODD' && isOdd) || (activeSession?.type === 'EVEN' && !isOdd)) && ' (Active Now)'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Future Semester</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registration History & Applications Table */}
      <div className="bg-white rounded border border-slate-300 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Examination Registration History
            </h2>
            <p className="text-xs text-slate-500">
              Review submitted backlog exam registrations, transaction status, and print acknowledgment slips
            </p>
          </div>

          <button
            onClick={loadDashboardData}
            className="text-xs font-medium text-[#1e3a8a] hover:underline self-start sm:self-auto cursor-pointer"
          >
            Refresh List
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Loading your examination registrations...
          </div>
        ) : registrations.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No Applications Submitted Yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You have not submitted any backlog examination registrations for the current or previous sessions.
            </p>
            {sessionOpen && (
              <button
                onClick={onNavigateToRegister}
                className="mt-3 px-3 py-1.5 bg-[#1e3a8a] hover:bg-blue-800 text-white rounded text-xs font-medium transition-colors cursor-pointer"
              >
                Start Registration Now
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold">
                  <th className="py-2.5 px-4 border-r border-slate-200">Application No</th>
                  <th className="py-2.5 px-4 border-r border-slate-200">Session Name</th>
                  <th className="py-2.5 px-4 border-r border-slate-200">Subjects Registered</th>
                  <th className="py-2.5 px-4 border-r border-slate-200">Fee Breakdown</th>
                  <th className="py-2.5 px-4 border-r border-slate-200">Payment Method</th>
                  <th className="py-2.5 px-4 border-r border-slate-200">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {registrations.map((reg) => (
                  <tr key={reg._id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-900 border-r border-slate-200">
                      {reg.registrationNumber}
                      <span className="block text-[10px] text-slate-500 font-normal">
                        {reg.submittedAt ? new Date(reg.submittedAt).toLocaleDateString() : ''}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-200">
                      <span className="font-medium text-slate-900 block">{reg.sessionName || reg.session?.name}</span>
                      <span className="text-[10px] text-slate-500">{reg.sessionType} Semester Session</span>
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-200">
                      <div className="font-medium text-slate-800">
                        {reg.subjects?.length} Subjects total
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Theory: {reg.theoryCount} &bull; Non-Theory: {reg.nonTheoryCount}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-200">
                      <span className="font-bold text-slate-900">
                        ₹ {reg.feeBreakdown?.totalFee}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        Theory ₹{reg.feeBreakdown?.theoryTotal} + Non-Theory ₹{reg.feeBreakdown?.nonTheoryTotal}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-200">
                      <span className="font-medium text-slate-800 block">
                        {reg.payment?.method}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 truncate max-w-[120px] block">
                        {reg.payment?.transactionReference || 'Ref Pending'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-200">
                      {getStatusBadge(reg)}
                      {reg.payment?.rejectionRemarks && (
                        <span className="block text-[10px] text-rose-600 mt-1 max-w-[140px] truncate" title={reg.payment.rejectionRemarks}>
                          Note: {reg.payment.rejectionRemarks}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* If pending online payment */}
                        {reg.payment?.method === 'ONLINE' && reg.payment?.status !== 'VERIFIED' && (
                          <button
                            onClick={() => setGatewayReg(reg)}
                            className="px-2 py-1 bg-[#1e3a8a] hover:bg-blue-800 text-white rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <CreditCard className="w-3 h-3" />
                            Pay Now
                          </button>
                        )}

                        {/* If manual receipt exists */}
                        {reg.payment?.receiptUrl && (
                          <button
                            onClick={() => setSelectedReceiptReg(reg)}
                            title="Preview Uploaded Receipt"
                            className="p-1 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Print / View Acknowledgment Slip */}
                        <button
                          onClick={() => onSelectRegistrationToPrint(reg)}
                          title="Print Examination Slip"
                          className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-100 font-medium text-slate-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          Slip
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Modal Preview */}
      <ReceiptModal
        isOpen={!!selectedReceiptReg}
        registration={selectedReceiptReg}
        onClose={() => setSelectedReceiptReg(null)}
      />

      {/* Online Gateway Modal */}
      <PaymentGatewayModal
        isOpen={!!gatewayReg}
        registration={gatewayReg}
        onClose={() => setGatewayReg(null)}
        onSuccess={() => {
          loadDashboardData();
        }}
      />
    </div>
  );
};

export default StudentDashboard;
