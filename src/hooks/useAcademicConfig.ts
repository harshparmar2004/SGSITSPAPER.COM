import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_COURSES, DEFAULT_DEPARTMENTS } from '../types';

export interface Subject {
  code: string;
  name: string;
  year?: string;
  semester?: string;
  departments?: string[];
}

export interface AcademicProgram {
  course: string;
  departments: string[];
}

export function useAcademicConfig() {
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "settings", "academic_config");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setPrograms(data.programs || []);
        setSubjects(data.subjects || []);
      } else {
        // Initialize with default
        const initial: AcademicProgram[] = DEFAULT_COURSES.map(course => ({
          course,
          departments: [...DEFAULT_DEPARTMENTS]
        }));
        // We only return defaults on read. We don't write them until the admin explicitly updates.
        setPrograms(initial);
        setSubjects([]);
      }
    } catch (e) {
      console.error("Failed to load academic config", e);
      // Fallback to defaults on permission error (e.g., rules not deployed yet or not admin)
      const initial: AcademicProgram[] = DEFAULT_COURSES.map(course => ({
        course,
        departments: [...DEFAULT_DEPARTMENTS]
      }));
      setPrograms(initial);
      setSubjects([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const updatePrograms = async (newPrograms: AcademicProgram[]) => {
    try {
      const docRef = doc(db, "settings", "academic_config");
      const snap = await getDoc(docRef);
      const existingData = snap.exists() ? snap.data() : {};
      await setDoc(docRef, { ...existingData, programs: newPrograms });
      setPrograms(newPrograms);
    } catch (e) {
      console.error("Failed to save config", e);
      throw e;
    }
  };

  const updateSubjects = async (newSubjects: Subject[]) => {
    try {
      const docRef = doc(db, "settings", "academic_config");
      const snap = await getDoc(docRef);
      const existingData = snap.exists() ? snap.data() : {};
      await setDoc(docRef, { ...existingData, subjects: newSubjects });
      setSubjects(newSubjects);
    } catch (e) {
      console.error("Failed to save subjects", e);
      throw e;
    }
  };

  return { programs, subjects, loading, updatePrograms, updateSubjects, refresh: fetchConfig };
}
