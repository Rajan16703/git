import { HfInference } from '@huggingface/inference';
import axios from 'axios';
import { analyzeRepositoryHealth, fetchUserRepos, fetchRepository } from '../api/github';

// Initialize Hugging Face client
const hf = new HfInference(import.meta.env.VITE_HUGGINGFACE_API_KEY);

// Advanced AI Models Configuration
const AI_MODELS = {
  // Primary conversational models
  CHAT_MODELS: [
    'microsoft/DialoGPT-large',
    'microsoft/DialoGPT-medium',
    'facebook/blenderbot-400M-distill',
    'microsoft/DialoGPT-small'
  ],
  
  // Text generation models
  TEXT_MODELS: [
    'gpt2-large',
    'gpt2-medium', 
    'gpt2',
    'distilgpt2'
  ],
  
  // Code-specific models
  CODE_MODELS: [
    'Salesforce/codegen-350M-mono',
    'microsoft/CodeBERT-base',
    'huggingface/CodeBERTa-small-v1'
  ],
  
  // Question answering models
  QA_MODELS: [
    'deepset/roberta-base-squad2',
    'distilbert-base-cased-distilled-squad',
    'bert-large-uncased-whole-word-masking-finetuned-squad'
  ]
};

// Advanced prompt engineering templates
const PROMPT_TEMPLATES = {
  GITHUB_EXPERT: `You are a senior GitHub expert and software development consultant with 10+ years of experience. You specialize in:
- GitHub profile optimization and best practices
- Open source project management and community building
- Code quality assessment and improvement strategies
- Developer career growth and personal branding
- Repository organization and documentation standards
- CI/CD workflows and DevOps practices

Provide detailed, actionable advice that helps developers improve their GitHub presence and coding skills.`,

  PROFILE_ANALYZER: `As a GitHub profile optimization specialist, analyze the following profile data and provide comprehensive insights:
- Technical strengths and areas for improvement
- Repository quality assessment
- Community engagement strategies
- Professional development recommendations
- Specific action items for growth`,

  CODE_REVIEWER: `You are an experienced code reviewer and software architect. Provide constructive feedback on:
- Code structure and organization
- Best practices and design patterns
- Performance optimization opportunities
- Security considerations
- Documentation and maintainability`,

  CAREER_ADVISOR: `As a senior tech career advisor, help developers with:
- GitHub portfolio optimization for job applications
- Open source contribution strategies
- Building technical reputation and network
- Skill development roadmaps
- Interview preparation and technical showcasing`,

  REPOSITORY_ANALYZER: `You are a repository analysis expert. Analyze repositories for:
- Code quality and architecture
- Documentation completeness
- Community health and engagement
- Development practices and workflows
- Security and maintenance status
- Growth and improvement opportunities`
};

// Advanced conversation context management
class ConversationContext {
  private context: Map<string, any> = new Map();
  private maxContextSize = 10;

  addMessage(role: 'user' | 'assistant', message: string, metadata?: any) {
    const timestamp = Date.now();
    const contextEntry = { role, message, timestamp, metadata };
    
    const messages = this.context.get('messages') || [];
    messages.push(contextEntry);
    
    // Keep only recent messages to maintain context window
    if (messages.length > this.maxContextSize) {
      messages.splice(0, messages.length - this.maxContextSize);
    }
    
    this.context.set('messages', messages);
  }

  getRecentContext(limit = 5): string {
    const messages = this.context.get('messages') || [];
    return messages
      .slice(-limit)
      .map(msg => `${msg.role}: ${msg.message}`)
      .join('\n');
  }

  setUserProfile(profile: any) {
    this.context.set('userProfile', profile);
  }

  getUserProfile() {
    return this.context.get('userProfile');
  }

  clear() {
    this.context.clear();
  }
}

// Global conversation context
const conversationContext = new ConversationContext();

// Advanced API client with retry logic and fallbacks
class AdvancedHuggingFaceClient {
  private apiKey: string;
  private baseURL = 'https://api-inference.huggingface.co';
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest(url: string, data: any, retryCount = 0): Promise<any> {
    try {
      const response = await axios.post(url, data, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'GitHub-Battle-Assistant/1.0'
        },
        timeout: 30000,
        validateStatus: (status) => status < 500 // Retry on 5xx errors
      });

