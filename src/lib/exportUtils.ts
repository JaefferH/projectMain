import Papa from 'papaparse';
import { useDataStore } from '../store/useDataStore';

export const exportStudentsToCSV = () => {
  const { students } = useDataStore.getState();

  const csvData = students.map(s => ({
    'Student ID': s.registrationNumber,
    'Full Name': s.fullName,
    'Phone': s.phone,
    'Address': s.address,
    'Enrolled Courses (IDs)': s.enrolledCourseIds.join(', '),
    'Total Fee': s.totalFee,
    'Amount Paid': s.amountPaid,
    'Balance': s.totalFee - s.amountPaid
  }));

  const csv = Papa.unparse(csvData);
  downloadFile(csv, 'students_export.csv', 'text/csv');
};

export const exportTeachersToCSV = () => {
  const { teachers } = useDataStore.getState();

  const csvData = teachers.map(t => ({
    'Teacher ID': t.id,
    'Full Name': t.fullName,
    'Username': t.username,
    'Contact': t.contact,
    'National ID': t.nationalId,
    'Base Salary': t.baseSalary,
    'Assigned Courses (IDs)': t.assignedCourseIds.join(', ')
  }));

  const csv = Papa.unparse(csvData);
  downloadFile(csv, 'teachers_export.csv', 'text/csv');
};

const downloadFile = (content: string, fileName: string, contentType: string) => {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
};
