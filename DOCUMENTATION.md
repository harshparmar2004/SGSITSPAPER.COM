# SGSITS PYQ Resource Hub - Technical & User Documentation

Welcome to the comprehensive, deep-technical documentation for the **SGSITS PYQ Resource Hub**. This document serves as the absolute source of truth for the platform's architecture, data schema, security models, and step-by-step user workflows. It is intended for both end-users, administrators, and future engineering maintainers.

---

## 1. Executive Summary & Problem Engineering

### The Problem Scope
Information fragmentation is a critical bottleneck in university ecosystems. At SGSITS, academic assets—Previous Year Questions (PYQs), handwritten notes, and official lab manuals—are historically siloed. Students rely on ephemeral links shared via peer-to-peer networks. This leads to:
1. **High Discovery Latency:** Precious time lost hunting for valid links before exams.
2. **Quality Degradation:** Unverified or incomplete files circulated without a feedback loop.
3. **Loss of Legacy Knowledge:** Links expire, and senior batches graduate, taking resources overhead with them.

### The Systemic Solution
This platform addresses these pain points sequentially by engineering a **Centralized Cloud-Native Hub**:
*   A powerful, multi-faceted filtering engine (Course > Dept > Semester > Subject) designed for extremely low time-to-discovery.
*   A strict Role-Based Access Control (RBAC) Content Management System (CMS) that curates all materials.
*   An integrated Issue Reporting system that provides a direct feedback loop between the consumers (Students) and the curators (Admins).

---

## 2. Core Architecture & Tech Stack

The application uses a serverless, decoupled architecture prioritizing extreme read-performance and high availability.

### Frontend Layer (Client Application)
*   **Framework:** React 18+ bootstrapped with Vite. React provides a reactive virtual DOM for immediate UI updates when filtering large sets of academic data.
*   **Routing:** `react-router-dom` for declarative routing and Protected Route guarding.
*   **Layout & Styling:** Tailwind CSS enables a heavily customized, utility-first design system. Standardized responsive breakpoints ensure parity across mobile and desktop viewports.
*   **UI Components:** Isolated UI atoms (Buttons, Inputs, Selects) heavily inspired by functional design paradigms. Icons provided by `lucide-react`.
*   **Client-side Archiving:** `jszip` and `file-saver` are utilized to compile ZIP archives recursively within the client's memory, reducing server compute costs while providing bulk-download features.

### Backend Infrastructure (Firebase Suite)
*   **Database:** Cloud Firestore (NoSQL Document Database). Optimized for rapid querying using composite indexes.
*   **Blob Storage:** Firebase Cloud Storage for housing raw PDF binary data.
*   **Identity Provider:** Firebase Authentication (OAuth 2.0 via Google Identity).

---

## 3. Data Schema & Relationship Modeling (Firestore)

The NoSQL database relies on flattened data hierarchies to guarantee `O(1)` or shallow `O(N)` read times.

### 3.1 `pyqs` (The Master Asset Collection)
Stores references to all academic assets.
*   **Fields:** `subjectCode`, `subjectName`, `department`, `examType`, `examYear`, `semester`, `documentType` ("PYQ", "Notes", etc.), `fileUrl`, `fileSize`, `uploadedBy` (UID), `uploadedAt` (Timestamp), `downloads` (Integer).

### 3.2 `subjects` (The Academic Registry)
A constrained registry to ensure referential integrity. Uploaders must select a predefined subject to prevent typos (e.g., `CS-201` vs `CS201`).
*   **Fields:** `code`, `name`, `department`, `semester`, `course`, `createdAt`.

### 3.3 `admins` (The RBAC Registry)
Determines elevated privileges system-wide.
*   **Fields:** `email` (Primary Key), `role` (`"superadmin"`, `"department_admin"`, `"staff"`), `departments` (Array of Strings - enforces scoping), `addedAt`, `name`.

### 3.4 `reports` (Telemetry & Moderation)
End-user issue flags connected to specific assets.
*   **Fields:** `pyqId`, `issueCategory` (ex: "Missing Pages", "Blurry"), `description`, `studentName`, `studentId`, `branch`, `status` ("Pending", "Resolved").

### 3.5 `analytics` (Aggregated Telemetry)
*   Aggregates total system operations centrally to populate the Admin Dashboard without querying thousands of PYQ documents.

---

## 4. Deep-Dive Workflows: Student Experience

The Student UI (`/pages/StudentView.tsx`) is designed for read-heavy operations, effectively acting as an intelligent search engine.

### Phase 1: Authentication & Context Hydration
1. A user approaches the `/` route.
2. Clicking **Login** triggers the Google OAuth popup.
3. Upon success, Firebase issues a signed JWT.
4. The React context (`AuthProvider`) hydrates. If the user's email is not in the `admins` collection, they are routed to the standard Student Interface.

