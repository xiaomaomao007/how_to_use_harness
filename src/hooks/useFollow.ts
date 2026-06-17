import { useState, useEffect, useCallback } from "react";
import type { FollowedEntity } from "../types/github";
import {
  getFollowedEntities,
  addFollowedEntity,
  removeFollowedEntity,
} from "../services/github";

export function useFollow() {
  const [entities, setEntities] = useState<FollowedEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFollowedEntities();
      setEntities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  const addEntity = useCallback(
    async (entity: FollowedEntity) => {
      try {
        setError(null);
        await addFollowedEntity(entity);
        await loadEntities();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add entity");
      }
    },
    [loadEntities]
  );

  const removeEntity = useCallback(
    async (login: string) => {
      try {
        setError(null);
        await removeFollowedEntity(login);
        await loadEntities();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to remove entity"
        );
      }
    },
    [loadEntities]
  );

  return { entities, loading, error, addEntity, removeEntity, refresh: loadEntities };
}
