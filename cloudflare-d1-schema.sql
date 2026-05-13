CREATE TABLE IF NOT EXISTS pyqs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  examType TEXT,
  examYear TEXT,
  department TEXT NOT NULL,
  course TEXT NOT NULL,
  semester TEXT NOT NULL,
  subject TEXT NOT NULL,
  subjectCode TEXT NOT NULL,
  status TEXT NOT NULL,
  documentUrl TEXT NOT NULL,
  documentType TEXT NOT NULL,
  fileSize INTEGER,
  uploadedBy TEXT,
  uploaderEmail TEXT,
  uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  verifiedBy TEXT,
  verifiedAt DATETIME
);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  department TEXT NOT NULL,
  semester TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  userEmail TEXT,
  action TEXT NOT NULL,
  targetId TEXT,
  targetType TEXT,
  details TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
