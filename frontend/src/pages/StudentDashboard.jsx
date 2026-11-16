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
  BookOpen,
  Sparkles
} from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';
import PaymentGatewayModal from '../components/PaymentGatewayModal';

const StudentDashboard = ({ onNavigateToRegister, onSelectRegistrationToPrint }) => {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState(null);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [eligibleCount, setEligibleCount] = useState(0);
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

      // 3. Fetch eligible backlogs count
      try {
        const eligRes = await subjectService.getEligibleBacklogs();
        if (eligRes.success && eligRes.eligibleSubjects) {
          setEligibleCount(eligRes.eligibleSubjects.length);
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
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Paid &amp; Approved
        </span>
      );
    } else if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
          <XCircle className="w-3.5 h-3.5" />
          Rejected
        </span>
      );
    } else if (status === 'PENDING_PAYMENT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          <CreditCard className="w-3.5 h-3.5" />
          Awaiting Payment
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          <Clock3 className="w-3.5 h-3.5" />
          Pending Verification
        </span>
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Student Profile & Quick Overview Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg">
              <GraduationCap className="w-9 h-9 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-['Outfit']">{user?.name}</h1>
                <span className="bg-blue-500/30 text-blue-200 border border-blue-400/30 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  Sem {user?.currentSemester} Regular
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Roll: <span className="font-mono font-bold text-white">{user?.rollNumber}</span> &bull; 
                Dept: <span className="text-slate-200">{user?.department}</span> ({user?.program || 'B.Tech'})
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Email: {user?.email} &bull; Contact: {user?.phone || 'Not Provided'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToRegister}
              disabled={!sessionOpen}
              className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
        <div className={`rounded-2xl p-5 border shadow-sm ${
          sessionOpen ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50/70 border-amber-200'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                sessionOpen ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
              }`}>
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">
                    Active Session: {activeSession.name}
                  </h3>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    activeSession.type === 'ODD'
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : 'bg-purple-100 text-purple-800 border border-purple-200'
                  }`}>
                    {activeSession.type} SEMESTERS ONLY
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Registration Window: {new Date(activeSession.startDate).toLocaleDateString()} to {new Date(activeSession.endDate).toLocaleDateString()}
                  {sessionOpen ? ' (Currently Accepting Applications)' : ' (Window Closed)'}
                </p>
              </div>
            </div>

            <div className="bg-white/80 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-700 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>
                Available Backlogs: <strong className="text-blue-900">{eligibleCount} subjects</strong>
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-emerald-200/60 text-xs text-slate-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Rule Notice:</strong> Because this is an <strong>{activeSession.type} Semester Session</strong>, 
              you can only select backlogs from semesters <strong>{activeSession.type === 'ODD' ? '1, 3, 5, 7' : '2, 4, 6, 8'}</strong>. 
              Theory subjects are capped per university limit; practical/lab subjects have no numerical cap.
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 border border-slate-300 rounded-2xl p-6 text-center text-slate-600">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-sm">No Active Registration Session</h3>
          <p className="text-xs text-slate-500 mt-1">
            Backlog examination registrations are currently closed. Please check the university examination calendar or contact the controller of examinations.
          </p>
        </div>
      )}

      {/* Registration History & Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-['Outfit']">
              My Examination Registration History
            </h2>
            <p className="text-xs text-slate-500">
              Review submitted backlog exam registrations, transaction status, and print acknowledgment slips
            </p>
          </div>

          <button
            onClick={loadDashboardData}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 self-start sm:self-auto"
          >
            Refresh List
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Loading your examination registrations...
          </div>
        ) : registrations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Applications Submitted Yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't submitted any backlog examination registrations for the current or previous sessions.
            </p>
            {sessionOpen && (
              <button
                onClick={onNavigateToRegister}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                Start Registration Now
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Application No</th>
                  <th className="py-3 px-4">Session Name</th>
                  <th className="py-3 px-4">Subjects Registered</th>
                  <th className="py-3 px-4">Fee Breakdown</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.map((reg) => (
                  <tr key={reg._id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">
                      {reg.registrationNumber}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {reg.submittedAt ? new Date(reg.submittedAt).toLocaleDateString() : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{reg.sessionName || reg.session?.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{reg.sessionType} Semester Session</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">
                        {reg.subjects?.length} Subjects total
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Theory: {reg.theoryCount} &bull; Non-Theory: {reg.nonTheoryCount}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-700 text-sm">
                        ₹ {reg.feeBreakdown?.totalFee}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        Theory ₹{reg.feeBreakdown?.theoryTotal} + Non-Theory ₹{reg.feeBreakdown?.nonTheoryTotal}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">
                        {reg.payment?.method}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 truncate max-w-[120px] block">
                        {reg.payment?.transactionReference || 'Ref Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(reg)}
                      {reg.payment?.rejectionRemarks && (
                        <span className="block text-[10px] text-rose-600 mt-1 max-w-[140px] truncate" title={reg.payment.rejectionRemarks}>
                          Note: {reg.payment.rejectionRemarks}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* If pending online payment */}
                        {reg.payment?.method === 'ONLINE' && reg.payment?.status !== 'VERIFIED' && (
                          <button
                            onClick={() => setGatewayReg(reg)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-sm"
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
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Print / View Acknowledgment Slip */}
                        <button
                          onClick={() => onSelectRegistrationToPrint(reg)}
                          title="Print Examination Slip"
                          className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 font-semibold text-slate-700 flex items-center gap-1"
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
