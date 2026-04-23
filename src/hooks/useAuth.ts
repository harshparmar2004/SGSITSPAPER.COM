import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Record user login
        try {
          await setDoc(doc(db, "users", currentUser.uid), {
             email: currentUser.email,
             displayName: currentUser.displayName,
             photoURL: currentUser.photoURL,
             lastLoginAt: serverTimestamp()
          }, { merge: true });
        } catch (e) {
          console.error("Failed to record user session", e);
        }

        // Check if admin
        // We use the bootstrapped admin from rules or look up in typical database
        if (currentUser.email === "harshparma007@gmail.com") {
          setIsAdmin(true);
        } else {
          try {
            const adminDoc = await getDoc(doc(db, "admins", currentUser.uid));
            setIsAdmin(adminDoc.exists());
          } catch(e) {
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, isAdmin, loginLoading: loading };
}
