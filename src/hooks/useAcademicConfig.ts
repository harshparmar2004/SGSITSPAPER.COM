import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_COURSES, DEFAULT_DEPARTMENTS } from '../types';

export interface AcademicProgram {
  course: string;
  departments: string[];
}

export function useAcademicConfig() {
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "settings", "academic_config");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setPrograms(snap.data().programs || []);
      } else {
        // Initialize with default
        const initial: AcademicProgram[] = DEFAULT_COURSES.map(course => ({
          course,
          departments: [...DEFAULT_DEPARTMENTS]
        }));
        // We only return defaults on read. We don't write them until the admin explicitly updates.
        setPrograms(initial);
      }
    } catch (e) {
      console.error("Failed to load academic config", e);
      // Fallback to defaults on permission error (e.g., rules not deployed yet or not admin)
      const initial: AcademicProgram[] = DEFAULT_COURSES.map(course => ({
        course,
        departments: [...DEFAULT_DEPARTMENTS]
      }));
      setPrograms(initial);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const updatePrograms = async (newPrograms: AcademicProgram[]) => {
    try {
      await setDoc(doc(db, "settings", "academic_config"), { programs: newPrograms });
      setPrograms(newPrograms);
    } catch (e) {
      console.error("Failed to save config", e);
      throw e;
    }
  };

  return { programs, loading, updatePrograms, refresh: fetchConfig };
}
