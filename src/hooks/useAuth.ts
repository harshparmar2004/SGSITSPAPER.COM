import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminRole, setAdminRole] = useState<'superadmin' | 'department' | null>(null);
  const [assignedDepartments, setAssignedDepartments] = useState<string[]>([]);
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
          setAdminRole('superadmin');
          setAssignedDepartments([]);
        } else {
          try {
            const adminDoc = await getDoc(doc(db, "admins", currentUser.uid));
            if (adminDoc.exists()) {
              setIsAdmin(true);
              const data = adminDoc.data();
              setAdminRole(data.role || 'superadmin');
              setAssignedDepartments(data.departments || []);
            } else if (currentUser.email) {
              const emailAdminDoc = await getDoc(doc(db, "admins", currentUser.email.toLowerCase()));
              if (emailAdminDoc.exists()) {
                setIsAdmin(true);
                const data = emailAdminDoc.data();
                setAdminRole(data.role || 'superadmin');
                setAssignedDepartments(data.departments || []);
              } else {
                setIsAdmin(false);
                setAdminRole(null);
                setAssignedDepartments([]);
              }
            } else {
              setIsAdmin(false);
              setAdminRole(null);
              setAssignedDepartments([]);
            }
          } catch(e) {
            setIsAdmin(false);
            setAdminRole(null);
            setAssignedDepartments([]);
          }
        }
      } else {
        setIsAdmin(false);
        setAdminRole(null);
        setAssignedDepartments([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, isAdmin, adminRole, assignedDepartments, loginLoading: loading };
}