### Phase 2: Querying the Engine
1. State constraints are applied in a strict hierarchy: `Course -> Department -> Year -> Semester`.
2. The UI listens to these changes and applies client-side filtering on the cached `pyqs` payload.
3. **Fuzzy Search:** The text input evaluates against both `subjectCode` and `subjectName` using `.toLowerCase().includes()`. 

### Phase 3: The Bulk Download Pipeline
When a student selects multiple criteria, the system offers **Batch Downloads**:
1. The student clicks "Download X Result(s)".
2. The UI triggers asynchronous HTTP `fetch` requests to all associated Firebase Storage bucket URLs explicitly converting them to `Blob` objects.
3. The `JSZip` library constructs a virtual directory tree containing these binary blobs.
4. `FileSaver.js` is triggered to prompt the browser's native OS file save dialog, pushing down a packaged `.zip` file.
*Edge Case Handled:* Cross-Origin Resource Sharing (CORS) exceptions are mitigated by ensuring the Firebase Storage bucket retains the correct CORS policy.

### Phase 4: Constructive Reporting
1. If an asset is flawed, the student engages the "Alert" icon.
2. A modal collects structured metadata (what is wrong, who is reporting).
3. The payload is written to the `reports` collection, immediately notifying admins.

---

## 5. Deep-Dive Workflows: Administrative Operations (CMS)

The Administrative UI revolves around heavy-duty writes, updates, and oversight capability. Operations are protected under `/admin/*` routes.

### 5.1 Role-Based Limitations
*   **Super Admin:** Unrestricted access. Can grant Admin privileges to other users via `/admin/staff`. Has visibility over all departments.
*   **Department Admin / Staff:** Hard-scoped to specific departments. E.g., An admin scoped to 'Computer Science' cannot edit 'Mechanical Engineering' templates.

### 5.2 The Upload Lifecycle (`/admin/upload`)
The ingestion pipeline is highly fault-tolerant.
1. The Admin selects predefined metadata (locking the asset structurally).
2. **Path Resolution:** If uploading a raw file, the client constructs a deterministic deterministic storage path: `/pyqs/{department}/{semester}/{sanitized_filename}`.
3. **Execution:** The file is streamed to Firebase Storage. 
4. **Pointer Genesis:** Upon 100% upload completion, Storage yields a public `DownloadURL`.
5. **Atomic Commit:** A document containing all metadata *plus* the `DownloadURL` is created in Firestore. The system runs an atomic `FieldValue.increment(1)` on the global `analytics` tracker to update total uploads.

### 5.3 The Hot-Replace Procedure (`/admin/all-pyqs`)
To fix erroneous files without losing download statistics or associated IDs:
1. Admin triggers "Replace".
2. Admin uploads a clean PDF file.
3. The system captures the existing Firestore `pyqId`.
4. It patches the `fileUrl` pointer in the specific Firestore document to the new file, maintaining all history.
5. The UI pushes a temporary toast notification referencing the exact success state: `"Successfully updated document for {SubjectCode}"`.

### 5.4 Subject Curriculum Management
Located at `/admin/subjects`, admins actively mirror university curriculum changes. When subjects are added here, they immediately propagate to the multi-select dropdowns in both the Upload menu and the Student search parameters.

---

## 6. Advanced Security Posture & ABAC Rules

The system does not trust the React client. All rules are established via strictly-typed Firebase Security Rules (`firestore.rules`).

### The Fortress Pattern
The rules employ a default-deny policy. All document accesses must pass rigorous checks.
1. **Validation Blueprints:** Write operations must pass structural schemas. E.g., `isValidPYQ(data)`. Ensures no malicious properties can be injected.
2. **Type Identity:** Enforces strict limitations: e.g., sizes for user-inputs must not exceed predefined character counts preventing Denial of Wallet (recursive insertion) attacks.
3. **Ownership Parity:** The database asserts that any file marked as `uploadedBy: 'userId'` truly matches the `request.auth.uid` making the request.
4. **Atomic Invariants:** Admin verifications occur dynamically. The rule queries `exists(/databases/$(database)/documents/admins/$(request.auth.email))` to dynamically approve privileged `write` statements safely on the backend.

---

## 7. Operational Guidelines for Maintainers

### Troubleshooting Common Faults
*   **"Quota Exceeded" Errors:** Instruct users to wait. Signifies Firebase free-tier spark plan limitations (50k reads/day) have been met.
*   **Zip Download Failing on Specific Files:** Typically caused by external Drive links replacing physical storage files. The JSZip implementation correctly ignores HTTP cross-origin links to prevent script failure and alerts the user on partial zips.
*   **Admin Dashboard Loading Infinity:** Occurs if you drop administrative permissions mid-session. Fix: Sign out and sign back in to refresh JWT claims and context.

### The UI Component Hierarchy
If extending UI functionality, trace the imports backwards:
`Main App View` <- `Protected Layouts` <- `Page Components` <- `Widget Collections` <- `Base UI Atoms`.
All new additions must adhere to the semantic variables defined in `/src/index.css`.

---
*Generated by the Engineering Team. Strictly Private & Confidential. To be stored alongside the main repository root.*
