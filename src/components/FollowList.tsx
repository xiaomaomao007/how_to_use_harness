import type { FollowedEntity } from "../types/github";

interface FollowListProps {
  entities: FollowedEntity[];
  selectedLogin: string | null;
  onSelect: (entity: FollowedEntity) => void;
  onRemove: (login: string) => void;
  loading: boolean;
}

export default function FollowList({
  entities,
  selectedLogin,
  onSelect,
  onRemove,
  loading,
}: FollowListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-5 h-5 border-2 border-gh-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (entities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-4xl mb-3 animate-bounce">🌐</div>
        <p className="text-sm text-gh-text-secondary text-center">
          No communities followed yet
        </p>
        <p className="text-xs text-gh-text-secondary mt-1">
          Click + to start following
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 px-2">
      {entities.map((entity) => {
        const isSelected = entity.login === selectedLogin;
        return (
          <div
            key={entity.login}
            className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer group transition-colors ${
              isSelected
                ? "bg-gh-accent/10 border border-gh-accent/30"
                : "hover:bg-gh-card-hover border border-transparent"
            }`}
            onClick={() => onSelect(entity)}
          >
            <img
              src={entity.avatarUrl}
              alt={entity.login}
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-sm font-medium truncate ${
                    isSelected ? "text-gh-accent" : "text-gh-text"
                  }`}
                >
                  {entity.login}
                </span>
                {entity.entityType === "org" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gh-accent/20 text-gh-accent font-medium flex-shrink-0">
                    ORG
                  </span>
                )}
              </div>
              <p className="text-xs text-gh-text-secondary truncate">
                {entity.name || entity.description || `${entity.publicRepos} repos`}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(entity.login);
              }}
              className="opacity-0 group-hover:opacity-100 text-gh-text-secondary hover:text-gh-danger text-xs p-1 transition-opacity"
              title="Unfollow"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
