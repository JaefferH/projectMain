import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { checkRedisHealth } from "@config/redis";
import { env } from "@config/env";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File DB Helper
const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function readJson(file: string, fallback: any = []) {
  const fp = path.join(dataDir, file);
  if (!fs.existsSync(fp)) {
    if (fallback && Array.isArray(fallback) && fallback.length > 0) {
      try { fs.writeFileSync(fp, JSON.stringify(fallback, null, 2), "utf8"); } catch {}
    }
    return fallback;
  }
  try {
    const data = JSON.parse(fs.readFileSync(fp, "utf8"));
    if (Array.isArray(data) && data.length === 0 && Array.isArray(fallback) && fallback.length > 0) {
      try { fs.writeFileSync(fp, JSON.stringify(fallback, null, 2), "utf8"); } catch {}
      return fallback;
    }
    return data;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, data: any) {
  const fp = path.join(dataDir, file);
  try {
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error(`Error saving ${file}:`, e);
  }
}

// Initial default items
const defaultAdmins = [
  { id: 'admin_1', nationalId: 'MA001', fullName: 'Master Admin', fathersName: 'Admin', phone: '+251 900 000 000', address: 'Headquarters', email: 'admin@madrasah.edu.et', username: 'admin', password: 'newAdmin@123', role: 'Admin' },
  { id: 'admin_2', nationalId: 'MA002', fullName: 'Mudir / Principal', fathersName: 'Admin', phone: '+251 900 000 001', address: 'Main Campus', email: 'mudir@madrasah.edu.et', username: 'mudir', password: 'admin123', role: 'Admin' }
];

const defaultTeachers = [
  { id: 'tch_1', fullName: 'Ustaz Ali', fathersName: 'Hassan', contact: '+251 922 111 222', nationalId: 'T001', baseSalary: 5000, assignedCourseIds: ['crs_1', 'crs_2'], username: 'teacher1', password: 'password123', monthlySalaries: {} },
  { id: 'tch_2', fullName: 'Ustadh Jaffer', fathersName: 'Hussein', contact: '+251 922 333 444', nationalId: 'T002', baseSalary: 6000, assignedCourseIds: ['crs_3'], username: 'teacher2', password: 'password123', monthlySalaries: {} }
];

const defaultStudents = [
  { id: 'stu_1', registrationNumber: 'SBI0001', username: 'student1', fullName: 'Bilal Ibrahim', fathersName: 'Ibrahim', gender: 'Male', dob: '2010-05-15', address: 'Addis Ababa', contactPhone: '+251 911 000 111', parentName: 'Ibrahim Ahmed', parentPhone: '+251 911 000 222', enrolledCourseIds: ['crs_1', 'crs_2'], password: 'password123', status: 'Active' },
  { id: 'stu_2', registrationNumber: 'SBI0002', username: 'student2', fullName: 'Fatima Zohra', fathersName: 'Omar', gender: 'Female', dob: '2011-08-20', address: 'Addis Ababa', contactPhone: '+251 911 333 444', parentName: 'Omar Hassan', parentPhone: '+251 911 333 555', enrolledCourseIds: ['crs_2', 'crs_3'], password: 'password123', status: 'Active' }
];

app.get(['/api/health', '/api/health/'], async (req, res) => {
  const redisHealthy = await checkRedisHealth();
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime(), redis: redisHealthy ? 'connected' : 'disconnected' });
});

