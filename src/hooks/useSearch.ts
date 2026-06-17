import { useState, useEffect, useCallback } from "react";
import type { GitHubUser, SearchResult } from "../types/github";
import { searchGitHubEntity, searchGitHubOrgs } from "../services/github";

interface UseSearchResult {
  results: GitHubUser[];
  total: number;
  loading: boolean;
  error: string | null;
  search: (query: string) => void;
  searchOrgs: (query: string) => void;
  clear: () => void;
}

export function useSearch(): UseSearchResult {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GitHubUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<"all" | "org">("all");

  const search = useCallback((q: string) => {
    setQuery(q);
    setSearchMode("all");
  }, []);

  const searchOrgs = useCallback((q: string) => {
    setQuery(q);
    setSearchMode("org");
  }, []);

  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
    setTotal(0);
    setError(null);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTotal(0);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        let data: SearchResult<GitHubUser>;
        if (searchMode === "org") {
          data = await searchGitHubOrgs(query.trim());
        } else {
          data = await searchGitHubEntity(query.trim());
        }
        setResults(data.items);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchMode]);

  return { results, total, loading, error, search, searchOrgs, clear };
}
