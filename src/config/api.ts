// API Configuration - Replace these with your actual API keys
export const API_CONFIG = {
  // Hugging Face API Configuration
  HUGGINGFACE: {
    API_KEY: 'hf_your_huggingface_api_key_here', // Replace with your actual HF API key
    BASE_URL: 'https://api-inference.huggingface.co',
    MODELS: {
      TEXT_GENERATION: 'microsoft/DialoGPT-large',
      CODE_ANALYSIS: 'microsoft/codebert-base',
      SENTIMENT: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
      SUMMARIZATION: 'facebook/bart-large-cnn'
    }
  },
  
  // Google Gemini API Configuration
  GEMINI: {
    API_KEY: 'your_google_gemini_api_key_here', // Replace with your actual Gemini API key
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
    MODEL: 'gemini-pro'
  },
  
  // GitHub API Configuration
  GITHUB: {
    BASE_URL: 'https://api.github.com',
    // No API key needed for public repositories
  }
};

// API Key validation
export const validateAPIKeys = () => {
  const issues = [];
  
  if (!API_CONFIG.HUGGINGFACE.API_KEY || API_CONFIG.HUGGINGFACE.API_KEY === 'hf_your_huggingface_api_key_here') {
    issues.push('Hugging Face API key is not configured');
  }
  
  if (!API_CONFIG.GEMINI.API_KEY || API_CONFIG.GEMINI.API_KEY === 'your_google_gemini_api_key_here') {
    issues.push('Google Gemini API key is not configured');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

// Helper function to get API headers
export const getAPIHeaders = (service: 'huggingface' | 'gemini') => {
  switch (service) {
    case 'huggingface':
      return {
        'Authorization': `Bearer ${API_CONFIG.HUGGINGFACE.API_KEY}`,
        'Content-Type': 'application/json'
      };
    case 'gemini':
      return {
        'Content-Type': 'application/json'
      };
    default:
      return {};
  }
};