// Authentication (Matching Postman Collection: POST /api/auth/login & POST /api/users/auth/login/)
const loginRoutes = ['/api/auth/login', '/api/auth/login/', '/api/users/auth/login', '/api/users/auth/login/'];
app.post(loginRoutes, (req, res) => {
  const { username, password } = req.body || {};
  const cleanUsername = (username || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanUsername || !cleanPassword) {
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password.'
    });
  }

  const admins = readJson('admins.json', defaultAdmins);
  const teachers = readJson('teachers.json', defaultTeachers);
  const students = readJson('students.json', defaultStudents);

  // 1. Check Admin Account
  const foundAdmin = admins.find((a: any) => (a.username || '').toLowerCase() === cleanUsername);
  const isAdminUsername = cleanUsername === 'admin' || cleanUsername === 'mudir' || cleanUsername === 'abuki' || !!foundAdmin;

  if (isAdminUsername) {
    const adminRecord = foundAdmin || admins[0] || defaultAdmins[0];
    const expectedPassword = (adminRecord.password || 'admin123').trim();

    if (cleanPassword === expectedPassword) {
      const user = {
        id: adminRecord.id || 'admin_1',
        username: adminRecord.username || username || 'admin',
        role: 'ADMIN',
        roles: ['SUPER_ADMIN'],
        name: adminRecord.fullName || 'Master Admin',
        email: adminRecord.email || 'admin@madrassa.local'
      };
      return res.json({
        success: true,
        message: 'Login successful',
        accessToken: 'mock-access-token-12345',
        refreshToken: 'mock-refresh-token-12345',
        user,
        data: { accessToken: 'mock-access-token-12345', refreshToken: 'mock-refresh-token-12345', user }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }
  }

  // 2. Check Teacher Account
  const foundTeacher = teachers.find((t: any) => (t.username || '').toLowerCase() === cleanUsername);
  const isTeacherUsername = cleanUsername === 'teacher1' || cleanUsername === 'teacher2' || cleanUsername.startsWith('teacher') || !!foundTeacher;

  if (isTeacherUsername) {
    const teacherRecord = foundTeacher || teachers[0] || defaultTeachers[0];
    const expectedPassword = (teacherRecord.password || 'password123').trim();

    if (cleanPassword === expectedPassword) {
      const user = {
        id: teacherRecord.id || (cleanUsername === 'teacher2' ? 'tch_2' : 'tch_1'),
        username: teacherRecord.username || username || 'teacher1',
        role: 'TEACHER',
        roles: ['TEACHER'],
        name: teacherRecord.fullName || (cleanUsername === 'teacher2' ? 'Ustadh Jaffer' : 'Ustaz Ali'),
        email: `${username || 'teacher'}@madrassa.local`
      };
      return res.json({
        success: true,
        message: 'Login successful',
        accessToken: 'mock-access-token-12345',
        refreshToken: 'mock-refresh-token-12345',
        user,
        data: { accessToken: 'mock-access-token-12345', refreshToken: 'mock-refresh-token-12345', user }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }
  }

  // 3. Check Student Account
  const foundStudent = students.find((s: any) => 
    (s.registrationNumber || '').toLowerCase() === cleanUsername || 
    (s.username || '').toLowerCase() === cleanUsername ||
    (s.id || '').toLowerCase() === cleanUsername ||
    (s.fullName || '').toLowerCase() === cleanUsername
  );
  const isStudentUsername = cleanUsername === 'student' || cleanUsername === 'student1' || cleanUsername === 'sbi0001' || cleanUsername.startsWith('stu') || !!foundStudent;

  if (isStudentUsername) {
    const studentRecord = foundStudent || students[0] || defaultStudents[0];
    const expectedPassword = (studentRecord.password || 'password123').trim();

    if (cleanPassword === expectedPassword) {
      const user = {
        id: studentRecord.id || 'stu_1',
        username: studentRecord.registrationNumber || studentRecord.username || username || 'student1',
        role: 'STUDENT',
        roles: ['STUDENT'],
        name: studentRecord.fullName || 'Bilal Ibrahim',
        email: `${username || 'student'}@madrassa.local`
      };
      return res.json({
        success: true,
        message: 'Login successful',
        accessToken: 'mock-access-token-12345',
        refreshToken: 'mock-refresh-token-12345',
        user,
        data: { accessToken: 'mock-access-token-12345', refreshToken: 'mock-refresh-token-12345', user }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }
  }

  // 4. Default Invalid Credentials
  return res.status(401).json({
    success: false,
    message: 'Invalid username or password.'
  });
});

// Refresh & Logout Tokens (Postman Collection)
app.post(['/api/auth/refresh', '/api/auth/refresh/', '/api/users/auth/refresh/'], (req, res) => {
  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now()
    }
  });
});

app.post(['/api/auth/logout', '/api/auth/logout/'], (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get(['/api/auth/me', '/api/auth/me/'], (req, res) => {
  const admins = readJson('admins.json', defaultAdmins);
  res.json({
    success: true,
    message: 'User profile retrieved successfully',
    data: {
      id: admins[0].id,
      username: admins[0].username,
      email: admins[0].email,
      roles: [{ id: 'role_1', name: 'SUPER_ADMIN' }],
      profileType: 'ADMIN',
      profile: {
        id: admins[0].id,
        fullName: admins[0].fullName,
        phone: admins[0].phone,
        email: admins[0].email,
      }
    }
  });
});

// Postman Collection Organizations & Branches
app.get(['/api/organizations', '/api/organizations/'], (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'org_1', name: 'Al Imam Hassan Mosque & Madereesa', code: 'IHM', phone: '+251 911 234 567', email: 'info@madrassa.com', address: 'Kolfe, Addis Ababa' }
    ]
  });
});

