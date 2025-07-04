import { GitHubUser, GitHubRepo, ComparisonMetrics, ProfileWithMetrics } from '../types';

const API_BASE_URL = 'https://api.github.com';

export async function fetchUser(username: string): Promise<GitHubUser> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${username}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`User ${username} not found`);
      }
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

export async function fetchUserRepos(username: string): Promise<GitHubRepo[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${username}/repos?per_page=100&sort=updated`);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user repos:', error);
    throw error;
  }
}

export async function fetchRepository(owner: string, repo: string): Promise<GitHubRepo> {
  try {
    const response = await fetch(`${API_BASE_URL}/repos/${owner}/${repo}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Repository ${owner}/${repo} not found`);
      }
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching repository:', error);
    throw error;
  }
}

export async function fetchRepositoryContents(owner: string, repo: string, path: string = ''): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/repos/${owner}/${repo}/contents/${path}`);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching repository contents:', error);
    throw error;
  }
}

export async function fetchRepositoryLanguages(owner: string, repo: string): Promise<Record<string, number>> {
  try {
    const response = await fetch(`${API_BASE_URL}/repos/${owner}/${repo}/languages`);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching repository languages:', error);
    return {};
  }
}

export async function fetchRepositoryCommits(owner: string, repo: string, limit: number = 30): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/repos/${owner}/${repo}/commits?per_page=${limit}`);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching repository commits:', error);
    return [];
  }
}

export async function fetchRepositoryIssues(owner: string, repo: string, state: string = 'all'): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/repos/${owner}/${repo}/issues?state=${state}&per_page=100`);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching repository issues:', error);
    return [];
  }
}

export async function fetchRepositoryPullRequests(owner: string, repo: string, state: string = 'all'): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/repos/${owner}/${repo}/pulls?state=${state}&per_page=100`);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching repository pull requests:', error);
    return [];
  }
}

export async function fetchRepositoryContributors(owner: string, repo: string): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/repos/${owner}/${repo}/contributors?per_page=100`);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching repository contributors:', error);
    return [];
  }
}

export async function analyzeRepositoryHealth(owner: string, repo: string): Promise<any> {
  try {
    const [repository, languages, commits, issues, pullRequests, contributors, contents] = await Promise.all([
      fetchRepository(owner, repo),
      fetchRepositoryLanguages(owner, repo),
      fetchRepositoryCommits(owner, repo, 30),
      fetchRepositoryIssues(owner, repo),
      fetchRepositoryPullRequests(owner, repo),
      fetchRepositoryContributors(owner, repo),
      fetchRepositoryContents(owner, repo).catch(() => [])
    ]);

    // Analyze repository health metrics
    const hasReadme = contents.some((file: any) => 
      file.name.toLowerCase().includes('readme')
    );
    
    const hasLicense = contents.some((file: any) => 
      file.name.toLowerCase().includes('license') || file.name.toLowerCase().includes('licence')
    );
    
    const hasContributing = contents.some((file: any) => 
      file.name.toLowerCase().includes('contributing')
    );
    
    const hasCodeOfConduct = contents.some((file: any) => 
      file.name.toLowerCase().includes('code_of_conduct') || file.name.toLowerCase().includes('code-of-conduct')
    );

    // Calculate activity metrics
    const recentCommits = commits.filter((commit: any) => {
      const commitDate = new Date(commit.commit.author.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return commitDate > thirtyDaysAgo;
    });

    const openIssues = issues.filter((issue: any) => issue.state === 'open' && !issue.pull_request);
    const closedIssues = issues.filter((issue: any) => issue.state === 'closed' && !issue.pull_request);
    const openPRs = pullRequests.filter((pr: any) => pr.state === 'open');
    const closedPRs = pullRequests.filter((pr: any) => pr.state === 'closed');

    // Calculate health score
    let healthScore = 0;
    if (hasReadme) healthScore += 20;
    if (hasLicense) healthScore += 15;
    if (hasContributing) healthScore += 10;
    if (hasCodeOfConduct) healthScore += 10;
    if (repository.description) healthScore += 10;
    if (recentCommits.length > 0) healthScore += 15;
    if (contributors.length > 1) healthScore += 10;
    if (repository.stargazers_count > 0) healthScore += 5;
    if (repository.forks_count > 0) healthScore += 5;

    return {
      repository,
      languages,
      commits: commits.slice(0, 10), // Latest 10 commits
      recentCommits,
      issues: {
        open: openIssues.length,
        closed: closedIssues.length,
        total: issues.length
      },
      pullRequests: {
        open: openPRs.length,
        closed: closedPRs.length,
        total: pullRequests.length
      },
      contributors: contributors.length,
      documentation: {
        hasReadme,
        hasLicense,
        hasContributing,
        hasCodeOfConduct
      },
      activity: {
        recentCommits: recentCommits.length,
        lastCommitDate: commits[0]?.commit?.author?.date || null,
        isActive: recentCommits.length > 0
      },
      healthScore,
      healthGrade: healthScore >= 80 ? 'A' : healthScore >= 60 ? 'B' : healthScore >= 40 ? 'C' : 'D'
    };
  } catch (error) {
    console.error('Error analyzing repository health:', error);
    throw error;
  }
}

async function fetchUserContributions(username: string): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${username}/events`);
    if (!response.ok) {
      return 0;
    }
    const events = await response.json();
    return events.length;
  } catch {
    return 0;
  }
}

async function fetchUserLanguages(repos: GitHubRepo[]): Promise<number> {
  const languages = new Set();
  for (const repo of repos) {
    if (repo.language) {
      languages.add(repo.language);
    }
  }
  return languages.size;
}

function calculateReadmeQuality(repos: GitHubRepo[]): number {
  let score = 0;
  const hasReadme = repos.filter(repo => !repo.fork).some(repo => repo.description?.toLowerCase().includes('readme'));
  if (hasReadme) score += 5;
  const hasDetailedDescriptions = repos.filter(repo => repo.description && repo.description.length > 50).length;
  score += Math.min(hasDetailedDescriptions / 5, 5);
  return score;
}

async function calculatePRsAndIssues(username: string): Promise<number> {
  try {
    const [prsResponse, issuesResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/search/issues?q=author:${username}+type:pr`),
      fetch(`${API_BASE_URL}/search/issues?q=author:${username}+type:issue`)
    ]);
    
    const [prs, issues] = await Promise.all([
      prsResponse.json(),
      issuesResponse.json()
    ]);
    
    return (prs.total_count || 0) + (issues.total_count || 0);
  } catch {
    return 0;
  }
}

