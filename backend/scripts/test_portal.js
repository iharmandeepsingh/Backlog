const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Backlog Examination Portal End-to-End Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    const healthRes = await fetch(`${BASE_URL}/health`).then(r => r.json());
    assert(healthRes.status === 'ONLINE', 'API Health check is ONLINE');

    // 2. Student Login
    const stuLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'CS2022001', password: 'student123' })
    }).then(r => r.json());
    assert(stuLoginRes.success && stuLoginRes.token, 'Student (Rahul - CS2022001) login successful');
    const studentToken = stuLoginRes.token;
    const studentHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    };

    // 3. Admin Login
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: 'admin@university.edu', password: 'admin123' })
    }).then(r => r.json());
    assert(adminLoginRes.success && adminLoginRes.user.role === 'admin', 'Admin login successful');
    const adminToken = adminLoginRes.token;
    const adminHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    };

    // 4. Active Session
    const activeSessRes = await fetch(`${BASE_URL}/sessions/active`).then(r => r.json());
    assert(activeSessRes.success && activeSessRes.session.type === 'ODD', 'Active session is ODD semester session');

    // 5. Eligible Backlog Rule Check (Odd vs Even)
    const eligRes = await fetch(`${BASE_URL}/subjects/eligible-backlogs`, { headers: studentHeaders }).then(r => r.json());
    assert(eligRes.success, 'Fetched eligible backlog subjects for student');
    const eligibleSubjects = eligRes.eligibleSubjects;
    
    // Check that all eligible subjects have odd semesters
    const hasOnlyOdd = eligibleSubjects.every(s => s.semester % 2 !== 0);
    assert(hasOnlyOdd, `Odd Semester Session strictly permits only odd semester subjects (1, 3, 5, 7) - Found ${eligibleSubjects.length} subjects`);

    // 6. Test Theory Subject Limit Validation on Backend
    const theorySubs = eligibleSubjects.filter(s => s.isTheory);
    const nonTheorySubs = eligibleSubjects.filter(s => !s.isTheory);

    // Let's configure theory limit to 2 for strict test
    await fetch(`${BASE_URL}/config`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ maxTheorySubjects: 2 })
    });
    const confRes = await fetch(`${BASE_URL}/config`).then(r => r.json());
    assert(confRes.config.maxTheorySubjects === 2, 'Admin dynamically changed Theory Limit to 2');

    // Attempt to register 3 theory subjects -> Must Fail
    const failAttempt = await fetch(`${BASE_URL}/registrations`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        subjectIds: theorySubs.slice(0, 3).map(s => s._id),
        paymentMethod: 'ONLINE'
      })
    });
    const failData = await failAttempt.json();
    assert(failAttempt.status === 400 && failData.message.includes('Theory Limit Exceeded'), 'Backend strictly enforces theory limit rule (>2 theory subjects rejected with 400)');

    // Reset theory limit back to 4
    await fetch(`${BASE_URL}/config`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        maxTheorySubjects: 4,
        theoryFeePerSubject: 500,
        nonTheoryFeePerSubject: 300,
        baseRegistrationFee: 100
      })
    });

    // 7. Successful Online Registration with Real-Time Fee Calculation
    // Select 2 Theory subjects + 2 Non-Theory subjects
    // Expected fee: 2*500 + 2*300 + 100 = 1000 + 600 + 100 = 1700
    const chosenSubjects = [
      ...theorySubs.slice(0, 2),
      ...nonTheorySubs.slice(0, 2)
    ];

    const regAttempt = await fetch(`${BASE_URL}/registrations`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        subjectIds: chosenSubjects.map(s => s._id),
        paymentMethod: 'ONLINE'
      })
    });
    const regRes = await regAttempt.json();

    assert(regRes.success && regRes.registration, 'Student registration created successfully');
    const createdReg = regRes.registration;
    assert(createdReg.theoryCount === 2, 'Theory count is correctly recorded as 2');
    assert(createdReg.nonTheoryCount === 2, 'Non-theory count is correctly recorded as 2');
    assert(createdReg.feeBreakdown.totalFee === 1700, `Total Fee correctly calculated as ₹${createdReg.feeBreakdown.totalFee} (Expected ₹1700)`);

    // 8. Test Online Payment Gateway Verification
    const onlineVerifyAttempt = await fetch(`${BASE_URL}/registrations/verify-online-payment`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        registrationId: createdReg._id,
        razorpayOrderId: 'order_test_9921',
        razorpayPaymentId: 'pay_test_88192',
        razorpaySignature: 'sig_valid_1234'
      })
    });
    const onlineVerifyRes = await onlineVerifyAttempt.json();
    assert(onlineVerifyRes.success && onlineVerifyRes.registration.payment.status === 'VERIFIED', 'Online payment verified and confirmed on server');

    // 9. Duplicate Subject Registration Prevention Rule
    const dupAttempt = await fetch(`${BASE_URL}/registrations`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        subjectIds: [chosenSubjects[0]._id],
        paymentMethod: 'ONLINE'
      })
    });
    const dupData = await dupAttempt.json();
    assert(dupAttempt.status === 400 && dupData.message.includes('Duplicate Subject Registration'), 'Duplicate subject registration in same session rejected with 400');

    // 10. Admin Receipt Approval & Rejection Flow
    const allRegsRes = await fetch(`${BASE_URL}/registrations/all`, { headers: adminHeaders }).then(r => r.json());
    const pendingReg = allRegsRes.registrations.find(r => r.payment?.status === 'PENDING_VERIFICATION');
    assert(pendingReg !== undefined, 'Admin found registration with PENDING_VERIFICATION receipt');

    if (pendingReg) {
      const approveRes = await fetch(`${BASE_URL}/registrations/${pendingReg._id}/verify-payment`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({
          status: 'APPROVED',
          remarks: 'Bank transaction credit matched in SBI ledger.'
        })
      }).then(r => r.json());

      assert(approveRes.success && approveRes.registration.payment.status === 'VERIFIED', 'Admin successfully approved manual receipt with remarks');
    }

    // 11. Security Audit Trail Verification
    const auditRes = await fetch(`${BASE_URL}/admin/audit-logs`, { headers: adminHeaders }).then(r => r.json());
    assert(auditRes.success && auditRes.logs.length > 0, `Security audit trail contains ${auditRes.logs.length} logged events`);

    // 12. Dashboard Statistics
    const statsRes = await fetch(`${BASE_URL}/admin/stats`, { headers: adminHeaders }).then(r => r.json());
    assert(statsRes.success && statsRes.stats.totalRegistrations > 0, 'Admin dashboard KPI statistics loaded successfully');

    // 13. Export CSV Report
    const csvRes = await fetch(`${BASE_URL}/registrations/export-csv`, { headers: adminHeaders });
    const csvText = await csvRes.text();
    assert(csvRes.status === 200 && csvText.includes('Registration No,Roll Number'), 'Registration and payment report exported to CSV successfully');

    console.log(`\n🎉 ALL TESTS COMPLETED: ${passed} Passed, ${failed} Failed.`);
  } catch (error) {
    console.error('Test execution error:', error);
  }
}

runTests();
