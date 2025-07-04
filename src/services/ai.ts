import { HfInference } from '@huggingface/inference';
import { analyzeRepositoryHealth, fetchUserRepos } from '../api/github';

const hf = new HfInference(import.meta.env.VITE_HUGGINGFACE_API_KEY);

// Choose a single high-performance model
const MODEL = 'HuggingFaceH4/zephyr-7b-beta'; // or 'mistralai/Mistral-7B-Instruct-v0.2'

// GitHub-oriented system prompt
const SYSTEM_PROMPT = `
You are a senior GitHub consultant. Help users with:
- Profile analysis
- Repository analysis
- Contribution strategies
- Portfolio improvement
- Community building
Respond clearly and helpfully.
`;

export async function getprofileAdvice(userMessage: string): Promise<string> {
  try {
    const fullPrompt = `${SYSTEM_PROMPT}\nUser: ${userMessage}\nAssistant:`;
    const res = await hf.textGeneration({
      model: MODEL,
      inputs: fullPrompt,
      parameters: {
        max_new_tokens: 300,
        temperature: 0.7,
        top_p: 0.9
      }
    });
    return res.generated_text?.replace(fullPrompt, '').trim() || 'No response.';
  } catch (error) {
    console.error('AI Error:', error);
    return '⚠️ There was an error processing your request.';
  }
}

export async function getTopRepos(username: string): Promise<string> {
  try {
    const repos = await fetchUserRepos(username);
    const sorted = repos
      .filter(r => !r.fork)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5);

    if (sorted.length === 0) return `No public repositories found for @${username}`;

    let result = `📌 Top repositories of @${username}:\n`;
    for (const repo of sorted) {
      result += `- **${repo.name}**: ⭐ ${repo.stargazers_count}, 🍴 ${repo.forks_count}\n`;
    }
    return result;
  } catch (error) {
    return `Failed to fetch repositories for @${username}`;
  }
}

export async function getRepositoryAnalysis(owner: string, repo: string): Promise<string> {
  try {
    const data = await analyzeRepositoryHealth(owner, repo);
    return `🔍 ${repo} Analysis:
- Stars: ${data.repository.stargazers_count}
- Issues: ${data.issues.open} open, ${data.issues.closed} closed
- Last commit: ${data.activity.lastCommitDate || 'N/A'}
- Contributors: ${data.contributors}
- Health Score: ${data.healthScore}/100`;
  } catch (e) {
    return `❌ Could not analyze ${owner}/${repo}.`;
  }
}
