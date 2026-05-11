import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";

export const CACHE_DURATION = 1000 * 60 * 10; // 10 minutes

export async function getCachedCollection(collectionName: string, forceRefresh: boolean = false) {
  const CACHE_KEY = `sg_cache_${collectionName}`;
  const CACHE_TIME_KEY = `sg_cache_time_${collectionName}`;

  if (!forceRefresh) {
    const cached = sessionStorage.getItem(CACHE_KEY);
    const cachedTime = sessionStorage.getItem(CACHE_TIME_KEY);
    if (cached && cachedTime) {
      if (Date.now() - parseInt(cachedTime) < CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  }

  // If not cached or expired, fetch from Firestore
  let q = collection(db, collectionName) as any;
  // If it's pyqs, order it
  if (collectionName === "pyqs" || collectionName === "downloads") {
     q = query(collection(db, collectionName), orderBy(collectionName === "downloads" ? "downloadedAt" : "uploadedAt", "desc"));
  }
  
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as object) }));

  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    sessionStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
  } catch (e) {
    console.warn("Could not write to sessionStorage", e);
  }

  return data;
}

export function clearCache(collectionName: string) {
    sessionStorage.removeItem(`sg_cache_${collectionName}`);
    sessionStorage.removeItem(`sg_cache_time_${collectionName}`);
}
