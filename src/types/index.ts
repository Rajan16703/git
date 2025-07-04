export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
}

export interface ComparisonMetrics {
  totalStars: number;
  totalForks: number;
  followers: number;
  following: number;
  repositories: number;
  languages: number;
  contributions: number;
  readmeQualityScore: number;
  prIssues: number;
  achievementScore: number;
  communityScore: number;
  profileAge: number;
  totalScore: number;
}

export interface ProfileWithMetrics {
  user: GitHubUser;
  metrics: ComparisonMetrics;
  repos: GitHubRepo[];
}

export interface SavedComparison {
  id: string;
  user_id: string;
  usernames: string[];
  created_at: string;
}

export interface ComparisonHistory {
  id: string;
  user_id: string | null;
  usernames: string[];
  comparison_data: any;
  share_token: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComparisonShare {
  id: string;
  comparison_id: string;
  share_token: string;
  shared_by: string | null;
  view_count: number;
  expires_at: string | null;
  created_at: string;
}

export interface ShareOptions {
  isPublic: boolean;
  expiresIn?: number; // hours
  allowComments?: boolean;
  requireAuth?: boolean;
}