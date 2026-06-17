use crate::database::Database;
use crate::github_api::GithubClient;
use crate::models::*;
use std::path::PathBuf;
use std::process::Command;
use tauri::State;

#[tauri::command]
pub async fn get_user_profile(
    login: String,
    token: Option<String>,
) -> Result<GithubUser, String> {
    let client = GithubClient::new(token)?;
    client.get_user_profile(&login).await
}

#[tauri::command]
pub async fn search_github_entity(
    query: String,
    page: Option<u32>,
    token: Option<String>,
) -> Result<SearchResult<GithubUser>, String> {
    let client = GithubClient::new(token)?;
    let page = page.unwrap_or(1);
    let (users, total) = client.search_users(&query, page).await?;
    Ok(SearchResult {
        items: users,
        total,
        page,
    })
}

#[tauri::command]
pub async fn search_github_orgs(
    query: String,
    page: Option<u32>,
    token: Option<String>,
) -> Result<SearchResult<GithubUser>, String> {
    let client = GithubClient::new(token)?;
    let page = page.unwrap_or(1);
    let (users, total) = client.search_orgs(&query, page).await?;
    Ok(SearchResult {
        items: users,
        total,
        page,
    })
}

#[tauri::command]
pub async fn get_github_repos(
    owner: String,
    page: Option<u32>,
    token: Option<String>,
    db: State<'_, Database>,
) -> Result<SearchResult<GithubRepo>, String> {
    let client = GithubClient::new(token)?;
    let page = page.unwrap_or(1);
    let (repos, total) = client.get_repos(&owner, page).await?;

    // Auto-cache on successful fetch
    let cache_key = format!("repos:{}", owner);
    let data = serde_json::to_string(&repos).unwrap_or_default();
    let _ = db.set_cache(&cache_key, &data);

    Ok(SearchResult {
        items: repos,
        total,
        page,
    })
}

#[tauri::command]
pub async fn get_github_activities(
    username: String,
    page: Option<u32>,
    token: Option<String>,
    db: State<'_, Database>,
) -> Result<SearchResult<GithubActivity>, String> {
    let client = GithubClient::new(token)?;
    let page = page.unwrap_or(1);
    let (activities, total) = client.get_activities(&username, page).await?;

    // Auto-cache on successful fetch
    let cache_key = format!("activities:{}", username);
    let data = serde_json::to_string(&activities).unwrap_or_default();
    let _ = db.set_cache(&cache_key, &data);

    Ok(SearchResult {
        items: activities,
        total,
        page,
    })
}

#[tauri::command]
pub fn add_followed_entity(
    entity: FollowedEntity,
    db: State<'_, Database>,
) -> Result<(), String> {
    db.add_entity(&entity)
}

#[tauri::command]
pub fn remove_followed_entity(
    login: String,
    db: State<'_, Database>,
) -> Result<(), String> {
    db.remove_entity(&login)
}

#[tauri::command]
pub fn get_followed_entities(
    db: State<'_, Database>,
) -> Result<Vec<FollowedEntity>, String> {
    db.get_entities()
}

/// Store GitHub token to local config file
#[tauri::command]
pub fn save_github_token(token: String) -> Result<(), String> {
    let config_dir = dirs::config_dir()
        .ok_or_else(|| "Cannot find config directory".to_string())?
        .join("github-community-manager");

    std::fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config dir: {}", e))?;

    let config_file = config_dir.join("token.txt");
    std::fs::write(&config_file, token)
        .map_err(|e| format!("Failed to save token: {}", e))?;

    Ok(())
}

/// Load GitHub token from local config file
#[tauri::command]
pub fn load_github_token() -> Result<Option<String>, String> {
    let config_dir = match dirs::config_dir() {
        Some(d) => d.join("github-community-manager"),
        None => return Ok(None),
    };

    let config_file = config_dir.join("token.txt");
    if !config_file.exists() {
        return Ok(None);
    }

    let token = std::fs::read_to_string(&config_file)
        .map_err(|e| format!("Failed to read token: {}", e))?;

    let token = token.trim().to_string();
    if token.is_empty() {
        Ok(None)
    } else {
        Ok(Some(token))
    }
}

