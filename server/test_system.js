const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log("=== COMPREHENSIVE END-TO-END SYSTEM TEST SUITE ===");
  let passed = 0;
  let total = 0;

  async function assert(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
    }
  }

  // 1. Health Check
  await assert("GET /api/health", async () => {
    const res = await request({ host: '127.0.0.1', port: 5000, path: '/api/health', method: 'GET' });
    if (res.status !== 200 || res.body.status !== 'ok') throw new Error(`Status ${res.status}`);
  });

  // 2. Admin Auth
  await assert("POST /api/auth/login (Admin Login)", async () => {
    const res = await request({ host: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { username: 'admin', password: 'newAdmin@123' });
    if (res.status !== 200 || !res.body.accessToken) throw new Error(`Status ${res.status}`);
  });

  // 3. Teacher Auth
  await assert("POST /api/auth/login (Teacher Login)", async () => {
    const res = await request({ host: '127.0.0.1', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { username: 'teacher1', password: 'password123' });
    if (res.status !== 200 || !res.body.accessToken) throw new Error(`Status ${res.status}`);
  });

  // 4. Create & Get Students
  await assert("POST /api/students & GET /api/students", async () => {
    const newStu = { id: `stu_test_${Date.now()}`, fullName: 'Test Student', registrationNumber: 'REG-TEST-01', enrolledCourseIds: ['crs_1'], totalFee: 1500, amountPaid: 500 };
    const createRes = await request({ host: '127.0.0.1', port: 5000, path: '/api/students', method: 'POST', headers: { 'Content-Type': 'application/json' } }, newStu);
    if (createRes.status !== 200) throw new Error(`Create status ${createRes.status}`);

    const getRes = await request({ host: '127.0.0.1', port: 5000, path: '/api/students', method: 'GET' });
    if (getRes.status !== 200 || !Array.isArray(getRes.body) || !getRes.body.some(s => s.id === newStu.id)) {
      throw new Error(`Student persistence failed`);
    }
  });

  // 5. Create & Update Teacher Base & Payroll
  await assert("POST /api/teachers, PUT /api/teachers/:id/salary", async () => {
    const newTch = { id: `tch_test_${Date.now()}`, fullName: 'Test Teacher', nationalId: 'TCH-99', baseSalary: 4500, username: 'testteacher' };
    const createRes = await request({ host: '127.0.0.1', port: 5000, path: '/api/teachers', method: 'POST', headers: { 'Content-Type': 'application/json' } }, newTch);
    if (createRes.status !== 200) throw new Error(`Teacher create status ${createRes.status}`);

    const payRes = await request({ host: '127.0.0.1', port: 5000, path: `/api/teachers/${newTch.id}/salary`, method: 'PUT', headers: { 'Content-Type': 'application/json' } }, { month: 'September', status: 'Paid', method: 'Cash' });
    if (payRes.status !== 200 || !payRes.body.monthlySalaries || payRes.body.monthlySalaries.September.status !== 'Paid') {
      throw new Error(`Salary update failed`);
    }
  });

  // 6. Student Attendance
  await assert("PUT /api/students/:id/attendance & GET /api/attendance", async () => {
    const attRec = { id: 'att_1', studentId: 'stu_1', courseId: 'crs_1', date: '2026-08-11', status: 'Present' };
    const attRes = await request({ host: '127.0.0.1', port: 5000, path: '/api/students/stu_1/attendance', method: 'PUT', headers: { 'Content-Type': 'application/json' } }, { records: [attRec] });
    if (attRes.status !== 200) throw new Error(`Attendance put status ${attRes.status}`);

    const getAtt = await request({ host: '127.0.0.1', port: 5000, path: '/api/attendance', method: 'GET' });
    if (getAtt.status !== 200 || !Array.isArray(getAtt.body) || getAtt.body.length === 0) {
      throw new Error(`Attendance fetch failed`);
    }
  });

  // 7. Teacher Staff Attendance
  await assert("PUT /api/teachers/:id/attendance & GET /api/teacher-attendance", async () => {
    const tAttRec = { id: 'tatt_1', teacherId: 'tch_1', date: '2026-08-11', status: 'Present' };
    const tAttRes = await request({ host: '127.0.0.1', port: 5000, path: '/api/teachers/tch_1/attendance', method: 'PUT', headers: { 'Content-Type': 'application/json' } }, { records: [tAttRec] });
    if (tAttRes.status !== 200) throw new Error(`Teacher attendance status ${tAttRes.status}`);

    const getTAtt = await request({ host: '127.0.0.1', port: 5000, path: '/api/teacher-attendance', method: 'GET' });
    if (getTAtt.status !== 200 || !Array.isArray(getTAtt.body) || getTAtt.body.length === 0) {
      throw new Error(`Teacher attendance fetch failed`);
    }
  });

  // 8. Courses & Finance
  await assert("POST /api/courses & POST /api/finance", async () => {
    const crsRes = await request({ host: '127.0.0.1', port: 5000, path: '/api/courses', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { id: 'crs_test_1', name: 'Test Aqeedah', classroom: 'Room 101' });
    if (crsRes.status !== 200) throw new Error(`Course status ${crsRes.status}`);

    const finRes = await request({ host: '127.0.0.1', port: 5000, path: '/api/finance', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { id: 'fin_test_1', type: 'Income', category: 'Tuition', amount: 1500, date: '2026-08-11', description: 'Test payment' });
    if (finRes.status !== 200) throw new Error(`Finance status ${finRes.status}`);
  });

  console.log(`\n==================================================`);
  console.log(`TOTAL ASSERTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log(`==================================================`);

  if (passed === total) {
    console.log("🎉 ALL TESTS PASSED WITH ZERO ERRORS!");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
