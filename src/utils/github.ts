export const LANGUAGE_COLORS: Record<string, string> = {
  Rust: "#dea584",
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#239120",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  Scala: "#c22d52",
  Lua: "#000080",
  Perl: "#0298c3",
  Haskell: "#5e5086",
  Elixir: "#6e4a7e",
  Clojure: "#db5855",
  OCaml: "#3be133",
  Zig: "#ec915c",
  Nix: "#7e7eff",
  Solidity: "#aa6746",
  R: "#198CE7",
  Julia: "#9558a2",
  MATLAB: "#e16737",
};

export function getLanguageColor(language: string | null): string {
  if (!language) return "#8b949e";
  return LANGUAGE_COLORS[language] || "#8b949e";
}

export function formatCount(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export const EVENT_TYPE_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  PushEvent: { icon: "📦", color: "text-gh-accent", label: "Push" },
  CreateEvent: { icon: "✨", color: "text-gh-success", label: "Create" },
  DeleteEvent: { icon: "🗑️", color: "text-gh-danger", label: "Delete" },
  WatchEvent: { icon: "👀", color: "text-gh-text-secondary", label: "Star" },
  ForkEvent: { icon: "🍴", color: "text-gh-warning", label: "Fork" },
  IssuesEvent: { icon: "❗", color: "text-gh-warning", label: "Issue" },
  IssueCommentEvent: { icon: "💬", color: "text-gh-text-secondary", label: "Comment" },
  PullRequestEvent: { icon: "🔀", color: "text-gh-accent", label: "PR" },
  PullRequestReviewEvent: { icon: "📝", color: "text-gh-text-secondary", label: "Review" },
  PullRequestReviewCommentEvent: { icon: "💬", color: "text-gh-text-secondary", label: "PR Comment" },
  ReleaseEvent: { icon: "🏷️", color: "text-gh-success", label: "Release" },
  MemberEvent: { icon: "👤", color: "text-gh-accent", label: "Member" },
  PublicEvent: { icon: "🌍", color: "text-gh-success", label: "Public" },
  GollumEvent: { icon: "📖", color: "text-gh-text-secondary", label: "Wiki" },
  CommitCommentEvent: { icon: "💬", color: "text-gh-text-secondary", label: "Commit Comment" },
};
