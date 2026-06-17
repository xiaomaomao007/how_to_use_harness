import { useState } from "react";
import type { FollowedEntity } from "../types/github";
import FollowList from "./FollowList";
import AddFollow from "./AddFollow";

interface SidebarProps {
  entities: FollowedEntity[];
  selectedEntity: FollowedEntity | null;
  onSelect: (entity: FollowedEntity) => void;
  onAdd: (entity: FollowedEntity) => void;
  onRemove: (login: string) => void;
  loading: boolean;
}

export default function Sidebar({
  entities,
  selectedEntity,
  onSelect,
  onAdd,
  onRemove,
  loading,
}: SidebarProps) {
  const [showAdd, setShowAdd] = useState(false);

  const existingLogins = new Set(entities.map((e) => e.login));

  return (
    <aside className="w-64 border-r border-gh-border bg-gh-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gh-border">
        <h2 className="text-sm font-semibold text-gh-text">Communities</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="text-gh-accent hover:text-blue-400 text-lg leading-none"
          title="Add Community"
        >
          +
        </button>
      </div>

      {/* Filter */}
      <div className="px-3 py-2">
        <input
          className="w-full bg-gh-dark border border-gh-border rounded px-3 py-1.5 text-xs text-gh-text placeholder:text-gh-text-secondary focus:outline-none focus:border-gh-accent"
          placeholder="Filter communities..."
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <FollowList
          entities={entities}
          selectedLogin={selectedEntity?.login ?? null}
          onSelect={onSelect}
          onRemove={onRemove}
          loading={loading}
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gh-border text-xs text-gh-text-secondary">
        {entities.length} communities followed
      </div>

      {/* Add modal */}
      {showAdd && (
        <AddFollow
          onAdd={onAdd}
          existingLogins={existingLogins}
          onClose={() => setShowAdd(false)}
        />
      )}
    </aside>
  );
}
