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

// Authentication (Unified Simple & Direct Model)
const loginRoutes = [
  '/api/auth/login', '/api/auth/login/',
  '/api/v1/auth/login', '/api/v1/auth/login/',
  '/api/users/auth/login', '/api/users/auth/login/',
  '/api/v1/users/auth/login', '/api/v1/users/auth/login/'
];
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

// Postman & Simple Collection Organizations & Branches
app.get(['/api/organizations', '/api/organizations/', '/api/v1/organizations', '/api/v1/organizations/'], (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'org_1', name: 'Al Imam Hassan Mosque & Madereesa', code: 'IHM', phone: '+251 911 234 567', email: 'info@madrassa.com', address: 'Kolfe, Addis Ababa' }
    ]
  });
});

app.get(['/api/branches', '/api/branches/', '/api/v1/branches', '/api/v1/branches/'], (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'br_1', organizationId: 'org_1', name: 'Main Campus - Kolfe', code: 'IHM-MAIN', city: 'Addis Ababa', isMainCampus: true }
    ]
  });
});

// Academic Years & Terms
app.get(['/api/academic-years', '/api/academic-years/', '/api/v1/academic-years', '/api/v1/academic-years/'], (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'year_1', name: '2025/2026', startDate: '2025-09-01T00:00:00.000Z', endDate: '2026-09-30T00:00:00.000Z', isCurrent: true }
    ]
  });
});

app.get(['/api/academic-terms', '/api/academic-terms/', '/api/v1/academic-terms', '/api/v1/academic-terms/'], (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'term_1', academicYearId: 'year_1', name: 'First Semester', type: 'SEMESTER_1', isCurrent: true }
    ]
  });
});

// Subjects & Assignments
app.get(['/api/subjects', '/api/subjects/', '/api/v1/subjects', '/api/v1/subjects/'], (req, res) => {
  const courses = readJson('courses.json', []);
  res.json({ success: true, data: courses });
});

app.get(['/api/teacher-assignments', '/api/v1/teacher-assignments'], (req, res) => {
  const teachers = readJson('teachers.json', defaultTeachers);
  const assignments = teachers.flatMap((t: any) => (t.assignedCourseIds || []).map((cId: string) => ({
    id: `asgn_${t.id}_${cId}`,
    teacherId: t.id,
    teacherName: t.fullName,
    subjectId: cId
  })));
  res.json({ success: true, data: assignments });
});

app.get(['/api/student-enrollments', '/api/v1/student-enrollments'], (req, res) => {
  const students = readJson('students.json', defaultStudents);
  const enrollments = students.flatMap((s: any) => (s.enrolledCourseIds || []).map((cId: string) => ({
    id: `enr_${s.id}_${cId}`,
    studentId: s.id,
    studentName: s.fullName,
    registrationNumber: s.registrationNumber,
    subjectId: cId
  })));
  res.json({ success: true, data: enrollments });
});

// Unified Users Endpoint (Direct Clean Format)
app.get(['/api/users', '/api/users/', '/api/v1/users', '/api/v1/users/'], (req, res) => {
  const admins = readJson('admins.json', defaultAdmins);
  const teachers = readJson('teachers.json', defaultTeachers);
  const students = readJson('students.json', defaultStudents);

  const unifiedUsers = [
    ...admins.map((a: any) => ({ ...a, role: 'ADMIN' })),
    ...teachers.map((t: any) => ({ ...t, role: 'TEACHER' })),
    ...students.map((s: any) => ({ ...s, role: 'STUDENT' }))
  ];
  res.json({
    success: true,
    data: unifiedUsers
  });
});

app.get(['/api/roles', '/api/roles/', '/api/v1/roles', '/api/v1/roles/'], (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'role_admin', name: 'ADMIN', description: 'Master System Administrator' },
      { id: 'role_teacher', name: 'TEACHER', description: 'Madrasah Ustadh / Teacher' },
      { id: 'role_student', name: 'STUDENT', description: 'Enrolled Madrasah Student' }
    ]
  });
});

