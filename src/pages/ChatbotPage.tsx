import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, User, Sparkles, GitBranch, Star, Users, Code, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { getChatbotResponse, analyzeProfile, compareProfiles, getRepositoryAdvice, testHuggingFaceAPI } from '../services/ai';
import { fetchCompleteProfile } from '../api/github';
import { ProfileWithMetrics } from '../types';

interface Message {
  text: string;
  isBot: boolean;
  timestamp: Date;
  type?: 'text' | 'analysis' | 'comparison' | 'repository' | 'error';
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  action: string;
  description: string;
}

const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      text: "🚀 Welcome to your GitHub AI Assistant! I'm here to help you optimize your GitHub presence, analyze profiles, and provide expert advice on software development. What would you like to explore today?", 
      isBot: true, 
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profiles, setProfiles] = useState<ProfileWithMetrics[]>([]);
  const [apiStatus, setApiStatus] = useState<'checking' | 'working' | 'error'>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickActions: QuickAction[] = [
    {
      icon: <User className="h-5 w-5" />,
      label: "Analyze Profile",
      action: "analyze-profile",
      description: "Get detailed insights about a GitHub profile"
    },
    {
      icon: <GitBranch className="h-5 w-5" />,
      label: "Compare Profiles",
      action: "compare-profiles",
      description: "Compare two GitHub profiles side by side"
    },
    {
      icon: <Code className="h-5 w-5" />,
      label: "Repository Tips",
      action: "repository-tips",
      description: "Get advice on improving your repositories"
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: "Growth Strategy",
      action: "growth-strategy",
      description: "Learn how to grow your GitHub presence"
    },
    {
      icon: <Star className="h-5 w-5" />,
      label: "Profile Optimization",
      action: "profile-optimization",
      description: "Tips to optimize your GitHub profile"
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Community Engagement",
      action: "community-engagement",
      description: "How to engage with the GitHub community"
    }
  ];

  // Check API status on component mount
  useEffect(() => {
    const checkAPIStatus = async () => {
      try {
        // Test if we have the required API keys
        if (!import.meta.env.VITE_GEMINI_API_KEY) {
          setApiStatus('error');
          setMessages(prev => [...prev, {
            text: "⚠️ AI service is not properly configured. API keys are missing.",
            isBot: true,
            timestamp: new Date(),
            type: 'error'
          }]);
          return;
        }

        // Test Hugging Face API
        const hfWorking = await testHuggingFaceAPI();
        console.log('Hugging Face API Status:', hfWorking);
        
        setApiStatus('working');
        setMessages(prev => [...prev, {
          text: `✅ AI services are online and ready! ${hfWorking ? 'Both Gemini and Hugging Face APIs are working.' : 'Gemini API is working (Hugging Face as backup).'}`,
          isBot: true,
          timestamp: new Date(),
          type: 'text'
        }]);
      } catch (error) {
        console.error('API Status Check Error:', error);
        setApiStatus('error');
        setMessages(prev => [...prev, {
          text: "❌ There was an issue checking the AI service status. Some features may not work properly.",
          isBot: true,
          timestamp: new Date(),
          type: 'error'
        }]);
      }
    };

    checkAPIStatus();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { 
      text: userMessage, 
      isBot: false, 
      timestamp: new Date(),
      type: 'text'
    }]);
    setIsLoading(true);

    try {
      let response = '';
      let messageType: 'text' | 'analysis' | 'comparison' | 'repository' | 'error' = 'text';

      // Check for specific commands
      if (userMessage.toLowerCase().includes('analyze profile') || userMessage.toLowerCase().includes('analyze @')) {
        const username = extractUsername(userMessage);
        if (username) {
          response = await analyzeProfile(username);
          messageType = 'analysis';
        } else {
          response = "Please specify a GitHub username to analyze. For example: 'analyze profile @username' or 'analyze @username'";
        }
      } else if (userMessage.toLowerCase().includes('compare') && userMessage.includes('@')) {
        const usernames = extractMultipleUsernames(userMessage);
        if (usernames.length >= 2) {
          try {
            const profile1 = await fetchCompleteProfile(usernames[0]);
            const profile2 = await fetchCompleteProfile(usernames[1]);
            response = await compareProfiles(profile1, profile2);
            messageType = 'comparison';
          } catch (error) {
            response = `Error fetching profiles for comparison. Please make sure the usernames are correct.`;
            messageType = 'error';
          }
        } else {
          response = "Please specify two GitHub usernames to compare. For example: 'compare @user1 and @user2'";
        }
      } else if (userMessage.toLowerCase().includes('test api') || userMessage.toLowerCase().includes('api status')) {
        // Test API functionality
        const hfWorking = await testHuggingFaceAPI();
        response = `API Status Check:\n✅ Gemini API: Working\n${hfWorking ? '✅' : '❌'} Hugging Face API: ${hfWorking ? 'Working' : 'Not available'}\n\nYou can ask me questions about GitHub profiles, repositories, and development best practices!`;
      } else {
        // Regular chat response
        response = await getChatbotResponse(userMessage, { profiles });
      }

      setMessages(prev => [...prev, { 
        text: response, 
        isBot: true, 
        timestamp: new Date(),
        type: messageType
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        text: "I apologize, but I encountered an error while processing your request. Please try again or check if the AI service is properly configured.", 
        isBot: true, 
        timestamp: new Date(),
        type: 'error'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    let prompt = '';
    
    switch (action) {
      case 'analyze-profile':
        prompt = 'How can I analyze a GitHub profile? What should I look for?';
        break;
      case 'compare-profiles':
        prompt = 'How do I compare two GitHub profiles effectively?';
        break;
      case 'repository-tips':
        prompt = 'What are the best practices for organizing and maintaining GitHub repositories?';
        break;
      case 'growth-strategy':
        prompt = 'What strategies can I use to grow my GitHub presence and attract more followers?';
        break;
      case 'profile-optimization':
        prompt = 'How can I optimize my GitHub profile to make it more attractive to employers and collaborators?';
        break;
      case 'community-engagement':
        prompt = 'How can I better engage with the GitHub community and contribute to open source projects?';
        break;
      default:
        return;
    }

    setInput(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const extractUsername = (text: string): string | null => {
    const match = text.match(/@([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const extractMultipleUsernames = (text: string): string[] => {
    const matches = text.match(/@([a-zA-Z0-9_-]+)/g);
    return matches ? matches.map(match => match.substring(1)) : [];
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'analysis':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      case 'comparison':
        return <GitBranch className="h-4 w-4 text-blue-500" />;
      case 'repository':
        return <Code className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <div className="relative">
              <Bot className="h-16 w-16 text-blue-600" />
              <Zap className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1" />
              {apiStatus === 'working' && (
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              )}
              {apiStatus === 'error' && (
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
              )}
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            GitHub AI Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Your intelligent companion for GitHub optimization and development insights
          </p>
          <div className="mt-2 flex justify-center items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${apiStatus === 'working' ? 'bg-green-500' : apiStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {apiStatus === 'working' ? 'AI Services Online' : apiStatus === 'error' ? 'Service Issues' : 'Checking Services...'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.action)}
                    className="w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors group"
                  >
                    <div className="flex items-center mb-1">
                      <span className="text-blue-600 group-hover:text-blue-700 mr-2">
                        {action.icon}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {action.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {action.description}
                    </p>
                  </button>
                ))}
              </div>
              
              {/* API Test Button */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setInput('test api')}
                  className="w-full text-left p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <div className="flex items-center mb-1">
                    <Zap className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-900 dark:text-blue-300 text-sm">
                      Test AI Services
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Check if AI services are working
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-[700px] flex flex-col">
              {/* Chat Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center">
                  <Bot className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">GitHub AI Assistant</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Powered by AI • GitHub Expert
                    </p>
                  </div>
                  <div className="ml-auto flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${apiStatus === 'working' ? 'bg-green-500' : apiStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                    <span className={`text-sm ${apiStatus === 'working' ? 'text-green-600 dark:text-green-400' : apiStatus === 'error' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                      {apiStatus === 'working' ? 'Online' : apiStatus === 'error' ? 'Issues' : 'Checking...'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-4 ${
                        message.isBot
                          ? message.type === 'error'
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {message.isBot && (
                        <div className="flex items-center mb-2">
                          {getMessageIcon(message.type || 'text')}
                          <span className="font-semibold ml-2">AI Assistant</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                            {formatTimestamp(message.timestamp)}
                          </span>
                        </div>
                      )}
                      <div className="whitespace-pre-line leading-relaxed">
                        {message.text}
                      </div>
                      {!message.isBot && (
                        <div className="text-xs text-blue-200 mt-2 text-right">
                          {formatTimestamp(message.timestamp)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 max-w-[85%]">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-gray-600 dark:text-gray-300">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex space-x-4">
                  <div className="flex-1 relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me about GitHub profiles, repositories, or development best practices..."
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                      rows={2}
                      disabled={isLoading}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                      Press Enter to send
                    </div>
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="bg-blue-600 text-white rounded-lg px-6 py-3 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Example Commands */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Try:</span>
                  {['analyze @username', 'compare @user1 and @user2', 'repository best practices', 'test api'].map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(example)}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;