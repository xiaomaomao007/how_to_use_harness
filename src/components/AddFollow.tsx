import { useState } from "react";
import type { GitHubUser, FollowedEntity } from "../types/github";
import { useSearch } from "../hooks/useSearch";
import { getUserProfile } from "../services/github";

interface AddFollowProps {
  onAdd: (entity: FollowedEntity) => void;
  existingLogins: Set<string>;
  onClose: () => void;
}

export default function AddFollow({ onAdd, existingLogins, onClose }: AddFollowProps) {
  const { results, loading, error, search, searchOrgs, clear } = useSearch();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"all" | "org">("all");

  const handleSearch = (value: string) => {
    setQuery(value);
    if (mode === "org") {
      searchOrgs(value);
    } else {
      search(value);
    }
  };

  const [addingLogin, setAddingLogin] = useState<string | null>(null);

  const handleAdd = async (user: GitHubUser) => {
    setAddingLogin(user.login);
    try {
      // Fetch full profile to get real public_repos & followers
      const profile = await getUserProfile(user.login);
      onAdd({
        id: user.id,
        login: user.login,
        avatarUrl: user.avatarUrl,
        htmlUrl: user.htmlUrl,
        name: profile.name ?? user.name,
        description: profile.bio ?? user.bio,
        entityType:
          (profile.type || user.type) === "Organization" ? "org" : "user",
        publicRepos: profile.publicRepos ?? 0,
        followers: profile.followers ?? 0,
        followedAt: new Date().toISOString(),
      });
    } catch {
      // Fallback: add with search data only
      onAdd({
        id: user.id,
        login: user.login,
        avatarUrl: user.avatarUrl,
        htmlUrl: user.htmlUrl,
        name: user.name,
        description: user.bio,
        entityType: user.type === "Organization" ? "org" : "user",
        publicRepos: 0,
        followers: 0,
        followedAt: new Date().toISOString(),
      });
    } finally {
      setAddingLogin(null);
    }
  };

  const handleClear = () => {
    setQuery("");
    clear();
  };

  const handleModeChange = (m: "all" | "org") => {
    setMode(m);
    if (query.trim()) {
      if (m === "org") {
        searchOrgs(query);
      } else {
        search(query);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-20"
      onClick={onClose}
    >
      <div
        className="bg-gh-card border border-gh-border rounded-lg w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gh-border">
          <h3 className="text-sm font-semibold">Add Community</h3>
          <button
            onClick={onClose}
            className="text-gh-text-secondary hover:text-gh-text text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 px-4 pt-3">
          <button
            onClick={() => handleModeChange("all")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              mode === "all"
                ? "bg-gh-accent text-white"
                : "bg-gh-border text-gh-text-secondary hover:text-gh-text"
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleModeChange("org")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              mode === "org"
                ? "bg-gh-accent text-white"
                : "bg-gh-border text-gh-text-secondary hover:text-gh-text"
            }`}
          >
            Organizations
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gh-text-secondary text-sm">
              🔍
            </span>
            <input
              autoFocus
              className="w-full bg-gh-dark border border-gh-border rounded pl-9 pr-9 py-2 text-sm text-gh-text placeholder:text-gh-text-secondary focus:outline-none focus:border-gh-accent"
              placeholder={mode === "org" ? "Search organizations..." : "Search users or orgs..."}
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && handleClear()}
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gh-text-secondary hover:text-gh-text text-sm"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto px-2 pb-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-5 h-5 border-2 border-gh-accent border-t-transparent rounded-full" />
              <span className="ml-2 text-sm text-gh-text-secondary">Searching...</span>
            </div>
          )}

          {error && (
            <div className="px-4 py-3 text-sm text-gh-danger">{error}</div>
          )}

          {!loading && !error && results.length === 0 && query.trim() && (
            <div className="px-4 py-8 text-center text-sm text-gh-text-secondary">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && !error && !query.trim() && (
            <div className="px-4 py-8 text-center text-sm text-gh-text-secondary">
              Type to search GitHub users and organizations
            </div>
          )}

          {results.map((user) => {
            const isFollowed = existingLogins.has(user.login);
            return (
              <div
                key={user.login}
                className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gh-card-hover group"
              >
                <img
                  src={user.avatarUrl}
                  alt={user.login}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gh-text truncate">
                      {user.login}
                    </span>
                    {user.type === "Organization" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gh-accent/20 text-gh-accent font-medium">
                        ORG
                      </span>
                    )}
                  </div>
                  {user.bio && (
                    <p className="text-xs text-gh-text-secondary truncate">
                      {user.bio}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => !isFollowed && !addingLogin && handleAdd(user)}
                  disabled={isFollowed || addingLogin === user.login}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    isFollowed
                      ? "bg-gh-border text-gh-text-secondary cursor-not-allowed"
                      : "bg-gh-accent hover:bg-blue-600 text-white"
                  }`}
                >
                  {isFollowed
                    ? "Followed"
                    : addingLogin === user.login
                      ? "Adding…"
                      : "Follow"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
