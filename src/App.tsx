import { useState, useEffect, useCallback } from "react";
import type { FollowedEntity } from "./types/github";
import Sidebar from "./components/Sidebar";
import RepoList from "./components/RepoList";
import ActivityFeed from "./components/ActivityFeed";
import { useFollow } from "./hooks/useFollow";
import { useRepos } from "./hooks/useRepos";
import { useActivities } from "./hooks/useActivities";

type Tab = "repos" | "activity";

function App() {
  const { entities, loading: followLoading, addEntity, removeEntity } = useFollow();
  const [selectedEntity, setSelectedEntity] = useState<FollowedEntity | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("repos");

  const {
    repos,
    loading: reposLoading,
    error: reposError,
    fetchRepos,
  } = useRepos();

  const {
    activities,
    loading: activitiesLoading,
    error: activitiesError,
    fetchActivities,
  } = useActivities();

  const loadEntityData = useCallback(
    async (entity: FollowedEntity) => {
      if (activeTab === "repos") {
        await fetchRepos(entity.login);
      } else {
        await fetchActivities(entity.login);
      }
    },
    [activeTab, fetchRepos, fetchActivities]
  );

  useEffect(() => {
    if (selectedEntity) {
      loadEntityData(selectedEntity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntity]);

  useEffect(() => {
    if (selectedEntity) {
      loadEntityData(selectedEntity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (entities.length > 0 && !selectedEntity) {
      setSelectedEntity(entities[0]);
    }
    if (entities.length === 0) {
      setSelectedEntity(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entities]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "1") {
        e.preventDefault();
        setActiveTab("repos");
      }
      if (e.ctrlKey && e.key === "2") {
        e.preventDefault();
        setActiveTab("activity");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-gh-dark text-gh-text">
      <Sidebar
        entities={entities}
        selectedEntity={selectedEntity}
        onSelect={setSelectedEntity}
        onAdd={addEntity}
        onRemove={removeEntity}
        loading={followLoading}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {selectedEntity ? (
          <>
            {/* Entity header */}
            <header className="border-b border-gh-border px-6 py-3 bg-gh-dark/80">
              <div className="flex items-center gap-3">
                <img
                  src={selectedEntity.avatarUrl}
                  alt={selectedEntity.login}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <a
                      href={selectedEntity.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-gh-accent hover:underline"
                    >
                      {selectedEntity.login}
                    </a>
                    {selectedEntity.entityType === "org" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gh-accent/20 text-gh-accent font-medium">
                        ORG
                      </span>
                    )}
                  </div>
                  {selectedEntity.name && (
                    <p className="text-xs text-gh-text-secondary">
                      {selectedEntity.name}
                    </p>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-4 text-xs text-gh-text-secondary">
                  <span>{selectedEntity.publicRepos} repos</span>
                  <span>{selectedEntity.followers} followers</span>
                </div>
              </div>
            </header>

            {/* Tab bar */}
            <div className="flex border-b border-gh-border bg-gh-dark/50">
              <button
                onClick={() => setActiveTab("repos")}
                className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "repos"
                    ? "border-gh-accent text-gh-accent"
                    : "border-transparent text-gh-text-secondary hover:text-gh-text"
                }`}
              >
                📦 Repositories
                <span className="ml-1.5 text-xs opacity-60">
                  {repos.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "activity"
                    ? "border-gh-accent text-gh-accent"
                    : "border-transparent text-gh-text-secondary hover:text-gh-text"
                }`}
              >
                📡 Activity
                <span className="ml-1.5 text-xs opacity-60">
                  {activities.length}
                </span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0">
              {activeTab === "repos" ? (
                <RepoList
                  repos={repos}
                  loading={reposLoading}
                  error={reposError}
                  onRetry={() => fetchRepos(selectedEntity.login)}
                />
              ) : (
                <ActivityFeed
                  activities={activities}
                  loading={activitiesLoading}
                  error={activitiesError}
                  onRetry={() => fetchActivities(selectedEntity.login)}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">🌐</div>
              <h2 className="text-xl font-semibold mb-2">
                GitHub Community Manager
              </h2>
              <p className="text-gh-text-secondary text-sm max-w-sm">
                Follow open source communities to track their repositories,
                activities, releases, and more.
              </p>
              <p className="text-xs text-gh-text-secondary mt-4">
                Press <kbd className="px-1.5 py-0.5 bg-gh-border rounded text-[11px]">+</kbd> in the sidebar to get started
              </p>
              <div className="mt-6 flex justify-center gap-4 text-xs text-gh-text-secondary">
                <span><kbd className="px-1.5 py-0.5 bg-gh-border rounded text-[11px]">Ctrl+1</kbd> Repos</span>
                <span><kbd className="px-1.5 py-0.5 bg-gh-border rounded text-[11px]">Ctrl+2</kbd> Activity</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