app.get(['/api/branches', '/api/branches/'], (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'br_1', organizationId: 'org_1', name: 'Main Campus - Kolfe', code: 'IHM-MAIN', city: 'Addis Ababa', isMainCampus: true }
    ]
  });
});

// Academic Years & Terms (Postman Collection)
app.get(['/api/academic-years', '/api/academic-years/'], (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'year_1', name: '2025/2026', startDate: '2025-09-01T00:00:00.000Z', endDate: '2026-09-30T00:00:00.000Z', isCurrent: true }
    ]
  });
});

app.get(['/api/academic-terms', '/api/academic-terms/'], (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'term_1', academicYearId: 'year_1', name: 'First Semester', type: 'SEMESTER_1', isCurrent: true }
    ]
  });
});

// Users, Roles & Permissions (Postman Collection)
app.get(['/api/users', '/api/users/'], (req, res) => {
  const admins = readJson('admins.json', defaultAdmins);
  const teachers = readJson('teachers.json', defaultTeachers);
  res.json({
    success: true,
    data: [...admins, ...teachers]
  });
});

app.get(['/api/roles', '/api/roles/'], (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'role_admin', name: 'ADMIN', description: 'Master System Administrator' },
      { id: 'role_teacher', name: 'TEACHER', description: 'Madrasah Ustadh / Teacher' },
      { id: 'role_student', name: 'STUDENT', description: 'Enrolled Madrasah Student' }
    ]
  });
});

app.get(['/api/permissions', '/api/permissions/'], (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'perm_1', name: 'user:create', description: 'Create user' },
      { id: 'perm_2', name: 'user:read', description: 'View user' },
      { id: 'perm_3', name: 'user:update', description: 'Update user' }
    ]
  });
});

// Initial Data GET Endpoints
app.get('/api/admins', (req, res) => res.json(readJson('admins.json', defaultAdmins)));
app.get('/api/teachers', (req, res) => res.json(readJson('teachers.json', defaultTeachers)));
app.get('/api/students', (req, res) => res.json(readJson('students.json', [])));
app.get('/api/courses', (req, res) => res.json(readJson('courses.json', [])));
app.get('/api/attendance', (req, res) => res.json(readJson('attendance.json', [])));
app.get('/api/teacher-attendance', (req, res) => res.json(readJson('teacher-attendance.json', [])));
app.get('/api/finance', (req, res) => res.json(readJson('finance.json', [])));
app.get('/api/grades', (req, res) => res.json(readJson('grades.json', [])));

// Teacher CRUD & Payroll
app.post('/api/teachers', (req, res) => {
  const teachers = readJson('teachers.json', defaultTeachers);
  const newTeacher = { id: req.body.id || `tch_${Date.now()}`, ...req.body };
  teachers.push(newTeacher);
  writeJson('teachers.json', teachers);
  res.json(newTeacher);
});

app.put('/api/teachers/:id', (req, res) => {
  let teachers = readJson('teachers.json', defaultTeachers);
  let updatedItem = req.body;
  teachers = teachers.map((t: any) => t.id === req.params.id ? { ...t, ...updatedItem } : t);
  writeJson('teachers.json', teachers);
  res.json(updatedItem);
});

app.delete('/api/teachers/:id', (req, res) => {
  let teachers = readJson('teachers.json', defaultTeachers);
  teachers = teachers.filter((t: any) => t.id !== req.params.id);
  writeJson('teachers.json', teachers);
  res.json({ success: true, id: req.params.id });
});

app.put('/api/teachers/:id/salary', (req, res) => {
  let teachers = readJson('teachers.json', defaultTeachers);
  const { month, status, method } = req.body || {};
  let targetTeacher: any = null;

  teachers = teachers.map((t: any) => {
    if (t.id === req.params.id) {
      const salaries = t.monthlySalaries || {};
      salaries[month] = { status: status || 'Paid', method: method || 'Cash' };
      targetTeacher = { ...t, monthlySalaries: salaries };
      return targetTeacher;
    }
    return t;
  });

  writeJson('teachers.json', teachers);
  res.json(targetTeacher || { id: req.params.id, monthlySalaries: { [month]: { status: 'Paid', method } } });
});

app.put('/api/teachers/:id/attendance', (req, res) => {
  let tAtt = readJson('teacher-attendance.json', []);
  const records = req.body.records || [req.body];
  records.forEach((r: any) => {
    const idx = tAtt.findIndex((a: any) => a.teacherId === req.params.id && a.date === r.date);
    if (idx > -1) tAtt[idx] = r;
    else tAtt.push(r);
  });
  writeJson('teacher-attendance.json', tAtt);
  res.json(records);
});

