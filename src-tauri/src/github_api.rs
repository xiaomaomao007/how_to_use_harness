use crate::models::*;
use octocrab::Octocrab;

pub struct GithubClient {
    crab: Octocrab,
}

impl GithubClient {
    pub fn new(token: Option<String>) -> Result<Self, String> {
        let builder = Octocrab::builder();
        let crab = match token {
            Some(t) if !t.is_empty() => builder
                .personal_token(t)
                .build()
                .map_err(|e| format!("Failed to build Octocrab client: {}", e))?,
            _ => builder
                .build()
                .map_err(|e| format!("Failed to build Octocrab client: {}", e))?,
        };
        Ok(Self { crab })
    }

    /// Fetch a single user/org profile to get public_repos & followers.
    pub async fn get_user_profile(&self, login: &str) -> Result<GithubUser, String> {
        let route = format!("/users/{}", login);
        let v: serde_json::Value = self
            .crab
            .get(&route, None::<&()>)
            .await
            .map_err(|e| format!("Get user profile failed: {}", e))?;

        Ok(GithubUser {
            login: v["login"].as_str().unwrap_or("").to_string(),
            id: v["id"].as_i64().unwrap_or(0) as u64,
            avatar_url: v["avatar_url"].as_str().unwrap_or("").to_string(),
            html_url: v["html_url"].as_str().unwrap_or("").to_string(),
            name: v["name"].as_str().map(|s| s.to_string()),
            bio: v["bio"].as_str().map(|s| s.to_string()),
            public_repos: v["public_repos"].as_i64().map(|n| n as i32),
            followers: v["followers"].as_i64().map(|n| n as i32),
            r#type: v["type"].as_str().unwrap_or("User").to_string(),
        })
    }

    pub async fn search_users(
        &self,
        query: &str,
        page: u32,
    ) -> Result<(Vec<GithubUser>, u32), String> {
        let result = self
            .crab
            .search()
            .users(query)
            .per_page(30u8)
            .page(page)
            .send()
            .await
            .map_err(|e| format!("Search users failed: {}", e))?;

        let total = result.total_count.unwrap_or(0) as u32;
        let users: Vec<GithubUser> = result
            .items
            .into_iter()
            .map(|u| GithubUser {
                login: u.login,
                id: u.id.into_inner(),
                avatar_url: u.avatar_url.to_string(),
                html_url: u.html_url.to_string(),
                name: None,
                bio: None,
                public_repos: None,
                followers: None,
                r#type: u.r#type,
            })
            .collect();

        Ok((users, total))
    }

    pub async fn search_orgs(
        &self,
        query: &str,
        page: u32,
    ) -> Result<(Vec<GithubUser>, u32), String> {
        let full_query = format!("{} type:org", query);
        let result = self
            .crab
            .search()
            .users(&full_query)
            .per_page(30u8)
            .page(page)
            .send()
            .await
            .map_err(|e| format!("Search orgs failed: {}", e))?;

        let total = result.total_count.unwrap_or(0) as u32;
        let users: Vec<GithubUser> = result
            .items
            .into_iter()
            .map(|u| GithubUser {
                login: u.login,
                id: u.id.into_inner(),
                avatar_url: u.avatar_url.to_string(),
                html_url: u.html_url.to_string(),
                name: None,
                bio: None,
                public_repos: None,
                followers: None,
                r#type: u.r#type,
            })
            .collect();

        Ok((users, total))
    }

    pub async fn get_repos(
        &self,
        owner: &str,
        page: u32,
    ) -> Result<(Vec<GithubRepo>, u32), String> {
        let result = match self
            .crab
            .orgs(owner)
            .list_repos()
            .per_page(100u8)
            .page(page)
            .sort(octocrab::params::repos::Sort::Updated)
            .direction(octocrab::params::Direction::Descending)
            .send()
            .await
        {
            Ok(page_result) => page_result,
            Err(_) => self
                .crab
                .users(owner)
                .repos()
                .per_page(100u8)
                .page(page)
                .sort(octocrab::params::repos::Sort::Updated)
                .direction(octocrab::params::Direction::Descending)
                .send()
                .await
                .map_err(|e| format!("Get repos failed: {}", e))?,
        };

        let repos: Vec<GithubRepo> = result
            .items
            .into_iter()
            .map(|r| GithubRepo {
                id: r.id.into_inner(),
                name: r.name,
                full_name: r.full_name.unwrap_or_default(),
                owner: RepoOwner {
                    login: match &r.owner {
                        Some(o) => o.login.clone(),
                        None => String::new(),
                    },
                    avatar_url: match &r.owner {
                        Some(o) => o.avatar_url.to_string(),
                        None => String::new(),
                    },
                },
                description: r.description,
                html_url: match &r.html_url {
                    Some(url) => url.to_string(),
                    None => String::new(),
                },
                language: r.language.as_ref().and_then(|v: &serde_json::Value| v.as_str().map(|s| s.to_string())),
                fork: r.fork.unwrap_or(false),
                stargazers_count: r.stargazers_count.unwrap_or(0) as i32,
                forks_count: r.forks_count.unwrap_or(0) as i32,
                open_issues_count: r.open_issues_count.unwrap_or(0) as i32,
                topics: r.topics.unwrap_or_default(),
                updated_at: match &r.updated_at {
                    Some(d) => d.to_string(),
                    None => String::new(),
                },
                pushed_at: r.pushed_at.as_ref().map(|d| d.to_string()),
                archived: r.archived.unwrap_or(false),
            })
            .collect();

        Ok((repos, 0))
    }

    pub async fn get_activities(
        &self,
        username: &str,
        page: u32,
    ) -> Result<(Vec<GithubActivity>, u32), String> {
        let org_route = format!("/orgs/{}/events?per_page=30&page={}", username, page);
        let user_route = format!("/users/{}/events?per_page=30&page={}", username, page);
        let route = match self
            .crab
            .get::<serde_json::Value, _, _>(&org_route, None::<&()>)
            .await
        {
            Ok(_) => org_route,
            Err(_) => user_route,
        };
        let events: Vec<serde_json::Value> = self
            .crab
            .get(&route, None::<&()>)
            .await
            .map_err(|e| format!("Get activities failed: {}", e))?;

        let activities: Vec<GithubActivity> = events
            .into_iter()
            .map(|e| {
                let actor = &e["actor"];
                let repo = &e["repo"];
                GithubActivity {
                    id: e["id"].as_str().unwrap_or("").to_string(),
                    r#type: e["type"].as_str().unwrap_or("").to_string(),
                    actor: Actor {
                        login: actor["login"].as_str().unwrap_or("").to_string(),
                        display_login: actor["display_login"]
                            .as_str()
                            .map(|s| s.to_string()),
                        avatar_url: actor["avatar_url"]
                            .as_str()
                            .unwrap_or("")
                            .to_string(),
                    },
                    repo: ActivityRepo {
                        name: repo["name"].as_str().unwrap_or("").to_string(),
                        url: repo["url"].as_str().unwrap_or("").to_string(),
                    },
                    created_at: e["created_at"]
                        .as_str()
                        .unwrap_or("")
                        .to_string(),
                    payload: e["payload"].clone(),
                }
            })
            .collect();

        Ok((activities, 0))
    }
}
