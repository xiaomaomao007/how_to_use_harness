import { invoke } from "@tauri-apps/api/core";
import type {
  FollowedEntity,
  GitHubRepo,
  GitHubActivity,
  GitHubUser,
  SearchResult,
  CacheInfo,
  IdeInfo,
  OpenInIdeResult,
} from "../types/github";

export async function searchGitHubEntity(
  query: string,
  page?: number,
  token?: string
): Promise<SearchResult<GitHubUser>> {
  return invoke<SearchResult<GitHubUser>>("search_github_entity", {
    query,
    page: page ?? 1,
    token: token ?? null,
  });
}

export async function getUserProfile(
  login: string,
  token?: string
): Promise<GitHubUser> {
  return invoke<GitHubUser>("get_user_profile", {
    login,
    token: token ?? null,
  });
}

export async function searchGitHubOrgs(
  query: string,
  page?: number,
  token?: string
): Promise<SearchResult<GitHubUser>> {
  return invoke<SearchResult<GitHubUser>>("search_github_orgs", {
    query,
    page: page ?? 1,
    token: token ?? null,
  });
}

export async function getGitHubRepos(
  owner: string,
  page?: number,
  token?: string
): Promise<SearchResult<GitHubRepo>> {
  return invoke<SearchResult<GitHubRepo>>("get_github_repos", {
    owner,
    page: page ?? 1,
    token: token ?? null,
  });
}

export async function getGitHubActivities(
  username: string,
  page?: number,
  token?: string
): Promise<SearchResult<GitHubActivity>> {
  return invoke<SearchResult<GitHubActivity>>("get_github_activities", {
    username,
    page: page ?? 1,
    token: token ?? null,
  });
}

export async function addFollowedEntity(
  entity: FollowedEntity
): Promise<void> {
  return invoke<void>("add_followed_entity", { entity });
}

export async function removeFollowedEntity(login: string): Promise<void> {
  return invoke<void>("remove_followed_entity", { login });
}

export async function getFollowedEntities(): Promise<FollowedEntity[]> {
  return invoke<FollowedEntity[]>("get_followed_entities");
}

export async function saveGitHubToken(token: string): Promise<void> {
  return invoke<void>("save_github_token", { token });
}

export async function loadGitHubToken(): Promise<string | null> {
  return invoke<string | null>("load_github_token");
}

export async function getCacheInfo(key: string): Promise<CacheInfo> {
  return invoke<CacheInfo>("get_cache_info", { key });
}

export async function getCachedData(key: string): Promise<string | null> {
  return invoke<string | null>("get_cached_data", { key });
}

export async function clearAllCache(): Promise<void> {
  return invoke<void>("clear_all_cache");
}

export async function listAvailableIdes(): Promise<IdeInfo[]> {
  return invoke<IdeInfo[]>("list_available_ides");
}

export async function openInIde(
  ideId: string,
  repoUrl: string,
  repoName: string
): Promise<OpenInIdeResult> {
  return invoke<OpenInIdeResult>("open_in_ide", { ideId, repoUrl, repoName });
}
