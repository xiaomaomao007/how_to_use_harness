use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GithubUser {
    pub login: String,
    pub id: u64,
    pub avatar_url: String,
    pub html_url: String,
    pub name: Option<String>,
    pub bio: Option<String>,
    pub public_repos: Option<i32>,
    pub followers: Option<i32>,
    pub r#type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GithubRepo {
    pub id: u64,
    pub name: String,
    pub full_name: String,
    pub owner: RepoOwner,
    pub description: Option<String>,
    pub html_url: String,
    pub language: Option<String>,
    pub fork: bool,
    pub stargazers_count: i32,
    pub forks_count: i32,
    pub open_issues_count: i32,
    pub topics: Vec<String>,
    pub updated_at: String,
    pub pushed_at: Option<String>,
    pub archived: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RepoOwner {
    pub login: String,
    pub avatar_url: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GithubActivity {
    pub id: String,
    pub r#type: String,
    pub actor: Actor,
    pub repo: ActivityRepo,
    pub created_at: String,
    pub payload: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Actor {
    pub login: String,
    pub display_login: Option<String>,
    pub avatar_url: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ActivityRepo {
    pub name: String,
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FollowedEntity {
    pub id: i64,
    pub login: String,
    pub avatar_url: String,
    pub html_url: String,
    pub name: Option<String>,
    pub description: Option<String>,
    pub entity_type: String,
    pub public_repos: i32,
    pub followers: i32,
    pub followed_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchResult<T> {
    pub items: Vec<T>,
    pub total: u32,
    pub page: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CacheInfo {
    pub cached: bool,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IdeInfo {
    pub id: String,
    pub name: String,
    pub path: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OpenInIdeResult {
    pub path: String,
    pub cloned: bool,
    pub ide_name: String,
}
