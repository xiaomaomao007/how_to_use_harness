import { useState, useCallback } from "react";
import type { GitHubActivity, SearchResult } from "../types/github";
import { getGitHubActivities } from "../services/github";

export function useActivities() {
  const [activities, setActivities] = useState<GitHubActivity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async (username: string, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const result: SearchResult<GitHubActivity> = await getGitHubActivities(username, page);
      setActivities(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch activities"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return { activities, total, loading, error, fetchActivities };
}
