import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  adminService,
  registrationService,
  sessionService,
  configService,
  subjectService
} from '../services/api';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Settings,
  BookOpen,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  RefreshCw,
  AlertCircle,
  Users,
  DollarSign,
  TrendingUp,
  CreditCard,
  Edit,
  Trash2
} from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';

const AdminDashboard = ({ initialTab = 'overview', onSelectRegistrationToPrint }) => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState(initialTab); // 'overview' | 'registrations' | 'sessions' | 'config' | 'subjects' | 'students' | 'audit'

  // Global Data
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [config, setConfig] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Filters for Registrations
  const [regSearch, setRegSearch] = useState('');
  const [regDept, setRegDept] = useState('ALL');
  const [regStatus, setRegStatus] = useState('ALL');
  const [regSession, setRegSession] = useState('ALL');
  const [regMethod, setRegMethod] = useState('ALL');

  // Receipt Preview & Approval Modal
  const [selectedReceiptReg, setSelectedReceiptReg] = useState(null);

  // Forms & Modal states
  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);
  const [sessionFormData, setSessionFormData] = useState({
    name: '',
    type: 'ODD',
    academicYear: '2026-2027',
    startDate: '',
    endDate: '',
    isActive: false
  });

  const [isNewSubjectOpen, setIsNewSubjectOpen] = useState(false);
  const [subjectFormData, setSubjectFormData] = useState({
    code: '',
    name: '',
    semester: 1,
    credits: 3,
    department: 'Computer Science & Engineering',
    program: 'B.Tech',
    type: 'Theory'
  });

  const [configFormData, setConfigFormData] = useState({
    maxTheorySubjects: 4,
    theoryFeePerSubject: 500,
    nonTheoryFeePerSubject: 300,
    baseRegistrationFee: 100,
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      upiId: ''
    }
  });

  // Assign Backlogs Modal
  const [selectedStudentForBacklogs, setSelectedStudentForBacklogs] = useState(null);
  const [assignedBacklogIds, setAssignedBacklogIds] = useState([]);

  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const showNotification = (text, type = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
  };

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, regsRes, sessRes, confRes, subsRes, stusRes, logsRes] = await Promise.all([
        adminService.getDashboardStats().catch(() => ({ stats: null })),
        registrationService.getAllRegistrations().catch(() => ({ registrations: [] })),
        sessionService.getSessions().catch(() => ({ sessions: [] })),
        configService.getConfig().catch(() => ({ config: null })),
        subjectService.getAllSubjects().catch(() => ({ subjects: [] })),
        adminService.getAllStudents().catch(() => ({ students: [] })),
        adminService.getAuditLogs().catch(() => ({ logs: [] }))
      ]);

      if (statsRes.stats) setStats(statsRes.stats);
      if (regsRes.registrations) setRegistrations(regsRes.registrations);
      if (sessRes.sessions) setSessions(sessRes.sessions);
      if (confRes.config) {
        setConfig(confRes.config);
        setConfigFormData({
          maxTheorySubjects: confRes.config.maxTheorySubjects || 4,
          theoryFeePerSubject: confRes.config.theoryFeePerSubject || 500,
          nonTheoryFeePerSubject: confRes.config.nonTheoryFeePerSubject || 300,
          baseRegistrationFee: confRes.config.baseRegistrationFee || 100,
          bankDetails: confRes.config.bankDetails || {}
        });
      }
      if (subsRes.subjects) setSubjects(subsRes.subjects);
      if (stusRes.students) setStudents(stusRes.students);
      if (logsRes.logs) setAuditLogs(logsRes.logs);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Approve / Reject Payment Receipt
  const handleApprovePayment = async (regId, remarks) => {
    try {
      const res = await registrationService.verifyManualPayment(regId, {
        status: 'APPROVED',
        remarks: remarks || 'Payment receipt verified and approved by Examination Officer.'
      });
      if (res.success) {
        showNotification('Payment verified and registration confirmed successfully!');
        loadAllAdminData();
      }
    } catch (err) {
      alert('Verification error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRejectPayment = async (regId, remarks) => {
    try {
      const res = await registrationService.verifyManualPayment(regId, {
        status: 'REJECTED',
        remarks: remarks || 'Receipt rejected due to verification discrepancy.'
      });
      if (res.success) {
        showNotification('Registration payment marked as rejected.', 'error');
        loadAllAdminData();
      }
    } catch (err) {
      alert('Rejection error: ' + (err.response?.data?.message || err.message));
    }
  };

  // 2. Config Update
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      const res = await configService.updateConfig(configFormData);
      if (res.success) {
        showNotification('System fees and theory subject limits updated!');
        setConfig(res.config);
      }
    } catch (err) {
      alert('Error updating config: ' + (err.response?.data?.message || err.message));
    }
  };

  // 3. Create Session
  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const res = await sessionService.createSession(sessionFormData);
      if (res.success) {
        showNotification('New examination session created!');
        setIsNewSessionOpen(false);
        setSessionFormData({
          name: '',
          type: 'ODD',
          academicYear: '2026-2027',
          startDate: '',
          endDate: '',
          isActive: false
        });
        loadAllAdminData();
      }
    } catch (err) {
      alert('Error creating session: ' + (err.response?.data?.message || err.message));
    }
  };

  // Toggle Session Active Status
  const handleToggleSessionActive = async (session) => {
    try {
      const newActive = !session.isActive;
      const res = await sessionService.updateSession(session._id, { isActive: newActive });
      if (res.success) {
        showNotification(`Session "${session.name}" status updated to ${newActive ? 'ACTIVE' : 'INACTIVE'}!`);
        loadAllAdminData();
      }
    } catch (err) {
      alert('Error toggling session: ' + (err.response?.data?.message || err.message));
    }
  };

  // 4. Create Subject
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      const res = await subjectService.createSubject(subjectFormData);
      if (res.success) {
        showNotification(`Subject ${subjectFormData.code} added to catalog!`);
        setIsNewSubjectOpen(false);
        setSubjectFormData({
          code: '',
          name: '',
          semester: 1,
          credits: 3,
          department: 'Computer Science & Engineering',
          program: 'B.Tech',
          type: 'Theory'
        });
        loadAllAdminData();
      }
    } catch (err) {
      alert('Error creating subject: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteSubject = async (subId) => {
    if (!confirm('Are you sure you want to remove this subject from the curriculum?')) return;
    try {
      await subjectService.deleteSubject(subId);
      showNotification('Subject removed.');
      loadAllAdminData();
    } catch (err) {
      alert('Error deleting subject: ' + (err.response?.data?.message || err.message));
    }
  };

  // 5. Update Student Backlogs
  const handleOpenStudentBacklogs = (student) => {
    setSelectedStudentForBacklogs(student);
    setAssignedBacklogIds((student.eligibleBacklogs || []).map(id => String(id)));
  };

  const handleSaveStudentBacklogs = async () => {
    if (!selectedStudentForBacklogs) return;
    try {
      const res = await adminService.updateStudentBacklogs(selectedStudentForBacklogs._id, {
        eligibleBacklogs: assignedBacklogIds
      });
      if (res.success) {
        showNotification(`Backlogs updated for student ${selectedStudentForBacklogs.rollNumber}!`);
        setSelectedStudentForBacklogs(null);
        loadAllAdminData();
      }
    } catch (err) {
      alert('Error updating student: ' + (err.response?.data?.message || err.message));
    }
  };

  // Filtered Registrations
  const filteredRegistrations = registrations.filter(r => {
    if (regDept !== 'ALL' && r.student?.department !== regDept) return false;
    if (regStatus !== 'ALL' && (r.payment?.status || '').toUpperCase() !== regStatus.toUpperCase()) return false;
    if (regSession !== 'ALL' && String(r.session?._id || r.session) !== regSession) return false;
    if (regMethod !== 'ALL' && (r.payment?.method || '').toUpperCase() !== regMethod.toUpperCase()) return false;

    if (regSearch) {
      const term = regSearch.toLowerCase();
      const sName = (r.student?.name || '').toLowerCase();
      const sRoll = (r.student?.rollNumber || '').toLowerCase();
      const regNo = (r.registrationNumber || '').toLowerCase();
      const hasSub = (r.subjects || []).some(s => s.code.toLowerCase().includes(term) || s.name.toLowerCase().includes(term));
      if (!sName.includes(term) && !sRoll.includes(term) && !regNo.includes(term) && !hasSub) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Notification */}
      {statusMessage.text && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 ${
          statusMessage.type === 'error'
            ? 'bg-rose-900 text-white'
            : 'bg-emerald-900 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{statusMessage.text}</span>
          </div>
        </div>
      )}

      {/* Admin Dashboard Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-indigo-300">
              CENTRAL EXAMINATION CONTROL CONSOLE
            </span>
          </div>
          <h1 className="text-2xl font-bold font-['Outfit'] mt-1">
            Backlog Examination Administration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <strong className="text-white">{user?.name}</strong> &bull; Examination Controller Office
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => registrationService.exportCSV()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Registrations CSV</span>
          </button>

          <button
            onClick={loadAllAdminData}
            title="Refresh All Records"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Admin Subtabs Navigation Bar */}
      <div className="flex overflow-x-auto bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs text-xs font-bold scrollbar-none gap-1">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeSubTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Overview KPI</span>
        </button>

        <button
          onClick={() => setActiveSubTab('registrations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeSubTab === 'registrations'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Registrations &amp; Receipts ({registrations.length})</span>
          {stats?.pendingVerification > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {stats.pendingVerification} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeSubTab === 'sessions'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Examination Sessions ({sessions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('config')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeSubTab === 'config'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Fees &amp; Subject Limits</span>
        </button>

        <button
          onClick={() => setActiveSubTab('subjects')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeSubTab === 'subjects'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Curriculum ({subjects.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('students')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeSubTab === 'students'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Records ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeSubTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW KPI */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Total Registrations</span>
                <span className="text-2xl font-black text-slate-900 font-['Outfit'] mt-1 block">
                  {stats?.totalRegistrations || 0}
                </span>
                <span className="text-[11px] text-slate-400">Across all sessions</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Pending Verification</span>
                <span className="text-2xl font-black text-amber-600 font-['Outfit'] mt-1 block">
                  {stats?.pendingVerification || 0}
                </span>
                <span className="text-[11px] text-amber-600 font-medium">Manual receipts awaiting audit</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Total Fees Collected</span>
                <span className="text-2xl font-black text-emerald-700 font-['Outfit'] mt-1 block">
                  ₹ {(stats?.totalCollected || 0).toLocaleString()}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">Verified &amp; confirmed payments</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Registered Students</span>
                <span className="text-2xl font-black text-indigo-700 font-['Outfit'] mt-1 block">
                  {stats?.totalStudents || 0}
                </span>
                <span className="text-[11px] text-slate-400">Eligible candidate accounts</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Method Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 font-['Outfit'] mb-4 flex items-center justify-between">
                <span>Payment Channel Breakdown</span>
                <CreditCard className="w-4 h-4 text-slate-400" />
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">Online Gateway Payments</span>
                    <span className="font-mono text-blue-900">{stats?.paymentMethods?.online || 0} applications</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{
                        width: `${((stats?.paymentMethods?.online || 0) / Math.max(stats?.totalRegistrations || 1, 1)) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">Manual Bank Receipt Uploads</span>
                    <span className="font-mono text-indigo-900">{stats?.paymentMethods?.manual || 0} applications</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{
                        width: `${((stats?.paymentMethods?.manual || 0) / Math.max(stats?.totalRegistrations || 1, 1)) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Approved Registrations: <strong className="text-emerald-700">{stats?.approvedCount || 0}</strong></span>
                  <span>Rejected: <strong className="text-rose-700">{stats?.rejectedCount || 0}</strong></span>
                </div>
              </div>
            </div>

            {/* Department Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 font-['Outfit'] mb-4">
                Applications by Department
              </h3>

              <div className="space-y-2.5 text-xs">
                {Object.entries(stats?.departmentDistribution || {}).map(([dept, count]) => (
                  <div key={dept} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                    <span className="text-slate-700 font-medium">{dept}</span>
                    <span className="font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL REGISTRATIONS & PAYMENTS */}
      {activeSubTab === 'registrations' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Search & Multi-Filters Toolbar */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/50 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  placeholder="Search by student name, roll number, registration ID, or subject..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <button
                onClick={() => registrationService.exportCSV()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Payment Status</label>
                <select
                  value={regStatus}
                  onChange={(e) => setRegStatus(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING_VERIFICATION">Pending Verification</option>
                  <option value="VERIFIED">Verified / Paid</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="PENDING_PAYMENT">Awaiting Online Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Payment Mode</label>
                <select
                  value={regMethod}
                  onChange={(e) => setRegMethod(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 focus:outline-none"
                >
                  <option value="ALL">All Modes</option>
                  <option value="ONLINE">Online Payment</option>
                  <option value="MANUAL">Manual Receipt Upload</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Department</label>
                <select
                  value={regDept}
                  onChange={(e) => setRegDept(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 focus:outline-none"
                >
                  <option value="ALL">All Departments</option>
                  <option value="Computer Science & Engineering">Computer Science</option>
                  <option value="Information Technology">Information Tech</option>
                  <option value="Electronics & Communication">Electronics</option>
                  <option value="Mechanical Engineering">Mechanical</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Exam Session</label>
                <select
                  value={regSession}
                  onChange={(e) => setRegSession(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 focus:outline-none"
                >
                  <option value="ALL">All Sessions</option>
                  {sessions.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Registrations Table */}
          {filteredRegistrations.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No backlog registration records match the current search or filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Reg No</th>
                    <th className="py-3 px-4">Student &amp; Roll</th>
                    <th className="py-3 px-4">Department &amp; Sem</th>
                    <th className="py-3 px-4">Registered Subjects</th>
                    <th className="py-3 px-4">Fee Amount</th>
                    <th className="py-3 px-4">Payment &amp; UTR</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Audit / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRegistrations.map((reg) => {
                    const payment = reg.payment || {};
                    const isManualPending = payment.method === 'MANUAL' && payment.status === 'PENDING_VERIFICATION';

                    return (
                      <tr key={reg._id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-950">
                          {reg.registrationNumber}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {reg.submittedAt ? new Date(reg.submittedAt).toLocaleDateString() : ''}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{reg.student?.name}</span>
                          <span className="font-mono text-blue-700 font-semibold text-[11px] block">
                            {reg.student?.rollNumber}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-slate-800 block truncate max-w-[130px]">
                            {reg.student?.department}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Sem {reg.student?.currentSemester || 5} &bull; {reg.sessionType} Session
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {reg.subjects?.length} Subjects total
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                            Theory: {reg.theoryCount} &bull; Non-Theory: {reg.nonTheoryCount}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                          ₹ {reg.feeBreakdown?.totalFee}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            payment.method === 'ONLINE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {payment.method}
                          </span>
                          <span className="block font-mono text-[10px] text-slate-500 truncate max-w-[120px] mt-0.5">
                            {payment.transactionReference || payment.razorpayPaymentId || 'N/A'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            payment.status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : payment.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {payment.status}
                          </span>
                          {payment.rejectionRemarks && (
                            <span className="block text-[9px] text-rose-600 truncate max-w-[110px]" title={payment.rejectionRemarks}>
                              {payment.rejectionRemarks}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Receipt Preview & Audit Button */}
                            <button
                              onClick={() => setSelectedReceiptReg(reg)}
                              title="Audit & Verify Receipt"
                              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 font-semibold ${
                                isManualPending
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-xs'
                                  : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {isManualPending && <span>Verify</span>}
                            </button>

                            {/* Print / View Slip */}
                            <button
                              onClick={() => onSelectRegistrationToPrint(reg)}
                              title="View Examination Slip"
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EXAMINATION SESSIONS */}
      {activeSubTab === 'sessions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-['Outfit']">
                Examination Registration Sessions
              </h2>
              <p className="text-xs text-slate-500">
                Configure odd/even semester registration sessions, opening &amp; closing dates, and toggle active status.
              </p>
            </div>

            <button
              onClick={() => setIsNewSessionOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Session</span>
            </button>
          </div>

          {/* New Session Modal / Form */}
          {isNewSessionOpen && (
            <div className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-md animate-in fade-in">
              <h3 className="text-sm font-bold text-slate-900 font-['Outfit'] mb-4">
                Add New Examination Registration Session
              </h3>
              <form onSubmit={handleCreateSession} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Session Title *</label>
                    <input
                      type="text"
                      required
                      value={sessionFormData.name}
                      onChange={(e) => setSessionFormData({ ...sessionFormData, name: e.target.value })}
                      placeholder="e.g. Winter 2026 Examination (Odd Semesters)"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Session Semester Type *</label>
                    <select
                      value={sessionFormData.type}
                      onChange={(e) => setSessionFormData({ ...sessionFormData, type: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="ODD">ODD SEMESTERS (Sem 1, 3, 5, 7)</option>
                      <option value="EVEN">EVEN SEMESTERS (Sem 2, 4, 6, 8)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Academic Year</label>
                    <input
                      type="text"
                      value={sessionFormData.academicYear}
                      onChange={(e) => setSessionFormData({ ...sessionFormData, academicYear: e.target.value })}
                      placeholder="2026-2027"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Opening Date *</label>
                    <input
                      type="date"
                      required
                      value={sessionFormData.startDate}
                      onChange={(e) => setSessionFormData({ ...sessionFormData, startDate: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Closing Date *</label>
                    <input
                      type="date"
                      required
                      value={sessionFormData.endDate}
                      onChange={(e) => setSessionFormData({ ...sessionFormData, endDate: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveCheckbox"
                    checked={sessionFormData.isActive}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <label htmlFor="isActiveCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Set as Currently Active Session (will accept backlog registrations)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsNewSessionOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                  >
                    Save Examination Session
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sessions List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((sess) => (
              <div
                key={sess._id}
                className={`p-6 rounded-2xl border transition-all ${
                  sess.isActive
                    ? 'bg-indigo-50/60 border-indigo-300 shadow-sm ring-1 ring-indigo-400/30'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        sess.type === 'ODD' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {sess.type} Semesters
                      </span>
                      {sess.isActive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                          CURRENTLY ACTIVE
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base font-['Outfit'] mt-1">
                      {sess.name}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleToggleSessionActive(sess)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      sess.isActive
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {sess.isActive ? 'Deactivate' : 'Activate Session'}
                  </button>
                </div>

                <div className="text-xs text-slate-600 space-y-1 mt-4 pt-3 border-t border-slate-200/80">
                  <div className="flex justify-between">
                    <span>Academic Year:</span>
                    <span className="font-semibold">{sess.academicYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Registration Window:</span>
                    <span className="font-mono text-slate-800">
                      {new Date(sess.startDate).toLocaleDateString()} &mdash; {new Date(sess.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: FEES & SUBJECT LIMITS CONFIGURATION */}
      {activeSubTab === 'config' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto">
          <div className="mb-6 border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900 font-['Outfit']">
              Dynamic Fee Structure &amp; Theory Limits Configuration
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure the maximum theory subjects allowed per registration and dynamically adjust paper fee rates. 
              Changes are immediately enforced and logged in the security audit trail.
            </p>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Theory Limit */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                  Maximum Theory Subjects Limit *
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  Default: 4. Enforced on both frontend and backend for all student backlog registrations.
                </p>
                <input
                  type="number"
                  min="1"
                  max="12"
                  required
                  value={configFormData.maxTheorySubjects}
                  onChange={(e) => setConfigFormData({ ...configFormData, maxTheorySubjects: Number(e.target.value) })}
                  className="w-full text-base font-bold font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Theory Fee */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                  Theory Subject Fee (₹) *
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  Fee charged per theory subject (e.g. ₹500).
                </p>
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  value={configFormData.theoryFeePerSubject}
                  onChange={(e) => setConfigFormData({ ...configFormData, theoryFeePerSubject: Number(e.target.value) })}
                  className="w-full text-base font-bold font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Non-Theory Fee */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                  Non-Theory Subject Fee (₹) *
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  Fee for practicals, labs, vivas, and seminars (e.g. ₹300). Unlimited selection.
                </p>
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  value={configFormData.nonTheoryFeePerSubject}
                  onChange={(e) => setConfigFormData({ ...configFormData, nonTheoryFeePerSubject: Number(e.target.value) })}
                  className="w-full text-base font-bold font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Base Fee */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                  Base Exam Registration Fee (₹) *
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  Fixed processing charge added to each registration (e.g. ₹100).
                </p>
                <input
                  type="number"
                  min="0"
                  step="25"
                  required
                  value={configFormData.baseRegistrationFee}
                  onChange={(e) => setConfigFormData({ ...configFormData, baseRegistrationFee: Number(e.target.value) })}
                  className="w-full text-base font-bold font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* University Bank Details Section */}
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 font-['Outfit'] mb-3">
                University Bank Account Details (Displayed for Manual Receipts)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={configFormData.bankDetails.bankName || ''}
                    onChange={(e) => setConfigFormData({
                      ...configFormData,
                      bankDetails: { ...configFormData.bankDetails, bankName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={configFormData.bankDetails.accountNumber || ''}
                    onChange={(e) => setConfigFormData({
                      ...configFormData,
                      bankDetails: { ...configFormData.bankDetails, accountNumber: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={configFormData.bankDetails.ifscCode || ''}
                    onChange={(e) => setConfigFormData({
                      ...configFormData,
                      bankDetails: { ...configFormData.bankDetails, ifscCode: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={configFormData.bankDetails.upiId || ''}
                    onChange={(e) => setConfigFormData({
                      ...configFormData,
                      bankDetails: { ...configFormData.bankDetails, upiId: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              Save Configuration &amp; Fee Structure
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: CURRICULUM & SUBJECTS */}
      {activeSubTab === 'subjects' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-['Outfit']">
                Curriculum Subjects Catalog ({subjects.length})
              </h2>
              <p className="text-xs text-slate-500">
                Manage all academic subjects, semesters (odd vs even), and type classification (Theory vs Non-Theory).
              </p>
            </div>

            <button
              onClick={() => setIsNewSubjectOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>
          </div>

          {/* New Subject Modal / Form */}
          {isNewSubjectOpen && (
            <div className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-md animate-in fade-in">
              <h3 className="text-sm font-bold text-slate-900 font-['Outfit'] mb-4">
                Add New Subject to Curriculum
              </h3>
              <form onSubmit={handleCreateSubject} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Subject Code *</label>
                    <input
                      type="text"
                      required
                      value={subjectFormData.code}
                      onChange={(e) => setSubjectFormData({ ...subjectFormData, code: e.target.value })}
                      placeholder="e.g. CS501"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Subject Title *</label>
                    <input
                      type="text"
                      required
                      value={subjectFormData.name}
                      onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                      placeholder="e.g. Design & Analysis of Algorithms"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Semester (1 - 8) *</label>
                    <select
                      value={subjectFormData.semester}
                      onChange={(e) => setSubjectFormData({ ...subjectFormData, semester: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={s}>Semester {s} ({s % 2 !== 0 ? 'ODD' : 'EVEN'})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Credits</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={subjectFormData.credits}
                      onChange={(e) => setSubjectFormData({ ...subjectFormData, credits: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Subject Type *</label>
                    <select
                      value={subjectFormData.type}
                      onChange={(e) => setSubjectFormData({ ...subjectFormData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="Theory">Theory (Subject to Limit)</option>
                      <option value="Practical">Practical (Unlimited)</option>
                      <option value="Lab">Laboratory (Unlimited)</option>
                      <option value="Viva">Viva Voce (Unlimited)</option>
                      <option value="Seminar">Seminar / Project (Unlimited)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Department</label>
                    <select
                      value={subjectFormData.department}
                      onChange={(e) => setSubjectFormData({ ...subjectFormData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="Computer Science & Engineering">Computer Science</option>
                      <option value="Information Technology">Information Tech</option>
                      <option value="Electronics & Communication">Electronics</option>
                      <option value="Mechanical Engineering">Mechanical</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsNewSubjectOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                  >
                    Save Subject
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Subjects Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Subject Name</th>
                  <th className="py-3 px-4">Semester &amp; Session Group</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Credits</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-950">{sub.code}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{sub.name}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">Sem {sub.semester}</span>{' '}
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        sub.semester % 2 !== 0 ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {sub.semester % 2 !== 0 ? 'ODD' : 'EVEN'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sub.isTheory || sub.type === 'Theory' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {sub.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{sub.credits}</td>
                    <td className="py-3 px-4 text-slate-600">{sub.department}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteSubject(sub._id)}
                        title="Delete Subject"
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: STUDENT RECORDS & BACKLOG ASSIGNMENTS */}
      {activeSubTab === 'students' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-['Outfit']">
                Student Records &amp; Eligible Backlogs
              </h2>
              <p className="text-xs text-slate-500">
                View registered candidate records and assign or modify specific eligible backlogs.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Department &amp; Program</th>
                  <th className="py-3 px-4">Current Sem</th>
                  <th className="py-3 px-4">Assigned Backlogs Count</th>
                  <th className="py-3 px-4 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((stu) => (
                  <tr key={stu._id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">{stu.rollNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{stu.name}</td>
                    <td className="py-3 px-4 text-slate-600">{stu.department} ({stu.program})</td>
                    <td className="py-3 px-4 font-semibold">Semester {stu.currentSemester}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">
                        {(stu.eligibleBacklogs || []).length} Backlogs
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenStudentBacklogs(stu)}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold"
                      >
                        Edit Backlogs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal to Assign/Edit Backlogs for a Student */}
          {selectedStudentForBacklogs && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 animate-in fade-in">
                <h3 className="text-sm font-bold text-slate-900 font-['Outfit'] mb-1">
                  Manage Eligible Backlogs for {selectedStudentForBacklogs.name}
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Roll: <span className="font-mono font-bold text-slate-800">{selectedStudentForBacklogs.rollNumber}</span> &bull; Current Sem: {selectedStudentForBacklogs.currentSemester}
                </p>

                <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2 mb-4">
                  {subjects
                    .filter(s => s.semester < selectedStudentForBacklogs.currentSemester)
                    .map((sub) => {
                      const isChecked = assignedBacklogIds.includes(String(sub._id));
                      return (
                        <label
                          key={sub._id}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer ${
                            isChecked ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                const idStr = String(sub._id);
                                if (isChecked) {
                                  setAssignedBacklogIds(assignedBacklogIds.filter(id => id !== idStr));
                                } else {
                                  setAssignedBacklogIds([...assignedBacklogIds, idStr]);
                                }
                              }}
                              className="w-4 h-4 rounded text-indigo-600"
                            />
                            <div>
                              <span className="font-mono font-bold text-indigo-900">{sub.code}</span> &bull; {sub.name}
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500">Sem {sub.semester} ({sub.type})</span>
                        </label>
                      );
                    })}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStudentForBacklogs(null)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveStudentBacklogs}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: SECURITY AUDIT TRAIL */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-['Outfit']">
                System Security &amp; Activity Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                Every administrative fee change, theory limit modification, session toggle, and payment verification is recorded here.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-indigo-900 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{log.performedBy?.name || 'System'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.performedBy?.email || ''}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <pre className="text-[11px] font-sans max-w-md truncate" title={JSON.stringify(log.details, null, 2)}>
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                      </pre>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {log.ip || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receipt Modal with Approve/Reject actions */}
      <ReceiptModal
        isOpen={!!selectedReceiptReg}
        registration={selectedReceiptReg}
        onClose={() => setSelectedReceiptReg(null)}
        onApprove={handleApprovePayment}
        onReject={handleRejectPayment}
      />
    </div>
  );
};

export default AdminDashboard;
