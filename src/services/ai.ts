import { API_CONFIG, getAPIHeaders, validateAPIKeys } from '../config/api';
import { analyzeRepositoryHealth, fetchUserRepos, fetchCompleteProfile } from '../api/github';
import { ProfileWithMetrics } from '../types';

// Enhanced AI service with multiple providers
class AIService {
  private huggingFaceAvailable = false;
  private geminiAvailable = false;

  constructor() {
    this.checkAPIAvailability();
  }

  private async checkAPIAvailability() {
    const validation = validateAPIKeys();
    
    // Test Hugging Face API
    try {
      const response = await fetch(`${API_CONFIG.HUGGINGFACE.BASE_URL}/models`, {
        headers: getAPIHeaders('huggingface')
      });
      this.huggingFaceAvailable = response.ok;
    } catch (error) {
      console.warn('Hugging Face API not available:', error);
      this.huggingFaceAvailable = false;
    }

    // Test Gemini API
    try {
      const response = await fetch(
        `${API_CONFIG.GEMINI.BASE_URL}/models/gemini-pro:generateContent?key=${API_CONFIG.GEMINI.API_KEY}`,
        {
          method: 'POST',
          headers: getAPIHeaders('gemini'),
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'test' }]
            }]
          })
        }
      );
      this.geminiAvailable = response.ok;
    } catch (error) {
      console.warn('Gemini API not available:', error);
      this.geminiAvailable = false;
    }
  }

  async generateWithHuggingFace(prompt: string, model?: string): Promise<string> {
    if (!this.huggingFaceAvailable) {
      throw new Error('Hugging Face API is not available');
    }

    try {
      const response = await fetch(
        `${API_CONFIG.HUGGINGFACE.BASE_URL}/models/${model || API_CONFIG.HUGGINGFACE.MODELS.TEXT_GENERATION}`,
        {
          method: 'POST',
          headers: getAPIHeaders('huggingface'),
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 500,
              temperature: 0.7,
              top_p: 0.9,
              do_sample: true
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.statusText}`);
      }

      const result = await response.json();
      return Array.isArray(result) ? result[0]?.generated_text || 'No response generated' : result.generated_text || 'No response generated';
    } catch (error) {
      console.error('Hugging Face generation error:', error);
      throw error;
    }
  }

  async generateWithGemini(prompt: string): Promise<string> {
    if (!this.geminiAvailable) {
      throw new Error('Gemini API is not available');
    }

    try {
      const response = await fetch(
        `${API_CONFIG.GEMINI.BASE_URL}/models/${API_CONFIG.GEMINI.MODEL}:generateContent?key=${API_CONFIG.GEMINI.API_KEY}`,
        {
          method: 'POST',
          headers: getAPIHeaders('gemini'),
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
    } catch (error) {
      console.error('Gemini generation error:', error);
      throw error;
    }
  }

  async generateResponse(prompt: string, preferredProvider: 'huggingface' | 'gemini' = 'gemini'): Promise<string> {
    // Try preferred provider first
    if (preferredProvider === 'gemini' && this.geminiAvailable) {
      try {
        return await this.generateWithGemini(prompt);
      } catch (error) {
        console.warn('Gemini failed, trying Hugging Face:', error);
      }
    }

    if (preferredProvider === 'huggingface' && this.huggingFaceAvailable) {
      try {
        return await this.generateWithHuggingFace(prompt);
      } catch (error) {
        console.warn('Hugging Face failed, trying Gemini:', error);
      }
    }

    // Fallback to other provider
    if (preferredProvider === 'gemini' && this.huggingFaceAvailable) {
      return await this.generateWithHuggingFace(prompt);
    }

    if (preferredProvider === 'huggingface' && this.geminiAvailable) {
      return await this.generateWithGemini(prompt);
    }

    throw new Error('No AI providers are available. Please check your API keys.');
  }

  getStatus() {
    return {
      huggingFace: this.huggingFaceAvailable,
      gemini: this.geminiAvailable,
      hasAnyProvider: this.huggingFaceAvailable || this.geminiAvailable
    };
  }
}

// Create singleton instance
const aiService = new AIService();

// Enhanced GitHub-specific prompts
const GITHUB_PROMPTS = {
  PROFILE_ANALYSIS: (username: string) => `
As a senior GitHub consultant, analyze the GitHub profile of @${username}. Provide insights on:

1. **Profile Strength**: Overall profile quality and completeness
2. **Repository Quality**: Code quality, documentation, and project diversity
3. **Community Engagement**: Contribution patterns and collaboration
4. **Professional Impact**: How the profile reflects technical skills
5. **Improvement Recommendations**: Specific actionable advice

Focus on constructive feedback that helps improve their GitHub presence and career prospects.
`,

  PROFILE_COMPARISON: (user1: string, user2: string) => `
Compare GitHub profiles @${user1} vs @${user2} as a technical recruiter would. Analyze:

1. **Technical Skills**: Based on repositories and languages used
2. **Project Quality**: Complexity, documentation, and real-world applicability
3. **Community Contribution**: Open source involvement and collaboration
4. **Professional Readiness**: Profile completeness and presentation
5. **Growth Trajectory**: Activity patterns and skill development

Provide a balanced comparison highlighting each developer's strengths and areas for growth.
`,

  REPOSITORY_ANALYSIS: (owner: string, repo: string) => `
Analyze the GitHub repository ${owner}/${repo} from a technical perspective:

1. **Code Quality**: Architecture, patterns, and best practices
2. **Documentation**: README quality, API docs, and examples
3. **Community Health**: Issues, PRs, and contributor engagement
4. **Maintenance**: Update frequency and responsiveness
5. **Technical Innovation**: Unique features and problem-solving approach

Provide specific recommendations for improvement and highlight notable strengths.
`,

  CHATBOT_RESPONSE: (message: string, context?: any) => `
You are an expert GitHub consultant and software development mentor. The user asked: "${message}"

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Provide helpful, actionable advice about:
- GitHub best practices
- Profile optimization
- Repository management
- Career development
- Open source contribution
- Technical skills improvement

Be conversational, encouraging, and specific in your recommendations.
`
};

// Public API functions
export async function testHuggingFaceAPI(): Promise<boolean> {
  try {
    const status = aiService.getStatus();
    return status.huggingFace;
  } catch (error) {
    console.error('Error testing Hugging Face API:', error);
    return false;
  }
}

export async function testGeminiAPI(): Promise<boolean> {
  try {
    const status = aiService.getStatus();
    return status.gemini;
  } catch (error) {
    console.error('Error testing Gemini API:', error);
    return false;
  }
}

export async function getAPIStatus(): Promise<{
  huggingFace: boolean;
  gemini: boolean;
  hasAnyProvider: boolean;
  validation: { isValid: boolean; issues: string[] };
}> {
  const status = aiService.getStatus();
  const validation = validateAPIKeys();
  
  return {
    ...status,
    validation
  };
}

export async function analyzeProfile(username: string): Promise<string> {
  try {
    const prompt = GITHUB_PROMPTS.PROFILE_ANALYSIS(username);
    
    // Try to get actual profile data for context
    try {
      const profile = await fetchCompleteProfile(username);
      const enhancedPrompt = `${prompt}

Profile Data:
- Repositories: ${profile.metrics.repositories}
- Stars: ${profile.metrics.totalStars}
- Followers: ${profile.metrics.followers}
- Languages: ${profile.metrics.languages}
- Profile Age: ${Math.floor(profile.metrics.profileAge / 365)} years

Recent repositories: ${profile.repos.slice(0, 5).map(r => `${r.name} (${r.language || 'Unknown'}, ⭐${r.stargazers_count})`).join(', ')}`;

      return await aiService.generateResponse(enhancedPrompt, 'gemini');
    } catch (error) {
      // Fallback to basic analysis without profile data
      return await aiService.generateResponse(prompt + '\n\nNote: Unable to fetch detailed profile data, providing general analysis.', 'gemini');
    }
  } catch (error) {
    console.error('Error analyzing profile:', error);
    return `❌ Unable to analyze profile @${username}. Please check the username and try again.`;
  }
}

export async function compareProfiles(profile1: ProfileWithMetrics, profile2: ProfileWithMetrics): Promise<string> {
  try {
    const prompt = GITHUB_PROMPTS.PROFILE_COMPARISON(profile1.user.login, profile2.user.login);
    
    const enhancedPrompt = `${prompt}

Profile Comparison Data:
@${profile1.user.login}:
- Repositories: ${profile1.metrics.repositories}
- Stars: ${profile1.metrics.totalStars}
- Followers: ${profile1.metrics.followers}
- Score: ${Math.round(profile1.metrics.totalScore)}

@${profile2.user.login}:
- Repositories: ${profile2.metrics.repositories}
- Stars: ${profile2.metrics.totalStars}
- Followers: ${profile2.metrics.followers}
- Score: ${Math.round(profile2.metrics.totalScore)}`;

    return await aiService.generateResponse(enhancedPrompt, 'gemini');
  } catch (error) {
    console.error('Error comparing profiles:', error);
    return `❌ Unable to compare profiles. Please try again.`;
  }
}

export async function getRepositoryAdvice(owner: string, repo: string): Promise<string> {
  try {
    const prompt = GITHUB_PROMPTS.REPOSITORY_ANALYSIS(owner, repo);
    
    // Try to get repository health data
    try {
      const healthData = await analyzeRepositoryHealth(owner, repo);
      const enhancedPrompt = `${prompt}

Repository Health Data:
- Stars: ${healthData.repository.stargazers_count}
- Forks: ${healthData.repository.forks_count}
- Issues: ${healthData.issues.open} open, ${healthData.issues.closed} closed
- Contributors: ${healthData.contributors}
- Health Score: ${healthData.healthScore}/100
- Last Commit: ${healthData.activity.lastCommitDate || 'Unknown'}
- Documentation: ${Object.entries(healthData.documentation).filter(([_, hasDoc]) => hasDoc).map(([doc]) => doc).join(', ') || 'None'}`;

      return await aiService.generateResponse(enhancedPrompt, 'gemini');
    } catch (error) {
      // Fallback to basic analysis
      return await aiService.generateResponse(prompt + '\n\nNote: Unable to fetch detailed repository data, providing general analysis.', 'gemini');
    }
  } catch (error) {
    console.error('Error analyzing repository:', error);
    return `❌ Unable to analyze repository ${owner}/${repo}. Please check the repository name and try again.`;
  }
}

export async function getChatbotResponse(message: string, context?: any): Promise<string> {
  try {
    // Handle specific commands
    if (message.toLowerCase().includes('analyze') && message.includes('@')) {
      const username = message.match(/@([a-zA-Z0-9_-]+)/)?.[1];
      if (username) {
        return await analyzeProfile(username);
      }
    }

    if (message.toLowerCase().includes('analyze') && message.includes('/')) {
      const repoMatch = message.match(/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)/);
      if (repoMatch) {
        return await getRepositoryAdvice(repoMatch[1], repoMatch[2]);
      }
    }

    if (message.toLowerCase().includes('repos of') || message.toLowerCase().includes('repositories of')) {
      const username = message.match(/(?:repos|repositories)\s+of\s+([a-zA-Z0-9_-]+)/i)?.[1];
      if (username) {
        try {
          const repos = await fetchUserRepos(username);
          const topRepos = repos
            .filter(r => !r.fork)
            .sort((a, b) => b.stargazers_count - a.stargazers_count)
            .slice(0, 10);

          let response = `📚 **Top repositories of @${username}:**\n\n`;
          topRepos.forEach((repo, index) => {
            response += `${index + 1}. **${repo.name}** (${repo.language || 'Unknown'})\n`;
            response += `   ⭐ ${repo.stargazers_count} stars, 🍴 ${repo.forks_count} forks\n`;
            if (repo.description) {
              response += `   📝 ${repo.description}\n`;
            }
            response += `   🔗 ${repo.html_url}\n\n`;
          });

          return response;
        } catch (error) {
          return `❌ Unable to fetch repositories for @${username}. Please check the username.`;
        }
      }
    }

    // General chatbot response
    const prompt = GITHUB_PROMPTS.CHATBOT_RESPONSE(message, context);
    return await aiService.generateResponse(prompt, 'gemini');
  } catch (error) {
    console.error('Error generating chatbot response:', error);
    return `❌ I encountered an error processing your request. Please try again or rephrase your question.`;
  }
}

export async function getProfileAdvice(profile1: ProfileWithMetrics, profile2: ProfileWithMetrics): Promise<string> {
  try {
    const winner = profile1.metrics.totalScore > profile2.metrics.totalScore ? profile1 : profile2;
    const loser = profile1.metrics.totalScore > profile2.metrics.totalScore ? profile2 : profile1;

    const prompt = `
As a GitHub expert, analyze this profile comparison and provide insights:

**Winner: @${winner.user.login}**
- Score: ${Math.round(winner.metrics.totalScore)}
- Repositories: ${winner.metrics.repositories}
- Stars: ${winner.metrics.totalStars}
- Followers: ${winner.metrics.followers}

**Runner-up: @${loser.user.login}**
- Score: ${Math.round(loser.metrics.totalScore)}
- Repositories: ${loser.metrics.repositories}
- Stars: ${loser.metrics.totalStars}
- Followers: ${loser.metrics.followers}

Provide:
1. Why @${winner.user.login} won this comparison
2. Key strengths of each developer
3. Specific improvement recommendations for @${loser.user.login}
4. What both developers can learn from each other

Be encouraging and constructive in your analysis.
`;

    return await aiService.generateResponse(prompt, 'gemini');
  } catch (error) {
    console.error('Error generating profile advice:', error);
    return 'Unable to generate detailed analysis at this time. Please try again.';
  }
}

// Legacy function names for backward compatibility
export const getprofileAdvice = getChatbotResponse;
export const getTopRepos = async (username: string) => {
  return getChatbotResponse(`repos of ${username}`);
};
export const getRepositoryAnalysis = getRepositoryAdvice;