      if (response.status === 503 && retryCount < this.maxRetries) {
        // Model is loading, wait and retry
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.makeRequest(url, data, retryCount + 1);
      }

      return response.data;
    } catch (error) {
      if (retryCount < this.maxRetries && (
        error.code === 'ECONNABORTED' || 
        error.response?.status >= 500
      )) {
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.makeRequest(url, data, retryCount + 1);
      }
      throw error;
    }
  }

  async generateText(model: string, prompt: string, options: any = {}): Promise<string> {
    const url = `${this.baseURL}/models/${model}`;
    const data = {
      inputs: prompt,
      parameters: {
        max_new_tokens: options.maxTokens || 200,
        temperature: options.temperature || 0.7,
        do_sample: true,
        top_p: 0.9,
        repetition_penalty: 1.1,
        ...options.parameters
      },
      options: {
        wait_for_model: true,
        use_cache: false
      }
    };

    const response = await this.makeRequest(url, data);
    
    if (Array.isArray(response)) {
      return response[0]?.generated_text || '';
    }
    
    return response?.generated_text || '';
  }

  async conversationalResponse(model: string, conversation: string, options: any = {}): Promise<string> {
    const url = `${this.baseURL}/models/${model}`;
    const data = {
      inputs: {
        past_user_inputs: options.pastInputs || [],
        generated_responses: options.pastResponses || [],
        text: conversation
      },
      parameters: {
        max_length: options.maxLength || 300,
        temperature: options.temperature || 0.8,
        do_sample: true,
        top_p: 0.9,
        repetition_penalty: 1.2
      },
      options: {
        wait_for_model: true,
        use_cache: false
      }
    };

    const response = await this.makeRequest(url, data);
    return response?.generated_text || response?.conversation?.generated_text || '';
  }

  async questionAnswering(context: string, question: string): Promise<string> {
    const model = AI_MODELS.QA_MODELS[0];
    const url = `${this.baseURL}/models/${model}`;
    const data = {
      inputs: {
        question: question,
        context: context
      },
      options: {
        wait_for_model: true
      }
    };

    const response = await this.makeRequest(url, data);
    return response?.answer || '';
  }
}

// Initialize advanced client
const advancedClient = new AdvancedHuggingFaceClient(import.meta.env.VITE_HUGGINGFACE_API_KEY);

// Advanced response processing and enhancement
class ResponseProcessor {
  static cleanResponse(text: string, originalPrompt: string = ''): string {
    if (!text) return '';
    
    // Remove the original prompt if it appears in the response
    let cleaned = text.replace(originalPrompt, '').trim();
    
    // Remove common artifacts
    cleaned = cleaned
      .replace(/^(User:|Assistant:|Human:|AI:)/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s*[-*]\s*/gm, '• ')
      .trim();
    
    // Ensure proper sentence structure
    if (cleaned && !cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
      cleaned += '.';
    }
    
    return cleaned;
  }

  static enhanceGitHubResponse(response: string, context?: any): string {
    if (!response) return response;
    
    // Add GitHub-specific enhancements
    let enhanced = response;
    
    // Add relevant GitHub links and resources
    if (enhanced.toLowerCase().includes('readme')) {
      enhanced += '\n\n💡 Pro tip: Check out GitHub\'s README best practices guide for more insights!';
    }
    
    if (enhanced.toLowerCase().includes('contribution')) {
      enhanced += '\n\n🚀 Remember: Consistent contributions are more valuable than sporadic bursts of activity.';
    }
    
    if (enhanced.toLowerCase().includes('profile')) {
      enhanced += '\n\n✨ Consider adding a profile README to showcase your skills and personality!';
    }
    
    return enhanced;
  }

  static formatCodeAdvice(response: string): string {
    // Format code-related responses with better structure
    return response
      .replace(/(\d+\.\s)/g, '\n$1')
      .replace(/([A-Z][a-z]+:)/g, '\n**$1**')
      .trim();
  }

