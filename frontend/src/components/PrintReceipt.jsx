import React from 'react';
import { Printer, ArrowLeft, GraduationCap, CheckCircle2, Shield } from 'lucide-react';

const PrintReceipt = ({ registration, onBack }) => {
  if (!registration) return null;

  const handlePrint = () => {
    window.print();
  };

  const student = registration.student || {};
  const fee = registration.feeBreakdown || {};
  const payment = registration.payment || {};
  const subjects = registration.subjects || [];

  return (
    <div className="max-w-4xl mx-auto my-8">
      {/* Top Bar (Hidden in Print) */}
      <div className="mb-6 flex items-center justify-between no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-500/20 transition-all"
        >
          <Printer className="w-4 h-4" />
          Print / Save as PDF
        </button>
      </div>

      {/* Official Printable Sheet */}
      <div className="print-receipt-container bg-white border border-slate-300 rounded-2xl shadow-xl p-8 sm:p-12 text-slate-900">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-6 mb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase font-['Outfit']">
                CENTRAL UNIVERSITY EXAMINATION OFFICE
              </h1>
              <p className="text-xs tracking-wider text-slate-600 font-semibold uppercase">
                Directorate of Evaluation &bull; Backlog Examination Cell
              </p>
            </div>
          </div>
          <div className="mt-4 bg-slate-100 py-2 px-4 rounded-lg inline-block border border-slate-200">
            <h2 className="text-sm font-extrabold tracking-wide text-slate-900 uppercase">
              BACKLOG EXAMINATION REGISTRATION ACKNOWLEDGEMENT SLIP
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Academic Session: <span className="font-bold text-slate-900">{registration.sessionName || 'Winter 2026 Examination'}</span>
            </p>
          </div>
        </div>

        {/* Reg ID & Status Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wider block font-medium">Application Number</span>
            <span className="text-xl font-black font-mono text-blue-900 tracking-wider">
              {registration.registrationNumber}
            </span>
          </div>

          <div className="mt-3 sm:mt-0 flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Registration Status</span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                payment.status === 'VERIFIED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : payment.status === 'REJECTED'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {payment.status === 'VERIFIED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {payment.status === 'VERIFIED' ? 'CONFIRMED / PAID' : payment.status}
              </span>
            </div>
            {/* Barcode Mockup */}
            <div className="hidden sm:flex flex-col items-center pl-3 border-l border-slate-200">
              <div className="w-24 h-7 bg-slate-800 flex items-center justify-around px-1">
                {[...Array(18)].map((_, i) => (
                  <div key={i} className={`h-full bg-white ${i % 3 === 0 ? 'w-1' : 'w-0.5'}`}></div>
                ))}
              </div>
              <span className="text-[9px] font-mono text-slate-500 mt-0.5">{registration.registrationNumber}</span>
            </div>
          </div>
        </div>

        {/* Student Details Grid */}
        <div className="border border-slate-200 rounded-xl p-5 mb-6 bg-white">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 border-b pb-2">
            Student Particulars
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
            <div>
              <span className="text-slate-500 block">Student Full Name:</span>
              <span className="font-bold text-slate-900 text-sm">{student.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block">University Roll Number:</span>
              <span className="font-extrabold font-mono text-blue-900 text-sm">{student.rollNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Academic Program:</span>
              <span className="font-semibold text-slate-800">{student.program || 'B.Tech'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Department / Branch:</span>
              <span className="font-semibold text-slate-800">{student.department}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Current Semester:</span>
              <span className="font-semibold text-slate-800">Semester {student.currentSemester}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Submission Timestamp:</span>
              <span className="font-mono text-slate-700">
                {registration.submittedAt ? new Date(registration.submittedAt).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Registered Subjects Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Registered Examination Papers ({subjects.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Theory: <strong className="text-slate-800">{registration.theoryCount || 0}</strong> &bull; Non-Theory: <strong className="text-slate-800">{registration.nonTheoryCount || 0}</strong>
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <th className="py-2.5 px-4">#</th>
                <th className="py-2.5 px-4">Subject Code</th>
                <th className="py-2.5 px-4">Subject Title</th>
                <th className="py-2.5 px-4 text-center">Semester</th>
                <th className="py-2.5 px-4 text-center">Credits</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4 text-right">Paper Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((sub, index) => (
                <tr key={sub.code || index} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-mono text-slate-500">{index + 1}</td>
                  <td className="py-2.5 px-4 font-bold font-mono text-blue-900">{sub.code}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-900">{sub.name}</td>
                  <td className="py-2.5 px-4 text-center font-semibold">Sem {sub.semester}</td>
                  <td className="py-2.5 px-4 text-center font-mono">{sub.credits}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      sub.isTheory || sub.type === 'Theory'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {sub.type || (sub.isTheory ? 'Theory' : 'Practical/Lab')}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold">₹ {sub.fee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fee & Payment Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 text-xs">
            <h4 className="font-extrabold uppercase tracking-wider text-slate-700 mb-2 border-b pb-1.5">
              Fee Calculation Details
            </h4>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Theory Papers ({fee.theoryCount || 0} &times; ₹{fee.theoryFeePerSubject}):</span>
                <span className="font-mono font-semibold">₹ {fee.theoryTotal || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Non-Theory Papers ({fee.nonTheoryCount || 0} &times; ₹{fee.nonTheoryFeePerSubject}):</span>
                <span className="font-mono font-semibold">₹ {fee.nonTheoryTotal || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Base Exam Registration / Processing Fee:</span>
                <span className="font-mono font-semibold">₹ {fee.baseFee || 0}</span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-1.5 font-bold text-slate-900 text-sm">
                <span>Total Fee Amount:</span>
                <span className="font-mono text-emerald-700">₹ {fee.totalFee || 0}</span>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 text-xs">
            <h4 className="font-extrabold uppercase tracking-wider text-slate-700 mb-2 border-b pb-1.5">
              Payment &amp; Transaction Details
            </h4>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold text-slate-800">{payment.method}</span>
              </div>
              <div className="flex justify-between">
                <span>Reference / UTR / Order ID:</span>
                <span className="font-mono font-semibold text-slate-800 truncate max-w-[180px]">
                  {payment.transactionReference || payment.razorpayPaymentId || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Bank Name:</span>
                <span className="font-semibold text-slate-800">{payment.bankName || 'Integrated Gateway'}</span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-1.5">
                <span>Verification Timestamp:</span>
                <span className="font-mono text-slate-800">
                  {payment.verifiedAt ? new Date(payment.verifiedAt).toLocaleString() : 'Pending Admin Verification'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ordinance Rules & Signatures */}
        <div className="border-t-2 border-slate-200 pt-6 flex flex-col sm:flex-row items-end justify-between text-xs text-slate-500">
          <div className="space-y-1 mb-6 sm:mb-0 max-w-sm">
            <p className="font-bold text-slate-700 uppercase">Important Candidate Instructions:</p>
            <p>1. Present this signed acknowledgement slip along with your Student ID card at the exam hall.</p>
            <p>2. Hall ticket issuance is subject to successful payment verification.</p>
            <p>3. Examination dates will be notified separately on the university notice portal.</p>
          </div>

          <div className="text-center sm:text-right">
            <div className="w-36 h-12 border-b-2 border-dashed border-slate-400 mb-1 mx-auto sm:ml-auto"></div>
            <p className="font-bold text-slate-800">Controller of Examinations</p>
            <p className="text-[10px] text-slate-400">Central Evaluation Division</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintReceipt;
