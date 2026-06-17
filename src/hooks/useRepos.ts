import { useState, useCallback } from "react";
import type { GitHubRepo, SearchResult } from "../types/github";
import { getGitHubRepos } from "../services/github";

export function useRepos() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRepos = useCallback(async (owner: string, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const result: SearchResult<GitHubRepo> = await getGitHubRepos(owner, page);
      setRepos(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch repos");
    } finally {
      setLoading(false);
    }
  }, []);

  return { repos, total, loading, error, fetchRepos };
}