function calculateAchievementScore(user: GitHubUser): number {
  let score = 0;
  if (user.public_repos > 10) score++;
  if (user.followers > 50) score++;
  if (user.public_gists > 5) score++;
  if (user.bio) score++;
  if (user.blog) score++;
  return score;
}

function calculateCommunityScore(repos: GitHubRepo[]): number {
  let score = 0;
  const contributedRepos = repos.filter(repo => repo.fork).length;
  score += Math.min(contributedRepos / 10, 5);
  
  const popularRepos = repos.filter(repo => repo.stargazers_count > 10).length;
  score += Math.min(popularRepos / 5, 5);
  
  return score;
}

export async function calculateProfileMetrics(user: GitHubUser, repos: GitHubRepo[]): Promise<ComparisonMetrics> {
  const contributions = await fetchUserContributions(user.login);
  const languages = await fetchUserLanguages(repos);
  const readmeQualityScore = calculateReadmeQuality(repos);
  const prIssues = await calculatePRsAndIssues(user.login);
  const achievementScore = calculateAchievementScore(user);
  const communityScore = calculateCommunityScore(repos);
  
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
  
  const score = (
    Math.min(contributions / 1000, 1) * 15 +
    Math.min(user.public_repos / 50, 1) * 10 +
    Math.min(totalStars / 500, 1) * 15 +
    Math.min(totalForks / 200, 1) * 10 +
    Math.min(languages / 10, 1) * 10 +
    readmeQualityScore +
    Math.min(prIssues / 100, 1) * 10 +
    Math.min(user.followers / 500, 1) * 5 +
    achievementScore +
    communityScore
  );

  return {
    totalStars,
    totalForks,
    followers: user.followers,
    following: user.following,
    repositories: user.public_repos,
    languages,
    contributions,
    readmeQualityScore,
    prIssues,
    achievementScore,
    communityScore,
    profileAge: calculateProfileAgeInDays(user.created_at),
    totalScore: score
  };
}

function calculateProfileAgeInDays(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export async function fetchCompleteProfile(username: string): Promise<ProfileWithMetrics> {
  const user = await fetchUser(username);
  const repos = await fetchUserRepos(username);
  const metrics = await calculateProfileMetrics(user, repos);
  
  return {
    user,
    repos,
    metrics
  };
}