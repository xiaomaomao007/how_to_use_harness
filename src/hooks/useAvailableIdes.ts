import { useState, useEffect } from "react";
import type { IdeInfo } from "../types/github";
import { listAvailableIdes } from "../services/github";

// Module-level promise cache: ensures only one IPC call across all components.
let idesPromise: Promise<IdeInfo[]> | null = null;
let cachedIdes: IdeInfo[] | null = null;

function fetchIdes(): Promise<IdeInfo[]> {
  if (!idesPromise) {
    idesPromise = listAvailableIdes().then((result) => {
      cachedIdes = result;
      return result;
    });
  }
  return idesPromise;
}

export function useAvailableIdes() {
  const [ides, setIdes] = useState<IdeInfo[]>(cachedIdes || []);
  const [loading, setLoading] = useState(!cachedIdes);

  useEffect(() => {
    if (cachedIdes) return;
    fetchIdes()
      .then((result) => {
        setIdes(result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { ides, loading };
}