app.get(['/api/permissions', '/api/permissions/', '/api/v1/permissions', '/api/v1/permissions/'], (req, res) => {
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
app.get(['/api/admins', '/api/v1/admins'], (req, res) => res.json(readJson('admins.json', defaultAdmins)));
app.get(['/api/teachers', '/api/v1/teachers'], (req, res) => res.json(readJson('teachers.json', defaultTeachers)));
app.get(['/api/students', '/api/v1/students'], (req, res) => res.json(readJson('students.json', defaultStudents)));
app.get(['/api/courses', '/api/v1/courses'], (req, res) => res.json(readJson('courses.json', [])));
app.get(['/api/attendance', '/api/v1/attendance'], (req, res) => res.json(readJson('attendance.json', [])));
app.get(['/api/teacher-attendance', '/api/v1/teacher-attendance'], (req, res) => res.json(readJson('teacher-attendance.json', [])));
app.get(['/api/finance', '/api/v1/finance'], (req, res) => res.json(readJson('finance.json', [])));
app.get(['/api/grades', '/api/v1/grades'], (req, res) => res.json(readJson('grades.json', [])));

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

// Unified Users POST /api/users (Creation matching Postman collection)
app.post(['/api/users', '/api/users/'], (req, res) => {
  const { roleIds, profileData, username, email } = req.body || {};
  const isTeacher = (roleIds || []).includes('role_teacher') || req.body.role === 'TEACHER';
  const isStudent = (roleIds || []).includes('role_student') || req.body.role === 'STUDENT';

  if (isTeacher) {
    const teachers = readJson('teachers.json', defaultTeachers);
    const newTeacher = { id: `tch_${Date.now()}`, fullName: profileData?.fullName || req.body.fullName || 'Ustadh New', username: username || `teacher_${Date.now()}`, password: 'password123', ...profileData, ...req.body };
    teachers.push(newTeacher);
    writeJson('teachers.json', teachers);
    return res.json({ success: true, message: 'Teacher created successfully', data: newTeacher });
  } else if (isStudent) {
    const students = readJson('students.json', defaultStudents);
    const newStudent = { id: `stu_${Date.now()}`, fullName: profileData?.fullName || req.body.fullName || 'Student New', registrationNumber: profileData?.registrationNumber || `SBI${Date.now().toString().slice(-4)}`, password: 'password123', ...profileData, ...req.body };
    students.push(newStudent);
    writeJson('students.json', students);
    return res.json({ success: true, message: 'Student created successfully', data: newStudent });
  } else {
    const admins = readJson('admins.json', defaultAdmins);
    const newAdmin = { id: `admin_${Date.now()}`, fullName: profileData?.fullName || req.body.fullName || 'Admin New', username: username || `admin_${Date.now()}`, password: 'admin123', ...profileData, ...req.body };
    admins.push(newAdmin);
    writeJson('admins.json', admins);
    return res.json({ success: true, message: 'Admin created successfully', data: newAdmin });
  }
});

app.get(['/api/users/:id', '/api/users/:id/'], (req, res) => {
  const targetId = req.params.id;
  const admins = readJson('admins.json', defaultAdmins);
  const teachers = readJson('teachers.json', defaultTeachers);
  const students = readJson('students.json', defaultStudents);

  const found = [...admins, ...teachers, ...students].find((u: any) => u.id === targetId || u.username === targetId || u.registrationNumber === targetId);
  res.json({ success: true, data: found || { id: targetId, username: targetId, role: 'USER' } });
});

app.patch(['/api/users/:id', '/api/users/:id/'], (req, res) => {
  res.json({ success: true, message: 'User updated successfully', data: { id: req.params.id, ...req.body } });
});

app.delete(['/api/users/:id', '/api/users/:id/permanent'], (req, res) => {
  res.json({ success: true, message: 'User deleted successfully' });
});

app.post('/api/users/bulk/delete', (req, res) => {
  res.json({ success: true, message: 'Bulk users soft deleted successfully' });
});

app.post('/api/users/bulk/permanent-delete', (req, res) => {
  res.json({ success: true, message: 'Bulk users permanently deleted' });
});

// Academics: Classrooms, Homeroom & Schedule
app.get(['/api/classrooms', '/api/classrooms/'], (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'class_1', name: 'Jedid Ba (Grade 1)', capacity: 35, branchId: 'br_1', academicYearId: 'year_1' },
      { id: 'class_2', name: 'Alif Ba (Grade 2)', capacity: 35, branchId: 'br_1', academicYearId: 'year_1' }
    ]
  });
});

