import React from 'react';
import { Shield, HelpCircle, PhoneCall, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-8 mt-auto no-print text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          <div>
            <h3 className="text-white font-semibold mb-2 font-['Outfit']">Examination Regulation Notice</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Registrations for backlog examinations are strictly governed by university ordinance. 
              Students must ensure fee verification before the closure date of the active session. 
              Submitting forged or duplicate bank receipts will result in immediate disqualification.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2 font-['Outfit']">Examination Helpdesk</h3>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                <span>+91 (011) 2584-9100 / Ext 402 (10 AM - 5 PM)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>backlog.support@university.edu</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>SSL 256-Bit Encrypted &bull; Audit Trail Logged</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2 font-['Outfit']">Active Policy Snapshot</h3>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              <li>Odd session covers Sem 1, 3, 5, 7 backlogs only.</li>
              <li>Even session covers Sem 2, 4, 6, 8 backlogs only.</li>
              <li>Theory subjects capped dynamically per admin policy.</li>
              <li>Non-theory subjects (Labs/Viva) have unlimited selection.</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} Central University Examination Controller. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <span>Ordinance Clause 14(B)</span>
            <span>&bull;</span>
            <span>v1.0.4 Production Build</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
