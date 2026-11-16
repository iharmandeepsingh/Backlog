import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import ExamRegistrationPage from './pages/ExamRegistrationPage';
import AdminDashboard from './pages/AdminDashboard';
import PrintReceipt from './components/PrintReceipt';

function App() {
  const { isAuthenticated, isStudent, isAdmin, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [printingRegistration, setPrintingRegistration] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-medium text-slate-300">Connecting to Examination Portal...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated view
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-between">
        <header className="bg-slate-900/80 border-b border-slate-800 py-3 px-6 text-center text-xs font-semibold text-slate-400">
          Central University Examination Controller &bull; Backlog Examination Registration System
        </header>

        <main className="flex-1 flex items-center justify-center">
          {authView === 'login' ? (
            <LoginPage onSwitchToRegister={() => setAuthView('register')} />
          ) : (
            <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
          )}
        </main>

        <Footer />
      </div>
    );
  }

  // Handle Printable Receipt View
  if (printingRegistration) {
    return (
      <div className="min-h-screen bg-slate-100 py-8 px-4">
        <PrintReceipt
          registration={printingRegistration}
          onBack={() => setPrintingRegistration(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar activeTab={currentTab} setActiveTab={setCurrentTab} />

      <main className="flex-1">
        {/* STUDENT VIEWS */}
        {isStudent && (
          <>
            {(currentTab === 'dashboard' || currentTab === 'history') && (
              <StudentDashboard
                onNavigateToRegister={() => setCurrentTab('register')}
                onSelectRegistrationToPrint={(reg) => setPrintingRegistration(reg)}
              />
            )}

            {currentTab === 'register' && (
              <ExamRegistrationPage
                onRegistrationSuccess={(reg) => {
                  setPrintingRegistration(reg);
                  setCurrentTab('dashboard');
                }}
                onCancel={() => setCurrentTab('dashboard')}
              />
            )}
          </>
        )}

        {/* ADMIN VIEWS */}
        {isAdmin && (
          <>
            {currentTab === 'admin-dashboard' && (
              <AdminDashboard
                initialTab="overview"
                onSelectRegistrationToPrint={(reg) => setPrintingRegistration(reg)}
              />
            )}
            {currentTab === 'admin-registrations' && (
              <AdminDashboard
                initialTab="registrations"
                onSelectRegistrationToPrint={(reg) => setPrintingRegistration(reg)}
              />
            )}
            {currentTab === 'admin-sessions' && (
              <AdminDashboard
                initialTab="sessions"
                onSelectRegistrationToPrint={(reg) => setPrintingRegistration(reg)}
              />
            )}
            {currentTab === 'admin-config' && (
              <AdminDashboard
                initialTab="config"
                onSelectRegistrationToPrint={(reg) => setPrintingRegistration(reg)}
              />
            )}
            {currentTab === 'admin-subjects' && (
              <AdminDashboard
                initialTab="subjects"
                onSelectRegistrationToPrint={(reg) => setPrintingRegistration(reg)}
              />
            )}
            {currentTab === 'admin-audit' && (
              <AdminDashboard
                initialTab="audit"
                onSelectRegistrationToPrint={(reg) => setPrintingRegistration(reg)}
              />
            )}
            {currentTab === 'dashboard' && (
              <AdminDashboard
                initialTab="overview"
                onSelectRegistrationToPrint={(reg) => setPrintingRegistration(reg)}
              />
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