app.post(['/api/classrooms', '/api/classrooms/'], (req, res) => {
  res.json({ success: true, data: { id: `class_${Date.now()}`, ...req.body } });
});

app.get(['/api/homeroom-teachers', '/api/homeroom-teachers/my-homeroom'], (req, res) => {
  res.json({ success: true, data: [{ id: 'hr_1', teacherId: 'tch_1', classroomId: 'class_1', classroomName: 'Jedid Ba (Grade 1)' }] });
});

app.post('/api/homeroom-teachers', (req, res) => {
  res.json({ success: true, data: { id: `hr_${Date.now()}`, ...req.body } });
});

// Students: Enrollments & Guardians
app.get(['/api/enrollments', '/api/enrollments/my-enrollments'], (req, res) => {
  const students = readJson('students.json', defaultStudents);
  res.json({ success: true, data: students.map((s: any) => ({ id: `enr_${s.id}`, studentId: s.id, studentName: s.fullName, registrationNumber: s.registrationNumber, classroomId: 'class_1' })) });
});

app.post(['/api/enrollments', '/api/enrollments/bulk'], (req, res) => {
  res.json({ success: true, message: 'Enrollments processed successfully', data: req.body });
});

app.get(['/api/guardians', '/api/guardians/my-guardians'], (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'g_1', fullName: 'Ibrahim Ahmed', phone: '+251 911 000 222', relationship: 'Father', studentId: 'stu_1' },
      { id: 'g_2', fullName: 'Omar Hassan', phone: '+251 911 333 555', relationship: 'Father', studentId: 'stu_2' }
    ]
  });
});

app.post(['/api/guardians', '/api/guardians/link'], (req, res) => {
  res.json({ success: true, message: 'Guardian created / linked successfully', data: { id: `g_${Date.now()}`, ...req.body } });
});

// Schedule & Timetables
app.get('/api/schedule-periods', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'p_1', name: 'Period 1', startTime: '08:00', endTime: '08:45' },
      { id: 'p_2', name: 'Period 2', startTime: '08:45', endTime: '09:30' }
    ]
  });
});

app.post('/api/schedule-periods/bulk', (req, res) => {
  res.json({ success: true, message: 'Schedule periods created in bulk', data: req.body });
});

app.get(['/api/timetable-entries', '/api/timetable-entries/my-timetable', '/api/timetable-entries/my-teacher-timetable'], (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'tt_1', dayOfWeek: 'MONDAY', period: 'Period 1', subject: 'Quran', classroom: 'Jedid Ba' },
      { id: 'tt_2', dayOfWeek: 'TUESDAY', period: 'Period 2', subject: 'Hadis', classroom: 'Jedid Ba' }
    ]
  });
});

app.post(['/api/timetable-entries', '/api/timetable-entries/bulk'], (req, res) => {
  res.json({ success: true, message: 'Timetable entries saved', data: req.body });
});

// Attendance Endpoints
app.get(['/api/student-attendance', '/api/student-attendance/my-attendance'], (req, res) => {
  const att = readJson('attendance.json', []);
  res.json({ success: true, data: att });
});

app.post('/api/student-attendance', (req, res) => {
  const att = readJson('attendance.json', []);
  const records = req.body.records || [req.body];
  records.forEach((r: any) => att.push(r));
  writeJson('attendance.json', att);
  res.json({ success: true, message: 'Student attendance saved', data: records });
});

app.get(['/api/staff-attendance', '/api/staff-attendance/my-attendance'], (req, res) => {
  const tAtt = readJson('teacher-attendance.json', []);
  res.json({ success: true, data: tAtt });
});

app.post(['/api/staff-attendance/check-in', '/api/staff-attendance/check-out'], (req, res) => {
  res.json({ success: true, message: 'Staff attendance check-in/out recorded' });
});