  static formatRepositoryAnalysis(analysis: any): string {
    const { repository, healthScore, healthGrade, documentation, activity, issues, pullRequests, contributors } = analysis;
    
    return `🔍 **Repository Analysis: ${repository.name}**

📊 **Health Score**: ${healthScore}/100 (Grade: ${healthGrade})

📝 **Documentation Status**:
${documentation.hasReadme ? '✅' : '❌'} README file
${documentation.hasLicense ? '✅' : '❌'} License
${documentation.hasContributing ? '✅' : '❌'} Contributing guidelines
${documentation.hasCodeOfConduct ? '✅' : '❌'} Code of conduct

🚀 **Activity Metrics**:
• Recent commits (30 days): ${activity.recentCommits}
• Last commit: ${activity.lastCommitDate ? new Date(activity.lastCommitDate).toLocaleDateString() : 'Unknown'}
• Status: ${activity.isActive ? '🟢 Active' : '🔴 Inactive'}

🤝 **Community Engagement**:
• Contributors: ${contributors}
• Open issues: ${issues.open}
• Closed issues: ${issues.closed}
• Open PRs: ${pullRequests.open}
• Closed PRs: ${pullRequests.closed}

⭐ **Repository Stats**:
• Stars: ${repository.stargazers_count}
• Forks: ${repository.forks_count}
• Watchers: ${repository.watchers_count}
• Language: ${repository.language || 'Not specified'}

📈 **Recommendations**:
${healthScore < 60 ? '• Improve documentation (README, contributing guidelines)' : ''}
${!documentation.hasLicense ? '• Add a license file' : ''}
${activity.recentCommits === 0 ? '• Increase development activity' : ''}
${issues.open > issues.closed ? '• Address open issues' : ''}
${contributors < 2 ? '• Encourage community contributions' : ''}`;
  }
}

// Advanced intent detection and routing
class IntentRouter {
  static detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('analyze') && lowerMessage.includes('profile')) {
      return 'ANALYZE_PROFILE';
    }
    
    if (lowerMessage.includes('compare') && lowerMessage.includes('profile')) {
      return 'COMPARE_PROFILES';
    }
    
    if (lowerMessage.includes('repository') || lowerMessage.includes('repo')) {
      if (lowerMessage.includes('analyze') || lowerMessage.includes('check') || lowerMessage.includes('info')) {
        return 'ANALYZE_REPOSITORY';
      }
      return 'REPOSITORY_ADVICE';
    }
    
    if (lowerMessage.includes('repos of') || lowerMessage.includes('repositories of')) {
      return 'LIST_USER_REPOS';
    }
    
    if (lowerMessage.includes('career') || lowerMessage.includes('job')) {
      return 'CAREER_ADVICE';
    }
    
    if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
      return 'CODE_ADVICE';
    }
    
    if (lowerMessage.includes('best practice') || lowerMessage.includes('tip')) {
      return 'BEST_PRACTICES';
    }
    
    return 'GENERAL_CHAT';
  }

  static getPromptTemplate(intent: string): string {
    switch (intent) {
      case 'ANALYZE_PROFILE':
        return PROMPT_TEMPLATES.PROFILE_ANALYZER;
      case 'ANALYZE_REPOSITORY':
        return PROMPT_TEMPLATES.REPOSITORY_ANALYZER;
      case 'CODE_ADVICE':
        return PROMPT_TEMPLATES.CODE_REVIEWER;
      case 'CAREER_ADVICE':
        return PROMPT_TEMPLATES.CAREER_ADVISOR;
      default:
        return PROMPT_TEMPLATES.GITHUB_EXPERT;
    }
  }

  static selectBestModel(intent: string): string[] {
    switch (intent) {
      case 'CODE_ADVICE':
      case 'ANALYZE_REPOSITORY':
        return AI_MODELS.CODE_MODELS;
      case 'ANALYZE_PROFILE':
      case 'COMPARE_PROFILES':
        return AI_MODELS.TEXT_MODELS;
      default:
        return AI_MODELS.CHAT_MODELS;
    }
  }
}

