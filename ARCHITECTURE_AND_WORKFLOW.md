# SGSITS PYQ Hub - Architecture & Workflow Documentation

This document outlines the entire architecture, connection map, codebase structure, and complete workflow of the SGSITS PYQ Hub application. 

## 1. Source and Libraries Used (Tech Stack)

The application is a modern Single Page Application (SPA) built using the React ecosystem and a Serverless Backend.

### Core Technologies:
* **Framework:** React 19
* **Language:** TypeScript 
* **Build Tool:** Vite 6
* **CSS Framework:** Tailwind CSS 4
* **Backend as a Service (BaaS):** Firebase SDK (v12)

### Key Dependencies & Libraries used:
* `react-router`: Core routing library to handle navigation across the app (Admin, App, Landing pages).
* `firebase`: Handles Authentication (Google Login), Firestore (NoSQL Database), and Object Storage (Firebase Storage for PDFs and documents).
* `lucide-react`: SVG icon library that provides modern and scalable icons for the UI.
* `motion` (`framer-motion`): Used for intricate layout animations and smooth UI transitions.
* `recharts`: Used for building analytical charts visible on the Admin Dashboard.
* `date-fns`: Helps format and manipulate timestamps easily.
* `tailwind-merge` & `clsx`: Used inside `src/lib/utils.ts` and `src/components/ui.tsx` to conditionally merge Tailwind CSS classes cleanly.

---

## 2. Codebase Architecture & Directory Structure

The source code sits inside the `src/` directory. Here is how the different pieces connect:

* **`src/main.tsx`**: The entry point of the application. It initializes the React root and wraps the app inside the router layout (`BrowserRouter`).
* **`src/App.tsx`**: The master Router file. It decides what component to render based on the URL. It splits the app into three main zones:
    1. Landing Page (`/`)
    2. Student View (`/hub`)
    3. Admin Area (`/admin/*`)
* **`src/types.ts`**: Contains all global TypeScript Interfaces (e.g., `PYQ`, `Report`) and constants (e.g., `DOCUMENT_TYPES`, `DEPARTMENTS`). Having this single source of truth ensures type safety across the repository.

### Component Breakdown
* **`src/pages/`**: Contains the full-page React components. 
    * `Landing.tsx`: The animated introduction page.
    * `StudentView.tsx`: The primary interface where students search, filter, and download PYQs.
    * `Admin*.tsx`: The granular views for Admins (Upload, Analytics, Activity, Reports, Student logs, Staff).
* **`src/components/`**: 
    * `AdminLayout.tsx`: A wrapper layout supplying the sidebar and structure exclusively for admin routes.
    * `ui.tsx`: A consolidated file containing reusable UI components (Buttons, Inputs, Modals, Badges) built with Tailwind.
* **`src/lib/`**: 
    * `firebase.ts`: The configuration file that establishes the handshake with Google Firebase. Initializes Auth, DB, and Storage.
    * `cache.ts`: Critical for performance. Implements `sessionStorage` to temporarily cache heavy Firestore collections so we don't query Firebase constantly, reducing the number of reads.
    * `handleFirestoreError.ts`: A centralized error catcher to log and throw standardized server errors.
* **`src/hooks/`**: 
    * `useAuth.ts`: The authentication lifeline. Listens to Google Login token changes, pulls the user's role from the `users` (or `admins`) collection, and returns boolean flags like `isAdmin` and `adminRole`.

---

## 3. The Application Workflow

Here is how the application runs practically when a user interacts with it:

### A. Authentication & Routing Workflow
1. A user arrives at the Landing Page (`/`). 
2. They click "Student / Admin Login". The `loginWithGoogle` function (from `firebase.ts`) pops up a Google Sign-in window.
3. Upon success, the listener in `useAuth.ts` triggers. It checks the logged-in email. 
4. **Role Determination:** 
   - If the email is `harshparma007@gmail.com` (or listed in the `admins` Firestore collection), the user is granted `adminRole: 'superadmin'` or `'department'`.
   - Normal users are handled as students.
5. Depending on the `isAdmin` flag, the Navbar will show a button to navigate to the **"Admin Area"**. Normal users are directed to the **"PYQ Hub"**.

### B. Student Workflow (The PYQ Hub)
1. **Fetching Data**: When `/hub` is mounted (`StudentView.tsx`), the app requests the PYQs. To be efficient, it triggers `getCachedCollection("pyqs")` which tries to pull from session storage first, or calls Firestore if not cached. 
2. **Filtering**: The frontend manages the UI state of dropdowns (Year, Semester, Department, Subject). Filtering is applied locally against the retrieved PYQ array to make searching instantaneous.
3. **Downloading**: When a user clicks a PYQ, the app creates a record in the `downloads` collection in Firestore tracking what was downloaded, by who, and when. It then redirects the user to the `fileUrl` (Firebase Storage link).
4. **Reporting**: If a link is broken, the user clicks "Report Issue". This writes a document to the `reports` collection.

### C. Admin Workflow (The Dashboard)
The Admin system is protected by the `AdminLayout` which ensures only authorized users see it. 

1. **Dashboard (`AdminDashboard.tsx`)**: The app calculates global stats (e.g., Total Uploads, Total Downloads, Active Subjects) from the cache.
2. **Uploading (`AdminUpload.tsx`)**: 
   - Admin attaches a PDF file.
   - The file is uploaded to **Firebase Storage** (`uploadBytesResumable`).
   - A download URL is generated by Firebase.
   - The app pushes a new document to the `pyqs` **Firestore collection** containing metadata (Subject, Year, Branch, Semester, `fileUrl`).
   - The UI invalidates cache using `clearCache("pyqs")` so the next read fetches fresh data.
3. **Management Interfaces**: 
   - **Manage PYQs / Subject PYQs**: Admins can view datatables of uploaded items and delete them. Doing so removes the file from Firebase Storage and drops its Firestore document.
   - **Analytics & Deep Dives**: Consumes the `downloads` and `pyqs` collections to visualize student behavior using `recharts`.
   - **Staff / Activity Tracking**: Superadmins can add sub-admins and assign them departments. `AdminActivity.tsx` pulls recent additions and log actions.

## 4. Connection Summary (How it's all tied together)
1. **React Router** is the skeleton that changes the view.
2. **Tailwind & Framer Motion** provide the skin and animations respectively.
3. **TypeScript** acts as the glue that prevents data mismatches between components.
4. **Firebase SDK** is the nervous system. The frontend directly talks to Firebase via simple API calls (`getDocs`, `addDoc`, `uploadBytesResumable`) without the need for a secondary backend node/express server.
5. **Session Cache** (`cache.ts`) sits in between the Frontend and Firebase to optimize read quotas resulting in lightning-fast response times.