// Assessment & Report Cards
app.get(['/api/assessments', '/api/assessments/my-assessments', '/api/assessments/my-teacher-assessments'], (req, res) => {
  const grades = readJson('grades.json', []);
  res.json({ success: true, data: grades });
});

app.post('/api/assessments', (req, res) => {
  res.json({ success: true, message: 'Assessment created', data: { id: `ass_${Date.now()}`, ...req.body } });
});

app.post('/api/assessments/:id/results', (req, res) => {
  const grades = readJson('grades.json', []);
  const results = req.body.results || [];
  results.forEach((r: any) => grades.push(r));
  writeJson('grades.json', grades);
  res.json({ success: true, message: 'Assessment results saved' });
});

app.get(['/api/report-cards/my-report-card', '/api/report-cards/class-report-cards'], (req, res) => {
  res.json({
    success: true,
    data: {
      studentName: 'Bilal Ibrahim',
      registrationNumber: 'SBI0001',
      gpa: 3.8,
      grades: [
        { subject: 'Quran', quiz1: 10, quiz2: 10, midExam: 28, finalExam: 48, total: 96, grade: 'A+' },
        { subject: 'Hadis', quiz1: 9, quiz2: 10, midExam: 27, finalExam: 45, total: 91, grade: 'A' }
      ]
    }
  });
});

// Finance Endpoints (Categories, Structures, Invoices, Payments, Salaries, Revenues, Expenses)
app.get('/api/fee-categories', (req, res) => res.json({ success: true, data: [{ id: 'fc_1', name: 'Tuition Fee', amount: 500 }] }));
app.get('/api/fee-structures', (req, res) => res.json({ success: true, data: [{ id: 'fs_1', name: 'Monthly Tuition', amount: 500 }] }));
app.get(['/api/invoices', '/api/invoices/my-invoices'], (req, res) => res.json({ success: true, data: [{ id: 'inv_1', studentName: 'Bilal Ibrahim', amount: 500, status: 'PAID' }] }));
app.get(['/api/payments', '/api/payments/my-payments'], (req, res) => res.json({ success: true, data: [{ id: 'pay_1', amount: 500, paymentMethod: 'CASH', date: '2025-08-01' }] }));
app.post('/api/payments', (req, res) => res.json({ success: true, message: 'Payment recorded', data: { id: `pay_${Date.now()}`, ...req.body } }));

app.get(['/api/salary-structures', '/api/salary-structures/my-salary'], (req, res) => res.json({ success: true, data: [{ id: 'sal_1', basicSalary: 5000, currency: 'ETB' }] }));
app.get(['/api/salary-payments', '/api/salary-payments/my-payments'], (req, res) => res.json({ success: true, data: [{ id: 'sp_1', amount: 5000, status: 'PAID' }] }));

app.get(['/api/revenues', '/api/revenues/summary'], (req, res) => res.json({ success: true, data: [{ id: 'rev_1', category: 'Donations', amount: 50000 }] }));
app.get(['/api/expenses', '/api/expenses/summary'], (req, res) => res.json({ success: true, data: [{ id: 'exp_1', category: 'Utilities', amount: 3500 }] }));
app.get('/api/financial-reports/overview', (req, res) => res.json({ success: true, data: { totalRevenue: 150000, totalExpense: 45000, netBalance: 105000 } }));

// Communication & Announcements
app.get(['/api/announcements', '/api/announcements/my-announcements'], (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'anc_1', title: 'Parent-Teacher Meeting', content: 'Parent-teacher meeting this Friday at 3 PM', type: 'MEETING', priority: 'HIGH' }
    ]
  });
});

app.post('/api/announcements', (req, res) => res.json({ success: true, message: 'Announcement created', data: { id: `anc_${Date.now()}`, ...req.body } }));
app.post('/api/communication/send-guardian', (req, res) => res.json({ success: true, message: 'Message sent to guardian' }));

// Dashboard Overview
app.get(['/api/dashboard', '/api/dashboard/calendar'], (req, res) => {
  res.json({
    success: true,
    data: {
      totalStudents: 120,
      totalTeachers: 15,
      totalCourses: 8,
      attendanceRate: 96.5,
      recentAnnouncements: [{ title: 'Parent-Teacher Meeting', date: '2025-08-25' }]
    }
  });
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