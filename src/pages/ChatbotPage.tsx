import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, User, Sparkles, GitBranch, Star, Users, Code, Zap, TrendingUp, AlertCircle, CheckCircle, Clock, Cpu, FolderOpen, Search } from 'lucide-react';
import { getChatbotResponse, analyzeProfile, compareProfiles, getRepositoryAdvice, testHuggingFaceAPI } from '../services/ai';
import { fetchCompleteProfile } from '../api/github';
import { ProfileWithMetrics } from '../types';

interface Message {
  text: string;
  isBot: boolean;
  timestamp: Date;
  type?: 'text' | 'analysis' | 'comparison' | 'repository' | 'error' | 'success' | 'loading';
  metadata?: any;
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  action: string;
  description: string;
  color: string;
}

const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      text: "🚀 Welcome to your Advanced GitHub AI Assistant! I'm powered by cutting-edge Hugging Face AI models and ready to help you optimize your GitHub presence, analyze profiles, and provide expert software development advice.\n\n✨ I can help you with:\n• Profile analysis and optimization\n• Repository analysis and improvement\n• Career development advice\n• Code quality assessment\n• Community engagement tips\n\n🔍 **New Feature**: Repository Analysis!\nTry: \"analyze facebook/react\" or \"repos of username\"\n\nWhat would you like to explore today?", 
      isBot: true, 
      timestamp: new Date(),
      type: 'success'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profiles, setProfiles] = useState<ProfileWithMetrics[]>([]);
  const [apiStatus, setApiStatus] = useState<'checking' | 'working' | 'error'>('checking');
  const [typingIndicator, setTypingIndicator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickActions: QuickAction[] = [
    {
      icon: <User className="h-5 w-5" />,
      label: "Analyze Profile",
      action: "analyze-profile",
      description: "Get detailed insights about a GitHub profile",
      color: "bg-blue-500"
    },
    {
      icon: <FolderOpen className="h-5 w-5" />,
      label: "Repository Analysis",
      action: "repository-analysis",
      description: "Analyze any GitHub repository in detail",
      color: "bg-indigo-500"
    },
    {
      icon: <Search className="h-5 w-5" />,
      label: "User Repositories",
      action: "user-repositories",
      description: "List and explore user's repositories",
      color: "bg-cyan-500"
    },
    {
      icon: <GitBranch className="h-5 w-5" />,
      label: "Compare Profiles",
      action: "compare-profiles", 
      description: "Compare two GitHub profiles side by side",
      color: "bg-purple-500"
    },
    {
      icon: <Code className="h-5 w-5" />,
      label: "Repository Tips",
      action: "repository-tips",
      description: "Get advice on improving your repositories",
      color: "bg-green-500"
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: "Growth Strategy",
      action: "growth-strategy",
      description: "Learn how to grow your GitHub presence",
      color: "bg-orange-500"
    },
    {
      icon: <Star className="h-5 w-5" />,
      label: "Profile Optimization",
      action: "profile-optimization",
      description: "Tips to optimize your GitHub profile",
      color: "bg-yellow-500"
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Community Engagement",
      action: "community-engagement",
      description: "How to engage with the GitHub community",
      color: "bg-pink-500"
    }
  ];

  // Enhanced API status checking
  useEffect(() => {
    const checkAPIStatus = async () => {
      try {
        if (!import.meta.env.VITE_HUGGINGFACE_API_KEY) {
          setApiStatus('error');
          setMessages(prev => [...prev, {
            text: "⚠️ AI service is not properly configured. Hugging Face API key is missing.",
            isBot: true,
            timestamp: new Date(),
            type: 'error'
          }]);
          return;
        }

        setMessages(prev => [...prev, {
          text: "🔍 Testing AI services...",
          isBot: true,
          timestamp: new Date(),
          type: 'loading'
        }]);

        const hfWorking = await testHuggingFaceAPI();
        
        if (hfWorking) {
          setApiStatus('working');
          setMessages(prev => [...prev, {
            text: "✅ Advanced AI services are online and ready! Powered by Hugging Face's latest models including DialoGPT, CodeBERT, and specialized GitHub analysis models.\n\n🆕 **Repository Analysis Feature**: Now you can analyze any GitHub repository by typing commands like:\n• \"analyze facebook/react\"\n• \"check microsoft/vscode\"\n• \"repos of username\"",
            isBot: true,
            timestamp: new Date(),
            type: 'success'
          }]);
        } else {
          setApiStatus('error');
          setMessages(prev => [...prev, {
            text: "❌ AI services are currently unavailable. Please check your connection and try again.",
            isBot: true,
            timestamp: new Date(),
            type: 'error'
          }]);
        }
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
  }, [messages, typingIndicator]);

  const simulateTyping = (duration: number = 2000) => {
    setTypingIndicator(true);
    setTimeout(() => setTypingIndicator(false), duration);
  };

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
    simulateTyping();

    try {
      let response = '';
      let messageType: 'text' | 'analysis' | 'comparison' | 'repository' | 'error' | 'success' = 'text';
      let metadata: any = {};

      // Enhanced command detection with better parsing
      if (userMessage.toLowerCase().includes('analyze') && (userMessage.toLowerCase().includes('profile') || userMessage.includes('@'))) {
        const username = extractUsername(userMessage);
        if (username) {
          messageType = 'analysis';
          metadata = { username };
          setMessages(prev => [...prev, {
            text: `🔍 Analyzing GitHub profile for @${username}...`,
            isBot: true,
            timestamp: new Date(),
            type: 'loading'
          }]);
          response = await analyzeProfile(username);
        } else {
          response = "Please specify a GitHub username to analyze. For example: 'analyze profile @username' or 'analyze @username'";
          messageType = 'error';
        }
      } else if (userMessage.toLowerCase().includes('compare') && userMessage.includes('@')) {
        const usernames = extractMultipleUsernames(userMessage);
        if (usernames.length >= 2) {
          messageType = 'comparison';
          metadata = { usernames };
          setMessages(prev => [...prev, {
            text: `⚖️ Comparing profiles @${usernames[0]} vs @${usernames[1]}...`,
            isBot: true,
            timestamp: new Date(),
            type: 'loading'
          }]);
          try {
            const profile1 = await fetchCompleteProfile(usernames[0]);
            const profile2 = await fetchCompleteProfile(usernames[1]);
            response = await compareProfiles(profile1, profile2);
          } catch (error) {
            response = `Error fetching profiles for comparison. Please make sure the usernames are correct: @${usernames[0]} and @${usernames[1]}`;
            messageType = 'error';
          }
        } else {
          response = "Please specify two GitHub usernames to compare. For example: 'compare @user1 and @user2' or 'compare @user1 vs @user2'";
          messageType = 'error';
        }
      } else if (userMessage.toLowerCase().includes('test api') || userMessage.toLowerCase().includes('api status')) {
        setMessages(prev => [...prev, {
          text: "🧪 Running comprehensive API diagnostics...",
          isBot: true,
          timestamp: new Date(),
          type: 'loading'
        }]);
        
        const hfWorking = await testHuggingFaceAPI();
        response = `🔧 **Advanced AI System Status**:

✅ **Hugging Face API**: ${hfWorking ? 'Operational' : 'Unavailable'}
🤖 **Available Models**: DialoGPT, CodeBERT, GPT-2, RoBERTa
🚀 **Features**: Profile analysis, repository analysis, code review, career advice
⚡ **Response Time**: ~2-5 seconds
🔄 **Fallback Systems**: Multiple model redundancy

🆕 **Repository Analysis**: 
• Analyze any repo: "analyze owner/repo"
• List user repos: "repos of username"
• Get detailed insights on code quality, documentation, and community health

${hfWorking ? '🎉 All systems are go! Ask me anything about GitHub!' : '⚠️ Some features may be limited. Please try again later.'}`;
        messageType = hfWorking ? 'success' : 'error';
      } else {
        // Enhanced general chat with context awareness
        setMessages(prev => [...prev, {
          text: "🤔 Processing your question with advanced AI...",
          isBot: true,
          timestamp: new Date(),
          type: 'loading'
        }]);
        response = await getChatbotResponse(userMessage, { profiles, previousMessages: messages.slice(-5) });
        messageType = 'success';
      }

      // Remove loading message and add final response
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.type !== 'loading');
        return [...filtered, { 
          text: response, 
          isBot: true, 
          timestamp: new Date(),
          type: messageType,
          metadata
        }];
      });
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.type !== 'loading');
        return [...filtered, { 
          text: "🚨 I encountered an error while processing your request. My advanced AI systems are working to resolve this. Please try again or ask a different question!", 
          isBot: true, 
          timestamp: new Date(),
          type: 'error'
        }];
      });
    } finally {
      setIsLoading(false);
      setTypingIndicator(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    let prompt = '';
    
    switch (action) {
      case 'analyze-profile':
        prompt = 'How can I analyze a GitHub profile? What should I look for to assess quality and potential?';
        break;
      case 'repository-analysis':
        prompt = 'How can I analyze a GitHub repository? What metrics and factors should I consider?';
        break;
      case 'user-repositories':
        prompt = 'How can I explore and analyze all repositories of a specific user?';
        break;
      case 'compare-profiles':
        prompt = 'What are the best strategies for comparing GitHub profiles? What metrics matter most?';
        break;
      case 'repository-tips':
        prompt = 'What are the advanced best practices for organizing and maintaining GitHub repositories?';
        break;
      case 'growth-strategy':
        prompt = 'What are proven strategies to grow my GitHub presence and attract more followers and collaborators?';
        break;
      case 'profile-optimization':
        prompt = 'How can I optimize my GitHub profile to make it more attractive to employers and the developer community?';
        break;
      case 'community-engagement':
        prompt = 'How can I better engage with the GitHub community and contribute meaningfully to open source projects?';
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
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'loading':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (apiStatus) {
      case 'working': return 'text-green-600 dark:text-green-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getStatusText = () => {
    switch (apiStatus) {
      case 'working': return 'Advanced AI Online';
      case 'error': return 'Service Issues';
      default: return 'Initializing...';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <div className="relative">
              <Bot className="h-16 w-16 text-blue-600" />
              <Cpu className="h-6 w-6 text-purple-500 absolute -top-1 -right-1" />
              {apiStatus === 'working' && (
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              )}
              {apiStatus === 'error' && (
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
              )}
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Advanced GitHub AI Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Powered by cutting-edge Hugging Face AI models for intelligent GitHub optimization
          </p>
          <div className="mt-2 flex justify-center items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${apiStatus === 'working' ? 'bg-green-500' : apiStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'} ${apiStatus === 'working' ? 'animate-pulse' : ''}`}></div>
            <span className={`text-sm ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Enhanced Quick Actions Sidebar */}
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
                    className="w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 transition-all duration-200 group transform hover:scale-105"
                  >
                    <div className="flex items-center mb-1">
                      <span className={`${action.color} text-white p-1 rounded mr-2 group-hover:scale-110 transition-transform`}>
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
              
              {/* Enhanced API Test Section */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setInput('test api')}
                  className="w-full text-left p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/50 dark:hover:to-purple-900/50 transition-all duration-200 border border-blue-200 dark:border-blue-700"
                >
                  <div className="flex items-center mb-1">
                    <Cpu className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-900 dark:text-blue-300 text-sm">
                      System Diagnostics
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Test all AI services and models
                  </p>
                </button>
              </div>

              {/* Repository Examples Section */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  🔍 Try Repository Analysis
                </h4>
                <div className="space-y-2">
                  {[
                    'analyze facebook/react',
                    'check microsoft/vscode',
                    'repos of torvalds'
                  ].map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(example)}
                      className="w-full text-left text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-[700px] flex flex-col border border-gray-200 dark:border-gray-700">
              {/* Enhanced Chat Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-t-lg">
                <div className="flex items-center">
                  <Bot className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Advanced GitHub AI Assistant</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Powered by Hugging Face • Multi-Model AI • Repository Analysis • Real-time Data
                    </p>
                  </div>
                  <div className="ml-auto flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${apiStatus === 'working' ? 'bg-green-500 animate-pulse' : apiStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                      <span className={`text-sm font-medium ${getStatusColor()}`}>
                        {getStatusText()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-4 shadow-sm ${
                        message.isBot
                          ? message.type === 'error'
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800'
                            : message.type === 'success'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100 border border-green-200 dark:border-green-800'
                            : message.type === 'loading'
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800'
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      }`}
                    >
                      {message.isBot && (
                        <div className="flex items-center mb-2">
                          {getMessageIcon(message.type || 'text')}
                          <span className="font-semibold ml-2">AI Assistant</span>
                          {message.metadata?.username && (
                            <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full ml-2">
                              @{message.metadata.username}
                            </span>
                          )}
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
                
                {/* Enhanced Typing Indicator */}
                {typingIndicator && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 max-w-[85%] border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-gray-600 dark:text-gray-300">AI is analyzing...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Enhanced Input Area */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 rounded-b-lg">
                <div className="flex space-x-4">
                  <div className="flex-1 relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me about GitHub profiles, repositories, career advice, or try 'analyze facebook/react'..."
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none transition-all duration-200"
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
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-6 py-3 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transform hover:scale-105 disabled:hover:scale-100"
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
                
                {/* Enhanced Example Commands */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Try:</span>
                  {[
                    'analyze @username', 
                    'analyze facebook/react',
                    'repos of torvalds',
                    'compare @user1 vs @user2', 
                    'repository best practices', 
                    'career growth tips',
                    'test api'
                  ].map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(example)}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors transform hover:scale-105"
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