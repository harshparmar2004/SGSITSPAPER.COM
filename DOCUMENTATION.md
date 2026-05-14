# SGSITS PYQ Resource Hub Documentation

## 1. Overview & Problem Statement

**Problem**
Students at SGSITS (Shri Govindram Seksaria Institute of Technology and Science) often struggle to find authentic, organized, and reliable Previous Year Question Papers (PYQs), handwritten notes, syllabi, and lab manuals. These academic resources are typically scattered across WhatsApp groups, individual drive links, or hard drives, making access difficult during exam preparation. Furthermore, administrators lack a structured platform to efficiently collect, moderate, and track the usage of these academic resources.

**Solution**
The **SGSITS PYQ Resource Hub** is a centralized, cloud-based platform designed to solve this exact problem. It provides students with a single, highly searchable repository to fetch academic resources securely, while empowering college administrators to manage users, track downloads, review reported issues, and maintain high-quality academic documents through a role-based CMS (Content Management System).

---

## 2. Platform Architecture

The platform is designed around a modern web architecture, utilizing high-performance serverless tools for global scale and fast data retrieval.

*   **Frontend**: React (v18+) and Vite for fast client-side rendering.
*   **Styling**: Tailwind CSS for responsive and consistent design, paired with component-driven architecture.
*   **Database**: Firebase Cloud Firestore (NoSQL), strictly governed by Attribute-Based Access Control (ABAC) Rules.
*   **Storage**: Firebase Cloud Storage for secure document (PDF) hosting.
*   **Authentication**: Firebase Authentication using Google Sign-In with strict domain configurations.

---

## 3. Getting Started & Authentication

The platform utilizes a Role-Based Access Control (RBAC) model. All access begins with Google Authentication.

### How to Log In
1. Navigate to the landing page.
2. Click **"Student / Admin Login"** in the top navigation bar or **"Enter Student Hub"** on the hero banner.
3. Authenticate using your valid Google Account.
4. **Role Assignment:**
   * **Students:** By default, all authenticated users are granted `Student` access and routed to the PYQ Hub.
   * **Admins:** If your email matches an administrator list in the database, the system elevates your privileges and unlocks the `Admin Area`.

---

## 4. Student Guide: Using the PYQ Hub

The PYQ Hub is the primary interface for students to access study materials.

### Navigating Resource Categories
At the top of the interface, you can quickly toggle between resource categories:
*   **Previous Year Questions:** Historical exam papers.
*   **Handwritten Notes:** Verified student and faculty notes.
*   **Course Syllabus:** Official curriculum documents.
*   **Lab Manuals:** Practical session guides.
*   **Books & Resources:** Textbooks and additional reference material.

### Search and Filters
The system is built to minimize time-to-discovery:
1. **Search by Subject Code:** The quickest way to find a resource is to type the official subject code (e.g., *CS101*). 
2. **Contextual Filters:**
   * Select your **Course** (e.g., B.Tech, M.Tech) to narrow down the context.
   * Based on the course, select the corresponding **Department**.
   * Use **Year** and **Semester** filters for precise querying.
   * Depending on the category (e.g., PYQ), select the **Exam Type** (Mid Sem, End Sem).

### Downloading Resources
*   **Single Download:** Click the "Download" button next to any resource to fetch the PDF.
*   **Bulk ZIP Download:** When multiple items match your search filter, a "Download X Result(s) as ZIP" button appears. Clicking this will fetch all relevant PDFs, package them into a `.zip` file on your browser, and save them in one click.

### Reporting Issues
If a file has missing pages, incorrect information, or a broken link:
1. Click the **Report (Alert Icon)** next to the specific file.
2. Provide your Name, College ID, Branch, and select an Issue Category (e.g., Missing Pages).
3. Detail the problem in the description box and submit. Admins will review and rectify the file.

---

## 5. Administrator Guide: The Admin Dashboard

Administrators, depending on their tier (Super Admin, Staff, Department Admin), have access to powerful moderation tools via `/admin`.

### Dashboard Analytics
*   **Overview Map:** Visualize Total Uploads, Total Students, Downloads, and actively Reported Issues.
*   **Recent Activity:** Real-time stream of what documents were uploaded and by whom.

### Uploading Documents (`/admin/upload`)
The fastest way to contribute to the platform.
1. Assign basic metadata (Course, Department, Subject Code, Subject Name).
2. Select Document Type (PYQ, Notes, Syllabus, etc.).
3. Choose the *Upload Method*:
   * **File Upload:** Upload a PDF directly to the Cloud Storage. The system automatically normalizes the file name.
   * **Google Drive Link:** Provide a public viewing URL to save storage bandwidth.
4. Click **Upload to Hub**.

### Managing Content (`/admin/manage-pyqs` and `/admin/subject-pyqs`)
*   **Subject Configuration:** Admins can define the syllabus curriculum globally to ensure all uploads align with official subject codes.
*   **Replace Files:** If a document is out of date, admins can execute a hot-replace to overwrite the old PDF file pointer with a new URL or file without discarding the document's historical tracking.
*   **Delete Entries:** Safely remove invalid entries and clean up Cloud Storage references automatically.

### User Management (`/admin/students` & `/admin/staff`)
*   **Staff Insights:** Super Admins can track how effectively individual staff members and contributors are uploading materials.
*   **Manage Access:** Elevate specific Google Accounts to Admin status and restrict their rights to specific departments.

### Moderation via Reports (`/admin/reports`)
When students submit error reports on files:
1. Navigate to the **Reports** section.
2. Review the claim (e.g., "Page 3 is blurry").
3. Use the document quick-link to inspect the file.
4. Once the file is replaced via `Manage`, mark the report as **Resolved** or discard it.

---

## 6. Security and Compliance

The SGSITS PYQ Hub employs strict Firebase Security Rules directly on the database to ensure zero-trust interactions:

*   **Read Access:** Only authenticated users (`isSignedIn()`) can query and read academic documents.
*   **Write Access:** Strict Role-Based validation (`isAdmin()`). Students are mathematically barred from modifying `pyqs`, `subjects`, or `analytics`.
*   **Sanitization:** All uploaded filenames are stripped of special characters using regex to prevent path traversal attacks.
*   **Immutable Telemetry:** Analytics tracking (such as student download hits and contributor upload counts) are executed server-side via atomic increments (`FieldValue.increment()`) to prevent client-side manipulation.

---
*End of Documentation. Property of SGSITS PYQ Hub. Designed for secure and equitable access to academic material.*
