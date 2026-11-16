const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../frontend/src/pages/AdminDashboard.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Replace Header Card
const oldHeader = `<div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
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
      </div>`;

const newHeader = `<div className="bg-white rounded border border-slate-300 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-500">
              CENTRAL EXAMINATION CONTROL CONSOLE
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Backlog Examination Administration
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Logged in as <strong className="text-slate-900">{user?.name}</strong> &bull; Examination Controller Office
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => registrationService.exportCSV()}
            className="px-3.5 py-2 bg-[#1e3a8a] hover:bg-blue-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Registrations CSV</span>
          </button>

          <button
            onClick={loadAllAdminData}
            title="Refresh All Records"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>`;

if (content.includes(oldHeader)) {
  content = content.replace(oldHeader, newHeader);
  console.log('Replaced header successfully.');
} else {
  console.log('Old header exact match not found; performing regex replacement.');
  content = content.replace(/<div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900[\s\S]*?<\/div>\s*<\/div>/, newHeader);
}

// Replace all Outfit references
content = content.replaceAll("font-['Outfit']", '');

// Replace all rounded-2xl with rounded
content = content.replaceAll('rounded-2xl', 'rounded');
content = content.replaceAll('rounded-3xl', 'rounded');

// Replace active subtab color from indigo-600 to #1e3a8a
content = content.replaceAll("bg-indigo-600 text-white shadow-sm", "bg-[#1e3a8a] text-white shadow-xs");
content = content.replaceAll("bg-indigo-600", "bg-[#1e3a8a]");

// Replace backdrop-blur-sm
content = content.replaceAll('backdrop-blur-sm', '');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('AdminDashboard.jsx cleaned successfully.');
