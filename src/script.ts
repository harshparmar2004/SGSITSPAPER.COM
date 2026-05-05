import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./src/firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const adminSnap = await getDocs(collection(db, "admins"));
  const admins = adminSnap.docs.map(d => d.data());
  console.log("Admins:", admins);

  const pyqSnap = await getDocs(collection(db, "pyqs"));
  const pyqs = pyqSnap.docs.map(d => ({ uploadedBy: d.data().uploadedBy }));
  console.log("PYQs uploadedBy:", pyqs);
}

run().catch(console.error);
