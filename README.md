# Academic Resource Management Portal

Built by **Harsh Parmar**

## Overview
The Academic Resource Management Portal is a comprehensive, full-stack digital library designed for educational institutions to securely manage, organize, and distribute academic materials. The platform streamlines the sharing of Previous Year Question Papers (PYQs), lecture notes, syllabuses, lab manuals, and external resources, ensuring students have access to the materials they need while providing administrators with robust management tools.

Whether you are a student preparing for exams, a teacher sharing vital notes, or a system administrator managing the university's academic hierarchy, this portal provides a seamless, fast, and secure experience.

---

## 🛠 Tech Stack & Technologies Used

This application is built with modern, scalable technologies to ensure high performance and seamless user experience:

- **Frontend Framework:** React 18 with TypeScript
- **Build Tool:** Vite for blazing-fast development and optimized production builds
- **Styling:** Tailwind CSS for rapid, utility-first styling and responsive design
- **Component Library:** shadcn/ui for accessible, customizable, and beautifully designed user interface components
- **Icons:** Lucide React for consistent and crisp vector icons
- **Backend & Database:** Firebase
  - **Firebase Authentication:** Handles secure user login via Google
  - **Cloud Firestore:** A NoSQL cloud database used to store academic configurations, subject data, resource metadata (PYQs, Notes), and admin user roles. Protected by robust, attribute-based access control (ABAC) security rules.
  - **Firebase Cloud Storage:** Securely stores the physical files (PDFs, Documents) uploaded by the staff and admins.
- **Routing:** React Router DOM (v6) for seamless Single Page Application (SPA) navigation.
- **Date Formatting:** `date-fns` for human-readable date and time formats.
- **File Handling:** Built-in DOM APIs for handling secure file uploads and client-side CSV parsing/generation for bulk actions.

---

## 📂 Folder Structure

The repository is organized to promote maintainability, separation of concerns, and ease of navigation:

```text
/
├── public/                 # Static assets (favicons, etc.)
├── src/                    # Main source code directory
│   ├── components/         # Reusable UI components
│   │   ├── layout/         # Layout wrappers (Navbar, Sidebar)
│   │   ├── pyq/            # Components specific to resource cards and lists
│   │   └── ui/             # Generic shadcn UI components (Buttons, Inputs, Dialogs)
│   ├── hooks/              # Custom React Hooks
│   │   ├── useAuth.ts            # Authentication state and role management
│   │   ├── useAcademicConfig.ts  # Fetches and manages dynamic academic dropdowns
│   │   └── useSubjects.ts        # Manages the fetching and caching of subjects
│   ├── lib/                # Utility functions and external integrations
│   │   ├── firebase.ts     # Firebase initialization and service exports
│   │   └── utils.ts        # Helper functions (e.g., Tailwind class merging `cn()`)
│   ├── pages/              # Top-level Page Components (Routes)
│   │   ├── App.tsx               # Main Dashboard (Student View)
│   │   ├── Login.tsx             # Authentication Page
│   │   ├── AdminDashboard.tsx    # Admin System Overview & Stats
│   │   ├── AdminStaff.tsx        # Staff & Role Management (Super Admin)
│   │   ├── AdminSubjects.tsx     # Subject Configuration & Upload
│   │   ├── AdminSettings.tsx     # Academic Config (Departments, Courses, etc.)
│   │   ├── AdminActivity.tsx     # Activity Logs & History
│   │   ├── AdminUpload.tsx       # File Upload Interface (Staff/Admin)
│   │   └── AdminAllPYQs.tsx      # Master view of all uploaded resources
│   ├── types/              # Global TypeScript Interfaces and Types
│   ├── index.css           # Global Tailwind CSS styles and custom theme variables
│   └── main.tsx            # React application entry point
├── .env.example            # Environment variables template
├── components.json         # shadcn UI configuration
├── firebase-applet-config.json # Firebase connection details
├── firestore.rules         # Firebase Security Rules (ABAC)
├── package.json            # NPM dependencies and scripts
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build configuration
```

---

## 🎯 Features & How to Use the App

The application serves three primary types of users:

### 🎓 1. For Students

