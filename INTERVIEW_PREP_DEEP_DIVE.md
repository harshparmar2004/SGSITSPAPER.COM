# SGSITS PYQ Hub - Technical Deep Dive & Interview Prep

This document is designed to help you prepare for technical interviews by explaining the "Why" and "How" behind the specific architectural decisions, patterns, and code implementations in the SGSITS PYQ Hub application.

---

## 1. System Design & Architectural Decisions

### Why a Serverless Architecture (Firebase + React)?
* **Interview Context:** "Why didn't you build a Node.js/Express backend?"
* **Answer:** For a college resource hub, the operations are primarily CRUD (Create, Read, Update, Delete) and file distribution. Writing a custom backend would introduce maintenance overhead (hosting, load balancing, database management). Firebase provides a Serverless Backend-as-a-Service (BaaS) that handles authentication, database scaling (Firestore), and binary file storage (Firebase Storage) securely from the client side using Security Rules.

### Mitigating NoSQL Read Costs (The Caching Strategy)
* **Interview Context:** "Firestore charges per read. How do you prevent aggressive billing if 1,000 students search for PYQs?"
* **Implementation:** `src/lib/cache.ts`
* **Answer:** Instead of querying Firestore every time the `StudentView` or `AdminDashboard` mounts or an admin changes a filter, we implemented a custom caching layer using the browser's Native `sessionStorage`. 
    * When data is fetched via `getCachedCollection("pyqs")`, we check `sessionStorage` first.
    * If a cache miss occurs, we hit Firestore once, map the data, and store it as a JSON string in `sessionStorage`.
    * All subsequent searches, client-side re-renders, and filtering happen *in memory* (O(N) array filtering in JS) which is instantaneous and costs $0.
    * When an Admin hits the Upload button, we trigger `clearCache("pyqs")` (Cache Invalidation) so the next request pulls the fresh data.

### Client-Side vs Server-Side Filtering
* **Interview Context:** "When a user selects 'Computer Science' and 'Year 2023', do you query the database for that?"
* **Answer:** No. We do a primary read of the PYQ collection (or read from the cache) and pull the entire index into React state. We then execute `Array.prototype.filter()` on the frontend. Because document metadata (Subject name, Year, URL) is lightweight (a few KBs for thousands of records), transferring the whole JSON array once is much faster and cheaper than setting up complex, composite NoSQL indexes and making network roundtrips for every dropdown selection.

---

## 2. Authentication & Role-Based Access Control (RBAC)

### Deep Dive into `useAuth.ts`
* **Interview Context:** "How do you secure admin pages from normal students?"
* **Implementation:** The `useAuth` hook and `AdminLayout.tsx`.
* **Answer:** Our RBAC is deterministic and hierarchical.
    1. **Primary Auth Gate:** Standard Google OAuth login (`signInWithPopup`).
    2. **Role Checking:** Once the underlying Firebase Auth State validates, `useAuth.ts` captures the user's `email`.
    3. **Database Handshake:** It cross-references the email with an `admins` collection in Firestore. 
    4. **Hardcoded Fallback (Root Level):** The email `harshparma007@gmail.com` bypasses security checks to guarantee Superadmin access, ensuring you can never be locked out of your own system.
    5. **Protected Routing:** `AdminLayout.tsx` wraps all `/admin` routes. If `isAdmin` resolves to `false`, the router acts as a bouncer and aggressively redirects the user back to the `/hub` or `/` landing page.

---

## 3. Advanced React Patterns Used

### 1. Custom Hooks for Business Logic Separation
* Example: `useAcademicConfig.ts` & `useAuth.ts`.
* **Why:** In interviews, separating UI from Business Logic is highly valued. Our React components (`AdminUpload.tsx`, `StudentView.tsx`) don't contain the raw logic of *how* to authenticate. They simply call `const { currentUser, isAdmin } = useAuth();`. This keeps components clean, testable, and strictly focused on rendering UI.

### 2. Consolidated UI Library (`src/components/ui.tsx`)
* **Why:** Instead of having 50 different button components, we use a single `ui.tsx` file exporting atomic components (`Button`, `Input`, `Card`). This relies on `clsx` and `tailwind-merge`. If an interviewer asks "How do you avoid Tailwind class clashing?", you mention using `tailwind-merge` to resolve specificity conflicts (e.g., passing `bg-red-500` to a component that inherently has `bg-blue-500` will correctly yield `bg-red-500`).

### 3. Asynchronous State Handling
* When uploading a file to Firebase, the app manages 3 distinct states:
    1. **Idle/Form Validation:** Checking if inputs are selected.
    2. **Uploading:** Disabling buttons, showing a spinner, using Firebase `uploadBytesResumable` to monitor byte progress.
    3. **Commit:** Generating the downloadURL, pushing metadata to Firestore `addDoc(...)`, invalidating cache, and resetting the React form.

---

## 4. Specific Interview Q&A for this App

**Q1: How does your application deal with file storage for PYQs?**
* **A:** We do not store files in the database. We upload the binary PDF file to Firebase Cloud Storage. Once successful, Firebase gives us a secure `downloadURL`. We take that URL string and save it into a Firestore NoSQL Document alongside metadata like `subjectCode`, `year`, and `department`. The UI simply loops over the database records and renders `<a>` tags pointing to that URL.

**Q2: What happens if a Firestore operation fails? How do you handle exceptions?**
* **A:** I implemented a centralized error boundary for the Database. Instead of scattered `try/catch` blocks throwing generic alerts, we have `src/lib/handleFirestoreError.ts`. It intercepts Firestore API failures (like Quota Exceeded, Missing Permissions, or Offline status), maps the error, logs the exact `path` and `operationType`, and formats a readable error for the UI.

**Q3: How are you rendering those charts on the Admin Dashboard?**
* **A:** We use `recharts`, a composable charting library built on React components. Because our NoSQL database stores distinct documents (e.g., one document per download), I pull the data and perform a Map-Reduce operation in JavaScript on the frontend. For example, aggregating the array of download documents into a single object grouped by `subjectName` to feed into the Rechart's `<BarChart />` component.

**Q4: Tell me about your Component styling.**
* **A:** Everything is styled with Tailwind CSS v4. Instead of writing external `.css` files, classes are co-located with JSX. For complex dynamic styling or layout shifts, we integrate `framer-motion` (`motion.div`), which allows declarative, GPU-accelerated animations (like the entrance reveals on the `Landing.tsx` page).

**Q5: If I wanted to add "Like / Bookmark" functionality to a PYQ, how would you architect that?**
* **A:** I would create a new Firestore collection called `bookmarks`. Inside, a document would look like `{ pyqId: "123", userId: "abc", createdAt: Timestamp }`. On the `StudentView`, we fetch the user's bookmarks array. In the PYQ map function, we check `if (bookmarks.includes(pyq.id))` to render a filled or empty heart icon. This leverages NoSQL's relational flexibility without needing complex JOIN operations.
