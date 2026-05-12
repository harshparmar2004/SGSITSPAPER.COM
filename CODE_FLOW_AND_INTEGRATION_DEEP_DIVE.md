# Code Flow, Roles, and Deep Integration Guide

This document breaks down the exact execution flow of user roles, the complete Firebase architecture (with Database/Rules mapping), and how the foundational technologies (React, TypeScript, Libraries) operate under the hood to power the SGSITS PYQ Hub.

---

## 1. The Persona Triad: Student, Admin, and Super Admin Flow

How does the app know who is who, and what happens when they log in?

### A. The Student Flow (Default State)
* **Code Flow:** When a user logs in via Google (`signInWithPopup`), `useAuth.ts` detects the new `currentUser`. 
* **Validation:** By default, every authenticated user is treated as a **Student** unless proven otherwise.
* **Access:** The student is redirected to `/hub`.
* **Permissions:** 
    * **Read:** Allowed to read the `pyqs` collection.
    * **Write:** Denied from writing to `pyqs`. Allowed to write to `reports` (reporting a broken link) and `downloads` (logging a download event).

### B. The Admin Flow (Department Level)
* **Code Flow:** A Super Admin adds a professor/staff member's email via the `AdminStaff` interface. This inserts a document into the `admins` Firestore collection.
* **Validation:** Upon login, the `useAuth` hook queries the `admins` collection: `getDocs(query(collection(db, 'admins'), where('email', '==', currentUser.email)))`. 
* **Access:** If a match is found, `isAdmin` is set to `true`, and they are granted access to the `/admin/*` routes.
* **Permissions:** Department Admins can upload new PYQs, manage metadata, and view analytics.

### C. The Super Admin Flow (Root Level)
* **Code Flow:** Hardcoded directly into the JavaScript/TypeScript execution layer for supreme safety.
* **Validation:** In `useAuth.ts`: `if (currentUser.email === "harshparma007@gmail.com") { return { isAdmin: true, role: 'superadmin' } }`.
* **Access:** Complete access to all features.
* **Permissions:** They are the ONLY users allowed to view and interact with the `/admin/staff` page to promote or demote other Admins. They bypass all department-level restrictions.

---

## 2. Full Firebase Architecture & Rules Integration

Firebase acts as the entire backend infrastructure. Here is the topology:

### A. The Three Pillars of Firebase
1. **Firebase Authentication:** Handles the OAuth2.0 handshake with Google servers. It returns a signed JWT (JSON Web Token) to the client.
2. **Firebase Cloud Storage (Object Storage):** A Google Cloud Storage bucket. This is where the physical PDF files live. When a file uploads, it generates a `downloadURL`.
3. **Firestore (Document DB):** The NoSQL database maintaining the state of the app. It does NOT store the PDFs; it stores the *data* about the PDFs.

### B. Firestore Collections schema mapping
* `/pyqs/{pyqId}` (Fields: `subjectCode`, `subjectName`, `department`, `year`, `semester`, `fileUrl`, `uploadedBy`, `createdAt`)
* `/admins/{adminId}` (Fields: `email`, `role`, `department`, `addedAt`)
* `/downloads/{downloadId}` (Fields: `pyqId`, `userEmail`, `downloadedAt`, `department`)
* `/reports/{reportId}` (Fields: `pyqId`, `issueType`, `status`, `reportedAt`)

### C. Security Rules Integration (The Cloud Firewall)
The Firestore Security Rules (deployed via `firestore.rules`) are the last line of defense. The React app is considered "client-side" (untrusted), so rules are evaluated on Google's servers before any request succeeds.

**Conceptual Rule Flow applied:**
* *PYQs:* `allow read: if true;` (Anyone can read, fast and open). `allow write: if exists(/databases/$(database)/documents/admins/$(request.auth.token.email));` (Only verified admins can upload/delete).
* *Admins:* `allow read, write: if request.auth.token.email == "harshparma007@gmail.com";` (Strictly locks the staff collection to the Super Admin).

*(Note: If a regular student somehow hacked the frontend React code to show the "Upload" button and tried to push a PYQ, Firebase Servers would instantly reject it with a "Missing Permissions" error because the validation runs in the cloud, not the browser.)*

---

## 3. How the Libraries Work Under the Hood

* **`react-router-dom`:** React single-page apps do not load new HTML files from a server. React Router intercepts URL changes (e.g., clicking a link to `/admin/upload`). It blocks the browser's default refresh behavior, reads the URL, and instantly swaps the visible React Virtual DOM components out for the new ones.
* **`lucide-react`:** Instead of loading heavy images, this library injects raw SVG mathematical vectors directly into the DOM tree. This is why icons scale perfectly without pixelating and cost almost 0 bytes in network requests.
* **`recharts`:** This library takes the JSON arrays we fetch from Firestore (like downloads) and maps them to `<svg>`, `<rect>`, and `<circle>` HTML elements, dynamically calculating the X/Y coordinates based on math to draw Admin dashboards.
* **`framer-motion`:** It bypasses standard React state updating (which is slow for animation) and manipulates the CSS transform matrices directly via the browser's `requestAnimationFrame` API. This allows 60FPS buttery smooth animations on the Landing Page.

---

## 4. How React is Working

React relies on a mathematical concept called the **Virtual DOM (VDOM)** and **Unidirectional Data Flow**.

1. **State:** Components like `StudentView` have memory called `state` (e.g., `const [pyqs, setPyqs] = useState([])`).
2. **Execution:** When data arrives from Firebase, we call `setPyqs(firebaseData)`. 
3. **The Vitual DOM Diffing:** React doesn't immediately update the browser screen. It builds a virtual, invisible copy of what the HTML *should* look like. It compares this new virtual copy with the old virtual copy.
4. **Reconciliation:** It calculates the exact microscopic difference (e.g., "Ah, only these 3 specific `<tr>` rows changed"). It then reaches into the real browser DOM and updates *only* those 3 rows. This makes the app incredibly fast.
5. **Data Flow:** Data only flows *down* (from Parent -> Child via Props). If a child component (a button) needs to change data, it must emit an event *up* using a callback function. 

---

## 5. How TypeScript is Working (The Armor)

JavaScript is dynamically typed (a variable can be a string, then a number, then an object) which causes apps to crash in production. TypeScript changes this entirely.

1. **Compile-Time Checking:** TypeScript does not exist in the browser. Before Vite builds the app, the TypeScript Compiler (`tsc`) scans every single file.
2. **Contracts via `src/types.ts`:** We define `<PYQ>` interfaces. If someone tries to code `pyq.yearr` instead of `pyq.year`, the compiler instantly throws a red fatal error and blocks the build. 
3. **The Workflow:** 
   * When calling `getDocs(collection(...))` from Firebase, Firebase returns raw `any` data.
   * We immediately cast it: `const data = doc.data() as PYQ;`
   * From that point forward, the IDE (like VSCode) and the build pipeline *guarantee* that every component receiving this data knows exactly what fields exist. It prevents "Undefined is not a function" errors for the end-user.
   * Once checking is done, the code is stripped down to raw, optimized standard JavaScript for the browser to run.
