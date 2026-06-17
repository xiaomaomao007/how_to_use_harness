import { useState, useMemo } from "react";
import type { GitHubActivity } from "../types/github";
import { EVENT_TYPE_ICONS, formatDate } from "../utils/github";

interface ActivityFeedProps {
  activities: GitHubActivity[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export default function ActivityFeed({
  activities,
  loading,
  error,
  onRetry,
}: ActivityFeedProps) {
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const eventTypes = useMemo(() => {
    const types = new Set(activities.map((a) => a.type));
    return Array.from(types).sort();
  }, [activities]);

  const filteredActivities = useMemo(() => {
    if (typeFilter === "all") return activities;
    return activities.filter((a) => a.type === typeFilter);
  }, [activities, typeFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, GitHubActivity[]> = {};
    filteredActivities.forEach((activity) => {
      const date = new Date(activity.createdAt).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(activity);
    });
    return groups;
  }, [filteredActivities]);

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
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-gh-border bg-gh-dark/50">
        <button
          onClick={() => setTypeFilter("all")}
          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
            typeFilter === "all"
              ? "bg-gh-accent text-white"
              : "bg-gh-border text-gh-text-secondary hover:text-gh-text"
          }`}
        >
          All ({activities.length})
        </button>
        {eventTypes.map((type) => {
          const info = EVENT_TYPE_ICONS[type] || { icon: "📌", label: type };
          const count = activities.filter((a) => a.type === type).length;
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(type === typeFilter ? "all" : type)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1 ${
                typeFilter === type
                  ? "bg-gh-accent text-white"
                  : "bg-gh-border text-gh-text-secondary hover:text-gh-text"
              }`}
            >
              <span>{info.icon}</span>
              <span>{info.label}</span>
              <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gh-border rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-3 bg-gh-border rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gh-border rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredActivities.length === 0 && activities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-4xl mb-3 animate-bounce">📡</div>
            <p className="text-gh-text-secondary text-sm">
              No recent activities
            </p>
          </div>
        )}

        {!loading && filteredActivities.length === 0 && activities.length > 0 && (
          <div className="text-center py-12">
            <p className="text-gh-text-secondary text-sm">
              No activities match your filter
            </p>
          </div>
        )}

        {!loading && Object.keys(grouped).length > 0 && (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                <h3 className="text-xs font-semibold text-gh-text-secondary mb-3 sticky top-0 bg-gh-dark py-1">
                  {date}
                </h3>
                <div className="space-y-3">
                  {items.map((activity) => {
                    const info =
                      EVENT_TYPE_ICONS[activity.type] || {
                        icon: "📌",
                        color: "text-gh-text-secondary",
                        label: activity.type,
                      };

                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 bg-gh-card border border-gh-border rounded-lg p-3 hover:border-gh-text-secondary transition-colors"
                      >
                        <img
                          src={activity.actor.avatarUrl}
                          alt={activity.actor.login}
                          className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className={`text-[11px] px-1.5 py-0.5 rounded ${info.color} bg-gh-dark`}
                            >
                              {info.icon} {info.label}
                            </span>
                            <a
                              href={`https://github.com/${activity.actor.login}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-gh-accent hover:underline"
                            >
                              {activity.actor.login}
                            </a>
                          </div>
                          <a
                            href={`https://github.com/${activity.repo.name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gh-text-secondary hover:text-gh-text hover:underline"
                          >
                            {activity.repo.name}
                          </a>
                          {activity.type === "PushEvent" &&
                            Boolean(activity.payload.commits) && (
                              <div className="mt-1.5 space-y-1">
                                {(activity.payload.commits as Array<{ message: string; sha: string }>)
                                  .slice(0, 3)
                                  .map((commit) => (
                                    <div
                                      key={commit.sha}
                                      className="text-[11px] text-gh-text-secondary pl-2 border-l-2 border-gh-border"
                                    >
                                      {commit.message.length > 80
                                        ? commit.message.slice(0, 80) + "…"
                                        : commit.message}
                                    </div>
                                  ))}
                              </div>
                            )}
                        </div>
                        <span className="text-[11px] text-gh-text-secondary whitespace-nowrap">
                          {formatDate(activity.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
