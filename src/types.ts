export interface PYQ {
  id?: string;
  department: string;
  course: string;
  year: string;
  semester: string;
  subjectCode: string;
  subjectName: string;
  examType: string;
  month?: string;
  examYear?: string;
  session?: string;
  section?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: any; // Firestore Timestamp
  uploadedBy: string;
  documentType?: string; // 'PYQ' or 'Notes'
}

export const DOCUMENT_TYPES = [
  "PYQ",
  "Notes"
];

export const DEFAULT_DEPARTMENTS = [
  "Computer Engineering",
  "Information Technology",
  "Electronics and Telecommunication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Industrial and Production Engineering",
  "Biomedical Engineering"
];

export const DEFAULT_COURSES = [
  "B.Tech",
  "M.Tech",
  "MBA",
  "MCA",
  "B.Pharm",
  "M.Pharm"
];

export const YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year"
];

export const SEMESTERS = [
  "Sem 1", "Sem 2", "Sem 3", "Sem 4",
  "Sem 5", "Sem 6", "Sem 7", "Sem 8"
];

export const EXAM_TYPES = [
  "Mid Sem",
  "End Sem",
  "MHT"
];

export const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];
