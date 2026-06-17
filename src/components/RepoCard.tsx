import { useState, useRef, useEffect } from "react";
import type { GitHubRepo, IdeInfo } from "../types/github";
import { getLanguageColor, formatCount, formatDate } from "../utils/github";
import { openInIde } from "../services/github";
import { useAvailableIdes } from "../hooks/useAvailableIdes";
import { IdeIcon } from "./IdeaIcon";

interface RepoCardProps {
  repo: GitHubRepo;
}

type IdeState = "idle" | "loading" | "success" | "error";

export default function RepoCard({ repo }: RepoCardProps) {
  const { ides } = useAvailableIdes();
  const [menuOpen, setMenuOpen] = useState(false);
  const [ideState, setIdeState] = useState<IdeState>("idle");
  const [ideMessage, setIdeMessage] = useState("");
  const [activeIdeName, setActiveIdeName] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleSelectIde = async (ide: IdeInfo) => {
    setMenuOpen(false);
    if (ideState === "loading") return;

    setActiveIdeName(ide.name);
    setIdeState("loading");
    setIdeMessage("Cloning & opening…");

    try {
      const result = await openInIde(ide.id, repo.htmlUrl, repo.fullName);
      setIdeState("success");
      setIdeMessage(
        result.cloned
          ? `Cloned & opened in ${result.ideName}`
          : `Opened in ${result.ideName}`
      );
      setTimeout(() => setIdeState("idle"), 4000);
    } catch (err) {
      setIdeState("error");
      const message =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : "Failed to open in IDE";
      setIdeMessage(message);
      setTimeout(() => setIdeState("idle"), 6000);
    }
  };

  const buttonClass = `flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
    ideState === "success"
      ? "bg-gh-success/20 text-gh-success"
      : ideState === "error"
        ? "bg-gh-danger/20 text-gh-danger"
        : ideState === "loading"
          ? "bg-gh-border text-gh-text-secondary cursor-wait"
          : ides.length === 0
            ? "bg-gh-border/50 text-gh-text-secondary cursor-not-allowed"
            : "bg-gh-accent/15 text-gh-accent hover:bg-gh-accent/25"
  }`;

  return (
    <div className="flex flex-col bg-gh-card border border-gh-border rounded-lg p-4 hover:border-gh-text-secondary transition-colors group">
      {/* Repo name */}
      <div className="flex items-start justify-between mb-2">
        <a
          href={repo.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-gh-accent hover:underline truncate"
        >
          {repo.name}
        </a>
        {repo.fork && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gh-border text-gh-text-secondary ml-2 flex-shrink-0">
            forked
          </span>
        )}
      </div>

      {/* Description */}
      {repo.description && (
        <p className="text-xs text-gh-text-secondary mb-3 line-clamp-2">
          {repo.description}
        </p>
      )}

      {/* Topics */}
      {repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {repo.topics.slice(0, 5).map((topic) => (
            <span
              key={topic}
              className="text-[10px] px-2 py-0.5 rounded-full bg-gh-accent/10 text-gh-accent"
            >
              {topic}
            </span>
          ))}
          {repo.topics.length > 5 && (
            <span className="text-[10px] text-gh-text-secondary">
              +{repo.topics.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gh-text-secondary">
        {repo.language && (
          <span className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: getLanguageColor(repo.language) }}
            />
            {repo.language}
          </span>
        )}
        {repo.stargazersCount > 0 && (
          <span className="flex items-center gap-1">
            ★ {formatCount(repo.stargazersCount)}
          </span>
        )}
        {repo.forksCount > 0 && (
          <span className="flex items-center gap-1">
            🍴 {formatCount(repo.forksCount)}
          </span>
        )}
        <span className="ml-auto">
          Updated {formatDate(repo.pushedAt || repo.updatedAt)}
        </span>
      </div>

      {/* Archived badge */}
      {repo.archived && (
        <div className="mt-2 text-[10px] text-gh-warning bg-gh-warning/10 px-2 py-1 rounded">
          ⚠ Archived
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gh-border/50">
        {/* IDE selector dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() =>
              ides.length > 0 && ideState === "idle" && setMenuOpen(!menuOpen)
            }
            disabled={ideState === "loading" || ides.length === 0}
            className={buttonClass}
            title={
              ides.length === 0
                ? "No IDE detected. Install one and add to PATH."
                : "Clone this repository and open it in an IDE"
            }
          >
            {ideState === "loading" && (
              <>
                <span className="inline-block w-3 h-3 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />
                Opening…
              </>
            )}
            {ideState === "success" && <>✓ {activeIdeName}</>}
            {ideState === "error" && <>✕ Failed</>}
            {ideState === "idle" && (
              <>
                <IdeIcon id="default" className="w-3.5 h-3.5" />
                Open in IDE
                {ides.length > 0 && (
                  <span className="text-[8px] opacity-70">▼</span>
                )}
              </>
            )}
          </button>

          {/* Dropdown menu */}
          {menuOpen && ides.length > 0 && (
            <div className="absolute bottom-full mb-1 left-0 z-20 min-w-[190px] bg-gh-dark border border-gh-border rounded-lg shadow-xl py-1 max-h-64 overflow-y-auto custom-scrollbar">
              {ides.map((ide) => (
                <button
                  key={ide.id}
                  onClick={() => handleSelectIde(ide)}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gh-text hover:bg-gh-border/50 transition-colors text-left"
                >
                  <IdeIcon id={ide.id} className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{ide.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <a
          href={repo.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium text-gh-text-secondary hover:text-gh-text hover:bg-gh-border/50 transition-colors"
        >
          ↗ GitHub
        </a>

        {ideMessage && ideState !== "idle" && (
          <span
            className={`text-[10px] truncate flex-1 ${
              ideState === "error"
                ? "text-gh-danger"
                : "text-gh-text-secondary"
            }`}
          >
            {ideMessage}
          </span>
        )}
      </div>
    </div>
  );
}