#[tauri::command]
pub fn get_cache_info(
    key: String,
    db: State<'_, Database>,
) -> Result<CacheInfo, String> {
    match db.get_cache(&key)? {
        Some(entry) => Ok(CacheInfo {
            cached: true,
            updated_at: Some(entry.updated_at),
        }),
        None => Ok(CacheInfo {
            cached: false,
            updated_at: None,
        }),
    }
}

#[tauri::command]
pub fn get_cached_data(
    key: String,
    db: State<'_, Database>,
) -> Result<Option<String>, String> {
    match db.get_cache(&key)? {
        Some(entry) => Ok(Some(entry.data)),
        None => Ok(None),
    }
}

#[tauri::command]
pub fn clear_all_cache(db: State<'_, Database>) -> Result<(), String> {
    db.clear_all_cache()
}

// ============================================================
// Multi-IDE support
// ============================================================

/// Configuration for a supported IDE.
struct IdeConfig {
    id: &'static str,
    name: &'static str,
    launchers: &'static [&'static str],
    dir_keywords: &'static [&'static str],
    win_exe: &'static str,
    mac_app_name: &'static str,
    mac_launcher: &'static str,
    linux_bin: &'static str,
    is_jetbrains: bool,
}

/// Registry of all supported IDEs.
const IDE_CONFIGS: &[IdeConfig] = &[
    IdeConfig {
        id: "intellij-idea",
        name: "IntelliJ IDEA",
        launchers: &["idea", "idea64", "idea.bat"],
        dir_keywords: &["intellij idea", "idea"],
        win_exe: "idea64.exe",
        mac_app_name: "IntelliJ IDEA",
        mac_launcher: "idea",
        linux_bin: "idea.sh",
        is_jetbrains: true,
    },
    IdeConfig {
        id: "vscode",
        name: "VS Code",
        launchers: &["code", "code.cmd", "code-insiders"],
        dir_keywords: &["code"],
        win_exe: "Code.exe",
        mac_app_name: "Visual Studio Code",
        mac_launcher: "code",
        linux_bin: "code",
        is_jetbrains: false,
    },
    IdeConfig {
        id: "cursor",
        name: "Cursor",
        launchers: &["cursor", "cursor.cmd"],
        dir_keywords: &["cursor"],
        win_exe: "Cursor.exe",
        mac_app_name: "Cursor",
        mac_launcher: "cursor",
        linux_bin: "cursor",
        is_jetbrains: false,
    },
    IdeConfig {
        id: "webstorm",
        name: "WebStorm",
        launchers: &["webstorm", "webstorm64", "webstorm.bat"],
        dir_keywords: &["webstorm"],
        win_exe: "webstorm64.exe",
        mac_app_name: "WebStorm",
        mac_launcher: "webstorm",
        linux_bin: "webstorm.sh",
        is_jetbrains: true,
    },
    IdeConfig {
        id: "pycharm",
        name: "PyCharm",
        launchers: &["pycharm", "pycharm64", "pycharm.bat"],
        dir_keywords: &["pycharm"],
        win_exe: "pycharm64.exe",
        mac_app_name: "PyCharm",
        mac_launcher: "pycharm",
        linux_bin: "pycharm.sh",
        is_jetbrains: true,
    },
    IdeConfig {
        id: "goland",
        name: "GoLand",
        launchers: &["goland", "goland64", "goland.bat"],
        dir_keywords: &["goland"],
        win_exe: "goland64.exe",
        mac_app_name: "GoLand",
        mac_launcher: "goland",
        linux_bin: "goland.sh",
        is_jetbrains: true,
    },
    IdeConfig {
        id: "rustrover",
        name: "RustRover",
        launchers: &["rust-rover", "rustrover"],
        dir_keywords: &["rustrover", "rust-rover"],
        win_exe: "rustrover64.exe",
        mac_app_name: "RustRover",
        mac_launcher: "rust-rover",
        linux_bin: "rust-rover.sh",
        is_jetbrains: true,
    },
    IdeConfig {
        id: "clion",
        name: "CLion",
        launchers: &["clion", "clion64", "clion.bat"],
        dir_keywords: &["clion"],
        win_exe: "clion64.exe",
        mac_app_name: "CLion",
        mac_launcher: "clion",
        linux_bin: "clion.sh",
        is_jetbrains: true,
    },
    IdeConfig {
        id: "phpstorm",
        name: "PhpStorm",
        launchers: &["phpstorm", "phpstorm64", "phpstorm.bat"],
        dir_keywords: &["phpstorm"],
        win_exe: "phpstorm64.exe",
        mac_app_name: "PhpStorm",
        mac_launcher: "phpstorm",
        linux_bin: "phpstorm.sh",
        is_jetbrains: true,
    },
    IdeConfig {
        id: "rider",
        name: "Rider",
        launchers: &["rider", "rider64", "rider.bat"],
        dir_keywords: &["rider"],
        win_exe: "rider64.exe",
        mac_app_name: "Rider",
        mac_launcher: "rider",
        linux_bin: "rider.sh",
        is_jetbrains: true,
    },
    IdeConfig {
        id: "android-studio",
        name: "Android Studio",
        launchers: &["studio", "studio64"],
        dir_keywords: &["android studio"],
        win_exe: "studio64.exe",
        mac_app_name: "Android Studio",
        mac_launcher: "studio",
        linux_bin: "studio.sh",
        is_jetbrains: true,
    },
    IdeConfig {
        id: "fleet",
        name: "Fleet",
        launchers: &["fleet"],
        dir_keywords: &["fleet"],
        win_exe: "fleet.exe",
        mac_app_name: "Fleet",
        mac_launcher: "Fleet",
        linux_bin: "fleet.sh",
        is_jetbrains: true,
    },
];