The primary consumer of the application. Students can seamlessly browse and access materials required for their courses.

**Features:**
- **Resource Browsing:** View a rich grid of available academic resources.
- **Advanced Filtering:** Use dropdowns to filter resources by Department, Course, Year, Semester, and Document Type (e.g., PYQ, Notes, Syllabus, Lab Manual).
- **Instant Search:** Quickly find resources by searching for the Subject Code or Subject Name.
- **One-Click Download:** Download resources directly to their device. The interface shows the file size, uploader information, and upload date.
- **Authentication:** Secure login using their Google account to track preferences and ensure institutional access constraints (if configured).

**How to Use:**
1. Open the application link and sign in with your Google account.
2. You will land on the **Dashboard**.
3. Use the filters at the top of the page (Department, Course, Year) to narrow down the resources.
4. Click the "Download" button on any resource card to save the file.

---

### 👨‍🏫 2. For Teachers & Staff (Department Admins)

Staff members are responsible for populating the platform with relevant academic resources for their respective departments.

**Features:**
- **Secure Authentication:** Staff accounts are explicitly authorized by Super Admins.
- **Resource Uploading:** Upload PDFs and materials directly to the cloud. Staff can assign resources to specific Subjects, Document Types, Exam Types, and Exam Years.
- **Department Isolation:** Staff members are restricted to managing materials only for the departments they are assigned to, preventing clutter and accidental overrides.
- **Manage Own Uploads:** Staff can view, edit metadata, and delete the materials they have uploaded.
- **Personal Activity History:** View a personal log of all historical uploads to track contributions.

**How to Use:**
1. Log in with your authorized Google account.
2. Access the **Admin Panel** from the navigation menu.
3. Navigate to **Upload Material** to add new PDFs, syllabuses, or notes. Fill in the subject details and hit upload.
4. Go to **Dashboard** to view statistics about your specific uploads.

---

### 👑 3. For Super Admins

Super Admins have complete oversight, configuration control, and auditing capabilities over the entire platform.

**Features:**
- **Global Dashboard:** View system-wide statistics, including total users, total staff, and total materials uploaded.
- **Staff Management:** Add new staff members, assign them to specific departments, and revoke access if necessary.
- **Academic Configuration Engine:** Instead of hard-coded values, Super Admins can dynamically add, edit, or remove Departments, Courses, Years, and Semesters from the **Settings** page. This makes the app highly adaptable to any university's structure.
- **Subject Management:** Create and manage the master list of all academic subjects.
- **Bulk CSV Upload:** Upload hundreds of subjects at once via CSV templates, saving hours of manual data entry.
- **Master Resource Management:** Access the **All Resources** tab to view, search, edit, or delete ANY file uploaded by ANY staff member.
- **Activity Auditing (Logging):** Track system usage in the **Activity Log**. View exactly who uploaded what and when, categorized by Staff History or Student Logs.
- **Data Exporting:** Export massive lists of Subjects, All Resources, or Activity Logs directly to CSV format for external auditing or spreadsheet management.

**How to Use & Handle the System:**
1. Log in with the Super Admin Google account.
2. Initialize your university structure by navigating to **Academic Config (Settings)**. Add your Departments and Courses.
3. Go to **Subjects** and use the **Bulk CSV Upload** to populate the subject database quickly.
4. Navigate to **Staff Admin** to onboard new teachers, assigning them their respective departments.
5. Periodically check the **Activity Log** to monitor system health and staff engagement. Export logs to CSV if required by the university board.
6. In case of erroneous uploads by staff, use the **All Resources** tab to forcefully edit or delete the files.

---

## 🔒 Security & Architecture

The application implements enterprise-grade infrastructure:
- **Zero-Trust Firebase Rules:** No user can read or modify data they aren't supposed to. Super Admins have elevated DB privileges entirely gated by server-side verification, not client-side logic.
- **Data Integrity:** Only authorized file types and sizes are allowed. Complex validation enforces strict schema boundaries on every upload.
- **Real-time Syncing:** Data changes (like adding a new subject) are instantly propagated to all users seamlessly without requiring a page refresh.

---
*Built with ❤️ for better education.*
