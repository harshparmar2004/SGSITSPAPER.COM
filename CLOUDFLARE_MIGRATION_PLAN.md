# Migrating from Firebase (DB/Storage) to Cloudflare D1 & R2

Your seniors have made a very smart architectural suggestion. While Firebase is incredibly fast to build with, its pricing model (charging per document read/write and for bandwidth egress) can become very expensive as your application scales. 

Cloudflare solves this beautifully:
*   **Cloudflare D1 (Database):** A serverless SQL database (built on SQLite). It offers a massive free tier (5 million rows read per day) and doesn't charge for "concurrent connections" like traditional SQL databases.
*   **Cloudflare R2 (Storage):** An object storage service similar to Amazon S3 or Firebase Storage, but with **zero egress fees** (meaning you don't pay when students download the PDFs, which is usually the biggest cost for an app like this).
*   **Firebase Auth (Authentication):** Keeping this is a great idea. Firebase Auth is free for up to 50,000 active users per month, and it handles Google Sign-In perfectly.

Here is exactly how we can transition the SGSITS PYQ Hub to this hybrid architecture.

---

## The New Hybrid Architecture

1.  **Frontend (React/Vite):** Still handles the UI, state, and Firebase Login.
2.  **Authentication (Firebase Auth):** The user logs in via Google on the frontend. Firebase gives the frontend a secure JWT (JSON Web Token).
3.  **Backend (Node.js/Express):** We MUST introduce a backend API. The React frontend can no longer talk directly to the database. Instead:
    *   React sends the Firebase JWT to our new Backend.
    *   The Backend uses the `firebase-admin` SDK to verify the token (proving who the user is).
4.  **Database (Cloudflare D1):** Once the user is verified, the Backend uses the Cloudflare API to run SQL queries (e.g., `INSERT INTO pyqs ...`) to D1.
5.  **Storage (Cloudflare R2):** For uploads, the React frontend sends the PDF to the Backend, which uploads it directly to Cloudflare R2 using the AWS S3 SDK (since R2 uses the S3 protocol).

---

## Step-by-Step Implementation Plan

If you want me to execute this migration for you in this workspace, here is the roadmap we will follow:

### Phase 1: Setting up the Backend (The Bridge)
Currently, your app is a "Single Page Application" (SPA) where React talks directly to Firebase. We need to upgrade it to a "Full-Stack" app.
*   We will modify `package.json` to start an Express server (`server.ts`).
*   We will create secure API routes like `GET /api/pyqs` and `POST /api/upload`.
*   We will implement Firebase Admin Middleware. Every request from the frontend will pass an `Authorization: Bearer <token>` header. The backend will verify this token before allowing the database query.

### Phase 2: Integrating Cloudflare R2 (PDF Storage)
*   You will need to create a Cloudflare account, go to R2, create a bucket (e.g., `sgsits-pyqs`), and generate an S3 Access Key / Secret Key.
*   We will install `@aws-sdk/client-s3` in our Node backend.
*   When a teacher uploads a PDF, the Express backend will stream that file directly into your R2 bucket and get the public URL.

### Phase 3: Integrating Cloudflare D1 (SQL Database)
*   You will create a D1 database in your Cloudflare dashboard.
*   We will define the SQL Schema (Tables: `users`, `pyqs`, `departments`, `activity_logs`).
*   We will replace all the generic Firestore `getDocs()` and `addDoc()` calls in the frontend with HTTP calls to our Express backend: `fetch('/api/pyqs')`.
*   The Express backend will use the Cloudflare API to execute the SQL statements against D1.

---

## What I need from you to start

Because Cloudflare is an external service (unlike Firebase which this AI Studio can auto-provision), I cannot create the Cloudflare account for you. 

If you want to proceed with this migration right now, you need to go to **cloudflare.com**, sign up, and provide me with:

1.  **For R2:** Access Key ID, Secret Access Key, and your Cloudflare Account ID.
2.  **For D1:** A Cloudflare API Token (with D1 edit permissions) and your D1 Database ID.

*(We would store these securely in an `.env` file, not in the public code).*

**Should we begin Phase 1 (Setting up the Express Backend and SQL Schema)? Or would you like to gather the Cloudflare credentials first?**