// Student CRUD & Fee
app.post('/api/students', (req, res) => {
  const students = readJson('students.json', []);
  const newStudent = { id: req.body.id || `stu_${Date.now()}`, ...req.body };
  students.push(newStudent);
  writeJson('students.json', students);
  res.json(newStudent);
});

app.put(['/api/students/:id', '/api/students/:id/'], (req, res) => {
  let students = readJson('students.json', defaultStudents);
  const targetId = req.params.id;
  const updates = req.body || {};

  let found = false;
  students = students.map((s: any) => {
    if (s.id === targetId || (s.registrationNumber || '').toLowerCase() === (updates.registrationNumber || targetId || '').toLowerCase() || (s.username || '').toLowerCase() === (updates.username || targetId || '').toLowerCase() || (s.id === 'stu_1' && (targetId === 'student1' || targetId === 'SBI0001'))) {
      found = true;
      return { ...s, ...updates, id: s.id };
    }
    return s;
  });

  if (!found && updates) {
    students.push({ id: targetId || `stu_${Date.now()}`, ...updates });
  }

  writeJson('students.json', students);
  const updatedStudent = students.find((s: any) => s.id === targetId || s.registrationNumber === updates.registrationNumber) || updates;
  res.json(updatedStudent);
});

app.delete('/api/students/:id', (req, res) => {
  let students = readJson('students.json', []);
  students = students.filter((s: any) => s.id !== req.params.id);
  writeJson('students.json', students);
  res.json({ success: true });
});

app.put('/api/students/:id/fees', (req, res) => {
  let students = readJson('students.json', []);
  const { fees } = req.body || {};
  let updatedStudent: any = null;

  students = students.map((s: any) => {
    if (s.id === req.params.id) {
      updatedStudent = { ...s, monthlyFees: fees || s.monthlyFees };
      return updatedStudent;
    }
    return s;
  });

  writeJson('students.json', students);
  res.json({ student: updatedStudent, attendanceSaved: [] });
});

app.put('/api/students/:id/attendance', (req, res) => {
  let attendance = readJson('attendance.json', []);
  const records = req.body.records || [req.body];

  records.forEach((r: any) => {
    const key = `${r.studentId}_${r.courseId}_${r.date}`;
    const idx = attendance.findIndex((a: any) => `${a.studentId}_${a.courseId}_${a.date}` === key);
    if (idx > -1) attendance[idx] = r;
    else attendance.push(r);
  });

  writeJson('attendance.json', attendance);
  res.json(records);
});

// Explicit Admin Update Handler
app.put(['/api/admins/:id', '/api/admins/:id/'], (req, res) => {
  let admins = readJson('admins.json', defaultAdmins);
  const targetId = req.params.id;
  const updates = req.body || {};

  let found = false;
  admins = admins.map((a: any) => {
    if (a.id === targetId || (a.username || '').toLowerCase() === (updates.username || targetId || '').toLowerCase() || a.username === 'admin') {
      found = true;
      return { ...a, ...updates, id: a.id };
    }
    return a;
  });

  if (!found && updates) {
    admins.push({ id: targetId || 'admin_1', ...updates });
  }

  writeJson('admins.json', admins);
  const updatedAdmin = admins.find((a: any) => a.id === targetId || a.username === 'admin') || updates;
  res.json(updatedAdmin);
});

// Generic CRUD for Courses, Finance
['courses', 'finance'].forEach((entity) => {
  app.post(`/api/${entity}`, (req, res) => {
    const list = readJson(`${entity}.json`, []);
    const newItem = { id: req.body.id || `${entity}_${Date.now()}`, ...req.body };
    list.push(newItem);
    writeJson(`${entity}.json`, list);
    res.json(newItem);
  });

  app.put(`/api/${entity}/:id`, (req, res) => {
    let list = readJson(`${entity}.json`, []);
    list = list.map((item: any) => item.id === req.params.id ? { ...item, ...req.body } : item);
    writeJson(`${entity}.json`, list);
    res.json({ id: req.params.id, ...req.body });
  });

  app.delete(`/api/${entity}/:id`, (req, res) => {
    let list = readJson(`${entity}.json`, []);
    list = list.filter((item: any) => item.id !== req.params.id);
    writeJson(`${entity}.json`, list);
    res.json({ success: true, id: req.params.id });
  });
});

export default app;