export interface GitHubUser {
  login: string;
  id: number;
  avatarUrl: string;
  htmlUrl: string;
  name: string | null;
  bio: string | null;
  publicRepos: number | null;
  followers: number | null;
  type: string; // "User" | "Organization"
}

export interface RepoOwner {
  login: string;
  avatarUrl: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  owner: RepoOwner;
  description: string | null;
  htmlUrl: string;
  language: string | null;
  fork: boolean;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  topics: string[];
  updatedAt: string;
  pushedAt: string | null;
  archived: boolean;
}

export interface Actor {
  login: string;
  displayLogin: string | null;
  avatarUrl: string;
}

export interface ActivityRepo {
  name: string;
  url: string;
}

export interface GitHubActivity {
  id: string;
  type: string;
  actor: Actor;
  repo: ActivityRepo;
  createdAt: string;
  payload: Record<string, unknown>;
}

export interface FollowedEntity {
  id: number;
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  name: string | null;
  description: string | null;
  entityType: "user" | "org";
  publicRepos: number;
  followers: number;
  followedAt: string;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
}

export interface CacheInfo {
  cached: boolean;
  updatedAt: string | null;
}

export interface IdeInfo {
  id: string;
  name: string;
  path: string;
}

export interface OpenInIdeResult {
  path: string;
  cloned: boolean;
  ideName: string;
}