/// Scan the system and return all installed IDEs.
#[tauri::command]
pub fn list_available_ides() -> Result<Vec<IdeInfo>, String> {
    let mut ides = Vec::new();
    for config in IDE_CONFIGS {
        if let Some(path) = find_ide_path(config) {
            ides.push(IdeInfo {
                id: config.id.to_string(),
                name: config.name.to_string(),
                path,
            });
        }
    }
    Ok(ides)
}

/// Clone a GitHub repository (shallow) and open it in the specified IDE.
/// If the repo was already cloned, opens it directly without re-cloning.
#[tauri::command]
pub async fn open_in_ide(
    ide_id: String,
    repo_url: String,
    repo_name: String,
) -> Result<OpenInIdeResult, String> {
    let config = IDE_CONFIGS
        .iter()
        .find(|c| c.id == ide_id)
        .ok_or_else(|| format!("Unknown IDE: {}", ide_id))?;

    let ide_path = find_ide_path(config).ok_or_else(|| {
        format!(
            "{} not found. Please install it or add its command-line launcher to PATH.",
            config.name
        )
    })?;

    // --- 1. Determine clone directory ---
    let repos_dir = dirs::data_local_dir()
        .ok_or_else(|| "Cannot find local data directory".to_string())?
        .join("github-community-manager")
        .join("repos");

    std::fs::create_dir_all(&repos_dir)
        .map_err(|e| format!("Failed to create repos directory: {}", e))?;

    let safe_name = repo_name.replace('/', "_");
    let clone_path = repos_dir.join(&safe_name);
    let path_str = clone_path.to_string_lossy().to_string();

    let already_cloned = clone_path.exists() && clone_path.join(".git").exists();

    // --- 2. Clone if needed ---
    if !already_cloned {
        if clone_path.exists() {
            let _ = std::fs::remove_dir_all(&clone_path);
        }

        let clone_url = if repo_url.ends_with(".git") {
            repo_url.clone()
        } else {
            format!("{}.git", repo_url)
        };

        let output = Command::new("git")
            .args(["clone", "--depth", "1", &clone_url, &path_str])
            .output()
            .map_err(|e| {
                format!(
                    "Failed to run git. Is Git installed and in PATH? Error: {}",
                    e
                )
            })?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let _ = std::fs::remove_dir_all(&clone_path);
            return Err(format!("Git clone failed: {}", stderr.trim()));
        }
    }

    // --- 3. Launch IDE ---
    let lower = ide_path.to_lowercase();
    let is_batch = lower.ends_with(".cmd") || lower.ends_with(".bat");

    let spawn_result = if cfg!(windows) && is_batch {
        Command::new("cmd.exe")
            .arg("/C")
            .arg(&ide_path)
            .arg(&path_str)
            .spawn()
    } else {
        Command::new(&ide_path).arg(&path_str).spawn()
    };

    spawn_result.map_err(|e| format!("Failed to launch {}: {}", config.name, e))?;

    Ok(OpenInIdeResult {
        path: path_str,
        cloned: !already_cloned,
        ide_name: config.name.to_string(),
    })
}

