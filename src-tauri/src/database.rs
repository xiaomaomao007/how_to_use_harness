use rusqlite::{Connection, params};
use std::sync::Mutex;

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new() -> Result<Self, String> {
        let db_dir = dirs::data_local_dir()
            .ok_or_else(|| "Cannot find data directory".to_string())?
            .join("github-community-manager");

        std::fs::create_dir_all(&db_dir)
            .map_err(|e| format!("Failed to create data dir: {}", e))?;

        let db_path = db_dir.join("data.db");
        let conn = Connection::open(&db_path)
            .map_err(|e| format!("Failed to open database: {}", e))?;

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS followed_entities (
                id INTEGER PRIMARY KEY,
                login TEXT NOT NULL UNIQUE,
                avatar_url TEXT NOT NULL,
                html_url TEXT NOT NULL,
                name TEXT,
                description TEXT,
                entity_type TEXT NOT NULL CHECK(entity_type IN ('user', 'org')),
                public_repos INTEGER DEFAULT 0,
                followers INTEGER DEFAULT 0,
                followed_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS entity_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cache_key TEXT UNIQUE NOT NULL,
                data TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_cache_key ON entity_cache(cache_key);",
        )
        .map_err(|e| format!("Failed to create tables: {}", e))?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn add_entity(&self, entity: &crate::models::FollowedEntity) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT OR REPLACE INTO followed_entities (id, login, avatar_url, html_url, name, description, entity_type, public_repos, followers, followed_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                entity.id,
                entity.login,
                entity.avatar_url,
                entity.html_url,
                entity.name,
                entity.description,
                entity.entity_type,
                entity.public_repos,
                entity.followers,
                entity.followed_at,
            ],
        )
        .map_err(|e| format!("Insert entity failed: {}", e))?;
        Ok(())
    }

    pub fn remove_entity(&self, login: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "DELETE FROM followed_entities WHERE login = ?1",
            params![login],
        )
        .map_err(|e| format!("Delete entity failed: {}", e))?;
        Ok(())
    }

    pub fn get_entities(&self) -> Result<Vec<crate::models::FollowedEntity>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT id, login, avatar_url, html_url, name, description, entity_type, public_repos, followers, followed_at FROM followed_entities ORDER BY followed_at DESC",
            )
            .map_err(|e| format!("Prepare failed: {}", e))?;

        let entities = stmt
            .query_map([], |row| {
                Ok(crate::models::FollowedEntity {
                    id: row.get(0)?,
                    login: row.get(1)?,
                    avatar_url: row.get(2)?,
                    html_url: row.get(3)?,
                    name: row.get(4)?,
                    description: row.get(5)?,
                    entity_type: row.get(6)?,
                    public_repos: row.get(7)?,
                    followers: row.get(8)?,
                    followed_at: row.get(9)?,
                })
            })
            .map_err(|e| format!("Query failed: {}", e))?
            .filter_map(|e| e.ok())
            .collect();

        Ok(entities)
    }

    pub fn set_cache(&self, key: &str, data: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO entity_cache (cache_key, data, updated_at)
             VALUES (?1, ?2, datetime('now'))
             ON CONFLICT(cache_key) DO UPDATE SET
                data = excluded.data,
                updated_at = datetime('now')",
            params![key, data],
        )
        .map_err(|e| format!("Cache set failed: {}", e))?;
        Ok(())
    }

    pub fn get_cache(&self, key: &str) -> Result<Option<CachedEntry>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare("SELECT data, updated_at FROM entity_cache WHERE cache_key = ?1")
            .map_err(|e| format!("Cache query failed: {}", e))?;

        let result = stmt
            .query_row(params![key], |row| {
                Ok(CachedEntry {
                    data: row.get(0)?,
                    updated_at: row.get(1)?,
                })
            })
            .optional()
            .map_err(|e| format!("Cache read failed: {}", e))?;

        Ok(result)
    }

    pub fn clear_all_cache(&self) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM entity_cache", [])
            .map_err(|e| format!("Cache clear failed: {}", e))?;
        Ok(())
    }
}

pub struct CachedEntry {
    pub data: String,
    pub updated_at: String,
}

trait OptionalExt<T> {
    fn optional(self) -> Result<Option<T>, rusqlite::Error>;
}

impl<T> OptionalExt<T> for Result<T, rusqlite::Error> {
    fn optional(self) -> Result<Option<T>, rusqlite::Error> {
        match self {
            Ok(v) => Ok(Some(v)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }
}
