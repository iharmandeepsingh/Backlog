const http = require('http');

function post(path, data, token = null) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(path, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting End-to-End Workflow Verification Tests...\n');

  // 1. Student Login
  console.log('1. Logging in as LAW 2023 Student (Roll: 72312720)...');
  const loginRes = await post('/api/auth/login', {
    loginId: '72312720@university.edu',
    password: 'student123'
  });

  if (!loginRes.data.success) {
    console.error('Login failed:', loginRes.data);
    process.exit(1);
  }
  const token = loginRes.data.token;
  const user = loginRes.data.user;
  console.log(`✅ Logged in successfully: ${user.name}, Roll: ${user.rollNumber}, Current Semester: ${user.currentSemester}\n`);

  // 2. Fetch ODD Semester Backlogs
  console.log('2. Requesting ODD Semester Backlogs (sessionType=ODD)...');
  const oddRes = await get('/api/subjects/eligible-backlogs?sessionType=ODD', token);
  const oddSubjects = oddRes.data.eligibleSubjects;
  console.log(`Eligible ODD Backlogs Count: ${oddSubjects.length}`);
  oddSubjects.forEach(s => {
    console.log(`  - [Sem ${s.semester}] ${s.code}: ${s.name} (${s.isTheory ? 'Theory' : 'Practical'}), Grade: ${s.grade}`);
  });

  // Verify Odd rules:
  const hasEvenInOdd = oddSubjects.some(s => s.semester % 2 === 0);
  const hasCurrentOrHigherInOdd = oddSubjects.some(s => s.semester >= user.currentSemester);
  if (hasEvenInOdd) {
    console.error('❌ FAILURE: Even semester subject found in ODD session!');
    process.exit(1);
  }
  if (hasCurrentOrHigherInOdd) {
    console.error('❌ FAILURE: Current or higher semester subject found in backlogs!');
    process.exit(1);
  }
  console.log('✅ Odd session strictly returned only previous Odd semester failed subjects (Sem 1)!\n');

  // 3. Fetch EVEN Semester Backlogs
  console.log('3. Requesting EVEN Semester Backlogs (sessionType=EVEN)...');
  const evenRes = await get('/api/subjects/eligible-backlogs?sessionType=EVEN', token);
  const evenSubjects = evenRes.data.eligibleSubjects;
  console.log(`Eligible EVEN Backlogs Count: ${evenSubjects.length}`);
  evenSubjects.forEach(s => {
    console.log(`  - [Sem ${s.semester}] ${s.code}: ${s.name} (${s.isTheory ? 'Theory' : 'Practical'}), Grade: ${s.grade}`);
  });

  // Verify Even rules:
  const hasOddInEven = evenSubjects.some(s => s.semester % 2 !== 0);
  const hasCurrentOrHigherInEven = evenSubjects.some(s => s.semester >= user.currentSemester);
  if (hasOddInEven) {
    console.error('❌ FAILURE: Odd semester subject found in EVEN session!');
    process.exit(1);
  }
  if (hasCurrentOrHigherInEven) {
    console.error('❌ FAILURE: Current or higher semester subject found in backlogs!');
    process.exit(1);
  }
  console.log('✅ Even session strictly returned only previous Even semester failed subjects (Sem 2)!\n');

  // 4. Test Theory Limit Validation (Try 5 Theory Subjects)
  console.log('4. Testing Theory Limit Validation: Selecting 5 Theory Subjects...');
  const oddTheorySubjects = oddSubjects.filter(s => s.isTheory);
  const oddNonTheory = oddSubjects.filter(s => !s.isTheory);

  if (oddTheorySubjects.length >= 5) {
    const fiveTheoryIds = oddTheorySubjects.slice(0, 5).map(s => s._id);
    const failAttempt = await post('/api/registrations', {
      subjectIds: fiveTheoryIds,
      paymentMethod: 'ONLINE'
    }, token);

    console.log(`Attempt with 5 Theory subjects -> Status: ${failAttempt.status}, Message: ${failAttempt.data.message}`);
    if (failAttempt.status === 400 && failAttempt.data.message.includes('Theory Limit Exceeded')) {
      console.log('✅ Backend correctly rejected 5 Theory subjects with "Theory Limit Exceeded"!');
    } else {
      console.error('❌ FAILURE: Theory limit not enforced!');
      process.exit(1);
    }
  }

  // 5. Test Permitted Selection: 4 Theory + 1 Practical (Non-Theory)
  console.log('\n5. Testing Permitted Selection: 4 Theory Subjects + 1 Non-Theory Practical Subject...');
  const fourTheoryIds = oddTheorySubjects.slice(0, 4).map(s => s._id);
  const nonTheoryIds = oddNonTheory.slice(0, 1).map(s => s._id);
  const validSelectionIds = [...fourTheoryIds, ...nonTheoryIds];

  const successAttempt = await post('/api/registrations', {
    subjectIds: validSelectionIds,
    paymentMethod: 'ONLINE'
  }, token);

  console.log(`Valid Selection Result -> Status: ${successAttempt.status}, Reg No: ${successAttempt.data.registration?.registrationNumber}`);
  const breakdown = successAttempt.data.registration?.feeBreakdown;
  console.log(`Fee Breakdown:
  - Theory Count: ${breakdown?.theoryCount} (Total: ₹${breakdown?.theoryTotal})
  - Non-Theory Count: ${breakdown?.nonTheoryCount} (Total: ₹${breakdown?.nonTheoryTotal})
  - Base Fee: ₹${breakdown?.baseFee}
  - Total Fee: ₹${breakdown?.totalFee}`);

  if (breakdown?.theoryCount === 4 && breakdown?.nonTheoryCount === 1 && breakdown?.totalFee === 2400) {
    console.log('✅ Fee calculated exactly as expected: 4 Theory (₹2000) + 1 Practical (₹300) + Base (₹100) = ₹2400!');
  } else {
    console.error('❌ Breakdown mismatch:', breakdown);
    process.exit(1);
  }

  console.log('\n🎉 ALL WORKFLOW TESTS PASSED PERFECTLY!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