// --- IDE detection helpers ---

/// Find an IDE executable: first PATH launchers, then filesystem search.
fn find_ide_path(config: &IdeConfig) -> Option<String> {
    // 1. Try command-line launchers in PATH
    for cmd in config.launchers {
        if let Some(p) = find_in_path(cmd) {
            return Some(p);
        }
    }

    // 2. Search filesystem
    if config.is_jetbrains {
        search_jetbrains_dirs(config)
    } else {
        search_custom_dirs(config)
    }
}

/// Look up a command name in PATH via `where` (Windows) or `which` (Unix).
fn find_in_path(cmd: &str) -> Option<String> {
    let probe = if cfg!(windows) {
        Command::new("where").arg(cmd).output()
    } else {
        Command::new("which").arg(cmd).output()
    };
    if let Ok(out) = probe {
        if out.status.success() {
            let stdout = String::from_utf8_lossy(&out.stdout);
            if cfg!(windows) {
                // `where` may return extensionless bash shims alongside
                // .exe/.cmd/.bat files. CreateProcess cannot execute
                // extensionless scripts or .cmd/.bat directly, so prefer
                // .exe, fall back to .cmd/.bat (launched via cmd /C later).
                let mut batch: Option<String> = None;
                for line in stdout.lines() {
                    let path = line.trim();
                    if path.is_empty() {
                        continue;
                    }
                    let lower = path.to_lowercase();
                    if lower.ends_with(".exe") {
                        return Some(path.to_string());
                    }
                    if batch.is_none()
                        && (lower.ends_with(".cmd") || lower.ends_with(".bat"))
                    {
                        batch = Some(path.to_string());
                    }
                }
                return batch;
            } else {
                if let Some(first) = stdout.lines().next() {
                    let path = first.trim();
                    if !path.is_empty() {
                        return Some(path.to_string());
                    }
                }
            }
        }
    }
    None
}

/// Search JetBrains installation directories for an IDE.
fn search_jetbrains_dirs(config: &IdeConfig) -> Option<String> {
    for dir in get_jetbrains_search_dirs() {
        if !dir.exists() {
            continue;
        }
        if let Ok(entries) = std::fs::read_dir(&dir) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_lowercase();
                if !config.dir_keywords.iter().any(|kw| name.contains(kw)) {
                    continue;
                }
                if let Some(p) = check_executable(&entry.path(), config) {
                    return Some(p);
                }
            }
        }
    }
    None
}

/// Search IDE-specific directories (VS Code, Cursor, etc.).
fn search_custom_dirs(config: &IdeConfig) -> Option<String> {
    for dir in get_custom_search_dirs(config) {
        if !dir.exists() {
            continue;
        }
        // For custom IDEs, the directory itself might be the install root
        if let Some(p) = check_executable(&dir, config) {
            return Some(p);
        }
        // Or a subdirectory
        if let Ok(entries) = std::fs::read_dir(&dir) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_lowercase();
                if !config.dir_keywords.iter().any(|kw| name.contains(kw)) {
                    continue;
                }
                if let Some(p) = check_executable(&entry.path(), config) {
                    return Some(p);
                }
            }
        }
    }
    None
}