// Repository parsing utilities
function parseRepositoryReference(message: string): { owner: string; repo: string } | null {
  // Match patterns like "owner/repo", "@owner/repo", "github.com/owner/repo"
  const patterns = [
    /(?:github\.com\/)?([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)/,
    /@([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)/,
    /([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
  }
  
  return null;
}

function extractUsername(message: string): string | null {
  const match = message.match(/@([a-zA-Z0-9_-]+)(?!\/)/) || message.match(/(?:repos of|repositories of)\s+([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Main API functions with advanced capabilities
export async function testHuggingFaceAPI(): Promise<boolean> {
  try {
    console.log('🧪 Testing Hugging Face API with advanced client...');
    
    const testPrompt = 'Hello, this is a test message.';
    const response = await advancedClient.generateText(
      AI_MODELS.CHAT_MODELS[3], // Use smallest model for testing
      testPrompt,
      { maxTokens: 20, temperature: 0.5 }
    );
    
    console.log('✅ API Test Response:', response);
    return response && response.length > 0;
  } catch (error) {
    console.error('❌ API Test Failed:', error);
    return false;
  }
}

export async function getChatbotResponse(userMessage: string, context?: any): Promise<string> {
  try {
    if (!import.meta.env.VITE_HUGGINGFACE_API_KEY) {
      return '⚠️ AI service is not configured. Please check the API key.';
    }

    // Add message to conversation context
    conversationContext.addMessage('user', userMessage, context);

    // Detect intent and route accordingly
    const intent = IntentRouter.detectIntent(userMessage);
    const promptTemplate = IntentRouter.getPromptTemplate(intent);
    const modelOptions = IntentRouter.selectBestModel(intent);

    // Handle repository analysis
    if (intent === 'ANALYZE_REPOSITORY') {
      const repoRef = parseRepositoryReference(userMessage);
      if (repoRef) {
        try {
          const analysis = await analyzeRepositoryHealth(repoRef.owner, repoRef.repo);
          return ResponseProcessor.formatRepositoryAnalysis(analysis);
        } catch (error) {
          return `❌ Could not analyze repository ${repoRef.owner}/${repoRef.repo}. Please make sure the repository exists and is public.`;
        }
      } else {
        return '📝 Please specify a repository in the format "owner/repo" or "github.com/owner/repo" to analyze.';
      }
    }

    // Handle user repositories listing
    if (intent === 'LIST_USER_REPOS') {
      const username = extractUsername(userMessage);
      if (username) {
        try {
          const repos = await fetchUserRepos(username);
          const topRepos = repos
            .filter(repo => !repo.fork)
            .sort((a, b) => b.stargazers_count - a.stargazers_count)
            .slice(0, 10);

          let response = `📚 **Top repositories for @${username}**:\n\n`;
          
          topRepos.forEach((repo, index) => {
            response += `${index + 1}. **${repo.name}** ⭐ ${repo.stargazers_count} 🍴 ${repo.forks_count}\n`;
            response += `   ${repo.description || 'No description'}\n`;
            response += `   Language: ${repo.language || 'Not specified'}\n\n`;
          });

          response += `\n💡 To analyze a specific repository, type: "analyze ${username}/repository-name"`;
          
          return response;
        } catch (error) {
          return `❌ Could not fetch repositories for @${username}. Please make sure the username is correct.`;
        }
      } else {
        return '👤 Please specify a username like "repos of username" or "repositories of @username".';
      }
    }

    // Build enhanced prompt with context
    const recentContext = conversationContext.getRecentContext(3);
    const enhancedPrompt = `${promptTemplate}

Recent conversation:
${recentContext}

Current question: ${userMessage}

Please provide a helpful, detailed response:`;

    // Try multiple models with fallback
    for (const model of modelOptions) {
      try {
        console.log(`🤖 Trying model: ${model}`);
        
        let response = '';
        
        if (intent === 'GENERAL_CHAT') {
          // Use conversational API for chat
          response = await advancedClient.conversationalResponse(
            model,
            userMessage,
            {
              temperature: 0.8,
              maxLength: 250
            }
          );
        } else {
          // Use text generation for specific tasks
          response = await advancedClient.generateText(
            model,
            enhancedPrompt,
            {
              maxTokens: 300,
              temperature: 0.7
            }
          );
        }

        if (response && response.length > 10) {
          // Process and enhance the response
          let processedResponse = ResponseProcessor.cleanResponse(response, enhancedPrompt);
          processedResponse = ResponseProcessor.enhanceGitHubResponse(processedResponse, context);
          
          if (intent === 'CODE_ADVICE') {
            processedResponse = ResponseProcessor.formatCodeAdvice(processedResponse);
          }

          // Add to conversation context
          conversationContext.addMessage('assistant', processedResponse);

          return processedResponse || 'I understand your question about GitHub. Let me help you with that!';
        }
      } catch (modelError) {
        console.log(`❌ Model ${model} failed:`, modelError.message);
        continue;
      }
    }

    // Fallback response with helpful suggestions
    return `I'm here to help with GitHub-related questions! You can ask me about:

🔍 **Profile Analysis**: "analyze @username" or "repos of username"
📊 **Repository Analysis**: "analyze owner/repo" or "check facebook/react"
💼 **Career Advice**: "GitHub for job applications" or "building a developer portfolio"
🚀 **Growth Strategies**: "how to get more followers" or "open source contribution tips"

What would you like to know more about?`;

  } catch (error) {
    console.error('💥 Chatbot Error:', error);
    
    if (error.message?.includes('API_KEY')) {
      return '🔑 The AI service needs to be configured with a valid API key.';
    } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return '⏱️ The AI service is temporarily busy. Please try again in a moment.';
    }
    
    return '🤖 I encountered a technical issue, but I\'m still here to help! Try asking your question in a different way, or ask me about GitHub best practices, profile optimization, or repository management.';
  }
}

export async function analyzeProfile(username: string): Promise<string> {
  try {
    const prompt = `As a GitHub expert, provide a comprehensive analysis for the profile: ${username}

Please provide insights on:

🎯 **Profile Optimization**:
- Profile completeness and professional presentation
- Bio, avatar, and contact information effectiveness
- Pinned repositories selection and showcase value

📊 **Repository Quality Assessment**:
- Code organization and structure patterns
- Documentation standards and README quality
- Project diversity and technical breadth

🚀 **Growth Opportunities**:
- Contribution consistency and activity patterns
- Community engagement and collaboration potential
- Areas for skill development and improvement

💡 **Actionable Recommendations**:
- Specific steps to enhance profile visibility
- Strategies for building technical reputation
- Best practices for ongoing development

Provide detailed, actionable advice that helps improve their GitHub presence.`;

    const response = await advancedClient.generateText(
      AI_MODELS.TEXT_MODELS[0],
      prompt,
      { maxTokens: 400, temperature: 0.7 }
    );

    return ResponseProcessor.enhanceGitHubResponse(
      ResponseProcessor.cleanResponse(response, prompt),
      { username, type: 'profile_analysis' }
    ) || `Here's a comprehensive analysis framework for ${username}'s GitHub profile:

🎯 **Profile Optimization Checklist**:
• Complete profile with professional photo and bio
• Clear description of skills and interests
• Contact information and portfolio links
• Pinned repositories showcasing best work

📊 **Repository Quality Factors**:
• Well-documented projects with clear READMEs
• Consistent code style and organization
• Active maintenance and regular updates
• Diverse technology stack demonstration

🚀 **Growth Strategies**:
• Regular contribution patterns
• Open source project participation
• Community engagement through issues/PRs
• Technical blog posts and documentation

💡 **Next Steps**:
• Audit current repositories for quality
• Create a profile README to stand out
• Contribute to popular open source projects
• Share knowledge through documentation`;

  } catch (error) {
    console.error('Profile Analysis Error:', error);
    return `I'd be happy to help analyze the GitHub profile for ${username}! Here are key areas to focus on:

🎯 **Profile Essentials**: Professional photo, compelling bio, contact info
📊 **Repository Quality**: Clear documentation, consistent coding style, active projects
🚀 **Community Engagement**: Contributing to open source, helping others
💡 **Professional Growth**: Showcasing diverse skills, building a portfolio

Would you like me to elaborate on any of these areas?`;
  }
}

export async function compareProfiles(profile1: any, profile2: any): Promise<string> {
  try {
    const prompt = `Compare these GitHub profiles in detail:

**Profile 1: ${profile1.user.login}**
- Repositories: ${profile1.metrics.repositories}
- Stars: ${profile1.metrics.totalStars}
- Followers: ${profile1.metrics.followers}
- Languages: ${profile1.metrics.languages}
- Score: ${Math.round(profile1.metrics.totalScore)}

**Profile 2: ${profile2.user.login}**
- Repositories: ${profile2.metrics.repositories}
- Stars: ${profile2.metrics.totalStars}
- Followers: ${profile2.metrics.followers}
- Languages: ${profile2.metrics.languages}
- Score: ${Math.round(profile2.metrics.totalScore)}

Provide a comprehensive comparison including:
1. Technical strengths and weaknesses analysis
2. Community engagement comparison
3. Repository quality assessment
4. Growth recommendations for both profiles
5. Overall winner determination with reasoning`;

    const response = await advancedClient.generateText(
      AI_MODELS.TEXT_MODELS[1],
      prompt,
      { maxTokens: 500, temperature: 0.6 }
    );

    return ResponseProcessor.enhanceGitHubResponse(
      ResponseProcessor.cleanResponse(response, prompt),
      { type: 'profile_comparison', profiles: [profile1.user.login, profile2.user.login] }
    ) || `Here's a detailed comparison between ${profile1.user.login} and ${profile2.user.login}:

📊 **Metrics Comparison**:
• ${profile1.user.login}: ${profile1.metrics.totalStars} stars, ${profile1.metrics.followers} followers
• ${profile2.user.login}: ${profile2.metrics.totalStars} stars, ${profile2.metrics.followers} followers

🏆 **Strengths Analysis**:
• Repository count and diversity
• Community engagement levels
• Technical skill demonstration
• Contribution consistency

💡 **Recommendations**:
• Focus on quality over quantity
• Improve documentation and READMEs
• Engage more with the community
• Showcase diverse technical skills`;

  } catch (error) {
    console.error('Profile Comparison Error:', error);
    return `I can help compare ${profile1.user.login} and ${profile2.user.login}! 

Key comparison areas:
🎯 **Technical Skills**: Repository diversity and code quality
📊 **Community Impact**: Stars, forks, and follower engagement  
🚀 **Growth Potential**: Contribution patterns and project maintenance
💼 **Professional Presence**: Profile completeness and presentation

Both profiles have unique strengths that can be leveraged for continued growth!`;
  }
}

export async function getRepositoryAdvice(repoData: any): Promise<string> {
  try {
    const prompt = `Analyze this GitHub repository and provide improvement suggestions:

**Repository**: ${repoData.name}
**Description**: ${repoData.description || 'No description'}
**Language**: ${repoData.language || 'Not specified'}
**Stars**: ${repoData.stargazers_count}
**Forks**: ${repoData.forks_count}

Provide specific advice on:
1. README and documentation improvements
2. Code organization and structure
3. Community engagement strategies
4. Visibility and discoverability
5. Best practices for this project type`;

    const response = await advancedClient.generateText(
      AI_MODELS.CODE_MODELS[0],
      prompt,
      { maxTokens: 350, temperature: 0.7 }
    );

    return ResponseProcessor.formatCodeAdvice(
      ResponseProcessor.cleanResponse(response, prompt)
    ) || `Here's how to improve the ${repoData.name} repository:

📝 **Documentation**:
• Create a comprehensive README with setup instructions
• Add code comments and API documentation
• Include contribution guidelines

🏗️ **Structure**:
• Organize code into logical directories
• Follow language-specific conventions
• Add proper configuration files

🌟 **Visibility**:
• Use descriptive repository name and description
• Add relevant topics and tags
• Create engaging project screenshots

🤝 **Community**:
• Respond to issues and pull requests promptly
• Welcome first-time contributors
• Maintain active development`;

  } catch (error) {
    console.error('Repository Advice Error:', error);
    return `Here are key areas to improve your repository:

📝 **Documentation**: Clear README, setup instructions, usage examples
🏗️ **Organization**: Logical file structure, consistent naming conventions
🌟 **Discoverability**: Good description, relevant topics, screenshots
🤝 **Community**: Issue templates, contribution guidelines, responsive maintenance

Focus on making your project easy to understand and contribute to!`;
  }
}

// Legacy function for compatibility
export async function getProfileAdvice(profile1: any, profile2: any): Promise<string> {
  return compareProfiles(profile1, profile2);
}