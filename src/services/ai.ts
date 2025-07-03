import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { HfInference } from '@huggingface/inference';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const hf = new HfInference(import.meta.env.VITE_HUGGINGFACE_API_KEY);

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

const chatModel = genAI.getGenerativeModel({ 
  model: "gemini-pro",
  safetySettings,
});

const profileAssistantContext = `
You are an expert GitHub profile advisor with deep knowledge of:
- Open source development best practices
- GitHub profile optimization
- Developer branding and visibility
- Community engagement strategies
- Repository management and documentation
- Code quality metrics and standards

Your goal is to help developers improve their GitHub presence by providing:
1. Actionable, specific advice
2. Data-driven insights
3. Best practices and examples
4. Strategic recommendations
5. Professional growth guidance

When analyzing profiles, consider:
- Repository quality and organization
- Documentation standards
- Contribution patterns
- Community engagement
- Code quality
- Project diversity
- Professional presentation
`;

export async function testHuggingFaceAPI(): Promise<boolean> {
  try {
    console.log('Testing Hugging Face API...');
    const response = await hf.textGeneration({
      model: 'gpt2',
      inputs: 'Hello, this is a test.',
      parameters: {
        max_new_tokens: 20,
        temperature: 0.7,
        do_sample: true,
      }
    });
    
    console.log('Hugging Face API Response:', response);
    return response && response.generated_text ? true : false;
  } catch (error) {
    console.error('Hugging Face API Error:', error);
    return false;
  }
}

export async function getProfileAdvice(profile1: any, profile2: any) {
  try {
    const prompt = `
      As a GitHub profile optimization expert, analyze these profiles and provide:
      1. Technical comparison (strengths/weaknesses)
      2. Improvement opportunities for both profiles
      3. Detailed scoring breakdown
      4. Strategic recommendations for growth
      
      Profile 1 (${profile1.user.login}):
      - Repositories: ${profile1.metrics.repositories}
      - Stars: ${profile1.metrics.totalStars}
      - Forks: ${profile1.metrics.totalForks}
      - Followers: ${profile1.metrics.followers}
      - Languages: ${profile1.metrics.languages}
      - Total Score: ${Math.round(profile1.metrics.totalScore)}
      
      Profile 2 (${profile2.user.login}):
      - Repositories: ${profile2.metrics.repositories}
      - Stars: ${profile2.metrics.totalStars}
      - Forks: ${profile2.metrics.totalForks}
      - Followers: ${profile2.metrics.followers}
      - Languages: ${profile2.metrics.languages}
      - Total Score: ${Math.round(profile2.metrics.totalScore)}
      
      Provide a comprehensive analysis with actionable insights.
    `;

    const result = await chatModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting AI analysis:', error);
    return 'Sorry, I couldn\'t generate the analysis at the moment. The AI service might be temporarily unavailable. Please try again later!';
  }
}

export async function getChatbotResponse(userMessage: string, context?: any) {
  try {
    // Check if we have valid API keys
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      return 'AI service is not properly configured. Please check the API keys.';
    }

    // Create a more focused prompt for better responses
    const systemPrompt = `${profileAssistantContext}

User Context: ${context ? JSON.stringify(context, null, 2) : 'No additional context'}

Please provide helpful, specific advice related to GitHub profiles, repositories, and software development best practices. Keep responses informative but concise.

User Question: ${userMessage}`;

    const result = await chatModel.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text || text.trim().length === 0) {
      return 'I apologize, but I couldn\'t generate a proper response. Please try rephrasing your question.';
    }
    
    return text;
  } catch (error) {
    console.error('Error getting chatbot response:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('API_KEY')) {
      return 'The AI service is not properly configured. Please check the API configuration.';
    } else if (error.message?.includes('quota')) {
      return 'The AI service has reached its usage limit. Please try again later.';
    } else if (error.message?.includes('safety')) {
      return 'Your message was flagged by safety filters. Please try rephrasing your question.';
    }
    
    return 'I apologize, but I encountered an error while processing your request. Please try asking your question again in a different way.';
  }
}

export async function analyzeProfile(username: string) {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      return 'AI service is not properly configured. Please check the API keys.';
    }

    const prompt = `Analyze the GitHub profile for username: ${username}
    
    As a GitHub expert, provide insights on:
    1. Profile completeness and optimization opportunities
    2. Repository quality and organization assessment
    3. Contribution patterns and activity analysis
    4. Areas for improvement with specific recommendations
    5. Strategic advice for growth and visibility
    
    Be specific and actionable in your advice. Focus on practical steps they can take to improve their GitHub presence.
    
    Note: You should provide general advice based on best practices since you cannot access real-time GitHub data.`;

    const result = await chatModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text || text.trim().length === 0) {
      return 'Unable to analyze profile at the moment. Please try again later.';
    }
    
    return text;
  } catch (error) {
    console.error('Error analyzing profile:', error);
    return 'Unable to analyze profile at the moment. The AI service might be temporarily unavailable. Please try again later.';
  }
}

export async function compareProfiles(profile1: any, profile2: any) {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      return 'AI service is not properly configured. Please check the API keys.';
    }

    const prompt = `Compare these two GitHub profiles in detail:
    
    Profile 1: ${profile1.user.login}
    - Repositories: ${profile1.metrics.repositories}
    - Stars: ${profile1.metrics.totalStars}
    - Followers: ${profile1.metrics.followers}
    - Languages: ${profile1.metrics.languages}
    - Total Score: ${Math.round(profile1.metrics.totalScore)}
    
    Profile 2: ${profile2.user.login}
    - Repositories: ${profile2.metrics.repositories}
    - Stars: ${profile2.metrics.totalStars}
    - Followers: ${profile2.metrics.followers}
    - Languages: ${profile2.metrics.languages}
    - Total Score: ${Math.round(profile2.metrics.totalScore)}
    
    Provide:
    1. Detailed comparison analysis with key differences
    2. Strengths and weaknesses of each profile
    3. Specific recommendations for improvement for both users
    4. Who has the stronger profile and why
    5. Actionable next steps for both developers
    
    Make the analysis engaging and constructive.`;

    const result = await chatModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text || text.trim().length === 0) {
      return 'Unable to compare profiles at the moment. Please try again later.';
    }
    
    return text;
  } catch (error) {
    console.error('Error comparing profiles:', error);
    return 'Unable to compare profiles at the moment. The AI service might be temporarily unavailable. Please try again later.';
  }
}

export async function getRepositoryAdvice(repoData: any) {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      return 'AI service is not properly configured. Please check the API keys.';
    }

    const prompt = `Analyze this GitHub repository and provide improvement suggestions:
    
    Repository: ${repoData.name}
    Description: ${repoData.description || 'No description provided'}
    Language: ${repoData.language || 'Not specified'}
    Stars: ${repoData.stargazers_count}
    Forks: ${repoData.forks_count}
    
    Provide specific advice on:
    1. README improvement and documentation enhancement
    2. Code organization and structure recommendations
    3. Community engagement strategies
    4. Visibility and discoverability improvements
    5. Best practices for this type of project
    
    Focus on actionable steps that will improve the repository's impact.`;

    const result = await chatModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text || text.trim().length === 0) {
      return 'Unable to analyze repository at the moment. Please try again later.';
    }
    
    return text;
  } catch (error) {
    console.error('Error getting repository advice:', error);
    return 'Unable to analyze repository at the moment. The AI service might be temporarily unavailable. Please try again later.';
  }
}