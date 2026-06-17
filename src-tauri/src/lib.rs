mod commands;
mod database;
mod github_api;
mod models;

use commands::*;
use database::Database;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = Database::new().expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(db)
        .invoke_handler(tauri::generate_handler![
            search_github_entity,
            search_github_orgs,
            get_github_repos,
            get_github_activities,
            get_user_profile,
            add_followed_entity,
            remove_followed_entity,
            get_followed_entities,
            save_github_token,
            load_github_token,
            get_cache_info,
            get_cached_data,
            clear_all_cache,
            list_available_ides,
            open_in_ide,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
