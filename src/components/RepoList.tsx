import { useState, useMemo } from "react";
import type { GitHubRepo } from "../types/github";
import RepoCard from "./RepoCard";

type SortKey = "stars" | "updated" | "name" | "forks";

interface RepoListProps {
  repos: GitHubRepo[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export default function RepoList({ repos, loading, error, onRetry }: RepoListProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("stars");
  const [languageFilter, setLanguageFilter] = useState<string>("all");

  const languages = useMemo(() => {
    const langs = new Set(repos.map((r) => r.language).filter(Boolean) as string[]);
    return Array.from(langs).sort();
  }, [repos]);

  const filteredRepos = useMemo(() => {
    let result = [...repos];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.topics.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (languageFilter !== "all") {
      result = result.filter((r) => r.language === languageFilter);
    }

    switch (sortBy) {
      case "stars":
        result.sort((a, b) => b.stargazersCount - a.stargazersCount);
        break;
      case "forks":
        result.sort((a, b) => b.forksCount - a.forksCount);
        break;
      case "updated":
        result.sort(
          (a, b) =>
            new Date(b.pushedAt || b.updatedAt).getTime() -
            new Date(a.pushedAt || a.updatedAt).getTime()
        );
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [repos, search, sortBy, languageFilter]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-gh-danger text-sm mb-2">{error}</p>
        <button
          onClick={onRetry}
          className="text-sm text-gh-accent hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gh-border bg-gh-dark/50">
        <div className="relative flex-1 min-w-[200px]">
          <input
            className="w-full bg-gh-dark border border-gh-border rounded pl-8 pr-3 py-1.5 text-xs text-gh-text placeholder:text-gh-text-secondary focus:outline-none focus:border-gh-accent"
            placeholder="Search repos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gh-text-secondary text-xs">
            🔍
          </span>
        </div>

        <select
          className="bg-gh-dark border border-gh-border rounded px-2 py-1.5 text-xs text-gh-text focus:outline-none focus:border-gh-accent"
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
        >
          <option value="all">All Languages</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>

        <select
          className="bg-gh-dark border border-gh-border rounded px-2 py-1.5 text-xs text-gh-text focus:outline-none focus:border-gh-accent"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
        >
          <option value="stars">★ Stars</option>
          <option value="updated">🕐 Updated</option>
          <option value="name">🔤 Name</option>
          <option value="forks">🍴 Forks</option>
        </select>

        <span className="text-xs text-gh-text-secondary">
          {filteredRepos.length} repos
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-gh-card border border-gh-border rounded-lg p-4 animate-pulse"
              >
                <div className="h-4 bg-gh-border rounded w-2/3 mb-3" />
                <div className="h-3 bg-gh-border rounded w-full mb-2" />
                <div className="h-3 bg-gh-border rounded w-4/5 mb-4" />
                <div className="flex gap-4">
                  <div className="h-3 bg-gh-border rounded w-16" />
                  <div className="h-3 bg-gh-border rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredRepos.length === 0 && repos.length > 0 && (
          <div className="text-center py-12">
            <p className="text-gh-text-secondary text-sm">
              No repos match your filters
            </p>
          </div>
        )}

        {!loading && repos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-4xl mb-3 animate-bounce">📂</div>
            <p className="text-gh-text-secondary text-sm">
              No repositories found
            </p>
          </div>
        )}

        {!loading && filteredRepos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRepos.map((repo) => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