/// Check if an IDE executable exists at the expected location.
fn check_executable(base: &PathBuf, config: &IdeConfig) -> Option<String> {
    if cfg!(windows) {
        let exe = base.join("bin").join(config.win_exe);
        if exe.exists() {
            return Some(exe.to_string_lossy().to_string());
        }
        // Some IDEs (VS Code) have the exe at root level
        let exe = base.join(config.win_exe);
        if exe.exists() {
            return Some(exe.to_string_lossy().to_string());
        }
    } else if cfg!(target_os = "macos") {
        let app = base.join(format!("{}.app", config.mac_app_name));
        if app.exists() {
            let launcher = app.join("Contents").join("MacOS").join(config.mac_launcher);
            if launcher.exists() {
                return Some(launcher.to_string_lossy().to_string());
            }
        }
        // base itself might be the .app
        if base.extension().and_then(|e| e.to_str()) == Some("app") {
            let launcher = base.join("Contents").join("MacOS").join(config.mac_launcher);
            if launcher.exists() {
                return Some(launcher.to_string_lossy().to_string());
            }
        }
    } else {
        let exe = base.join("bin").join(config.linux_bin);
        if exe.exists() {
            return Some(exe.to_string_lossy().to_string());
        }
    }
    None
}

/// Collect JetBrains installation directories across platforms.
fn get_jetbrains_search_dirs() -> Vec<PathBuf> {
    let mut dirs = Vec::new();
    if cfg!(windows) {
        if let Some(pf) = std::env::var_os("ProgramFiles") {
            dirs.push(PathBuf::from(pf).join("JetBrains"));
        }
        if let Some(pf) = std::env::var_os("ProgramFiles(x86)") {
            dirs.push(PathBuf::from(pf).join("JetBrains"));
        }
        if let Some(local) = std::env::var_os("LOCALAPPDATA") {
            dirs.push(
                PathBuf::from(local)
                    .join("JetBrains")
                    .join("Toolbox")
                    .join("apps"),
            );
        }
    } else if cfg!(target_os = "macos") {
        dirs.push(PathBuf::from("/Applications"));
        if let Ok(home) = std::env::var("HOME") {
            dirs.push(PathBuf::from(home).join("Applications"));
        }
    } else {
        dirs.push(PathBuf::from("/opt"));
        dirs.push(PathBuf::from("/usr/share"));
        if let Ok(home) = std::env::var("HOME") {
            dirs.push(PathBuf::from(home).join(".local/share/JetBrains/Toolbox/apps"));
        }
    }
    dirs
}

/// Collect IDE-specific search directories (non-JetBrains).
fn get_custom_search_dirs(config: &IdeConfig) -> Vec<PathBuf> {
    let mut dirs = Vec::new();
    match config.id {
        "vscode" => {
            if cfg!(windows) {
                if let Some(pf) = std::env::var_os("ProgramFiles") {
                    dirs.push(PathBuf::from(pf).join("Microsoft VS Code"));
                }
                if let Some(local) = std::env::var_os("LOCALAPPDATA") {
                    dirs.push(PathBuf::from(local).join("Programs").join("Microsoft VS Code"));
                }
            } else if cfg!(target_os = "macos") {
                dirs.push(PathBuf::from("/Applications"));
            } else {
                dirs.push(PathBuf::from("/usr/share"));
                dirs.push(PathBuf::from("/usr/bin"));
            }
        }
        "cursor" => {
            if cfg!(windows) {
                if let Some(local) = std::env::var_os("LOCALAPPDATA") {
                    dirs.push(PathBuf::from(local).join("Programs").join("cursor"));
                }
            } else if cfg!(target_os = "macos") {
                dirs.push(PathBuf::from("/Applications"));
            } else {
                dirs.push(PathBuf::from("/usr/share"));
                dirs.push(PathBuf::from("/usr/bin"));
            }
        }
        _ => {
            if cfg!(target_os = "macos") {
                dirs.push(PathBuf::from("/Applications"));
            }
        }
    }
    dirs
}
