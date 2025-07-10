import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, User, Sparkles, GitBranch, Star, Users, Code, Zap, TrendingUp, AlertCircle, CheckCircle, Clock, Cpu, FolderOpen, Search, Brain, Rocket, Shield, Globe, Activity, Command, Layers, Hexagon, Triangle } from 'lucide-react';
import { getChatbotResponse, analyzeProfile, compareProfiles, getRepositoryAdvice, getAPIStatus } from '../services/ai';
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
  gradient: string;
  category: string;
}

const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      text: "🚀 Welcome to the next-generation GitHub AI Assistant! I'm powered by cutting-edge multi-provider AI technology including Hugging Face and Google Gemini.\n\n✨ **What I can do for you:**\n• Deep profile analysis with actionable insights\n• Repository health assessment and optimization\n• Career development strategies\n• Code quality evaluation\n• Community engagement guidance\n\n🔍 **Advanced Features:**\n• Multi-provider AI fallback for reliability\n• Real-time GitHub data integration\n• Repository analysis: \"analyze facebook/react\"\n• User exploration: \"repos of username\"\n\n💡 Ready to supercharge your GitHub presence? Let's get started!", 
      isBot: true, 
      timestamp: new Date(),
      type: 'success'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profiles, setProfiles] = useState<ProfileWithMetrics[]>([]);
  const [apiStatus, setApiStatus] = useState<{
    huggingFace: boolean;
    gemini: boolean;
    hasAnyProvider: boolean;
    status: 'checking' | 'working' | 'partial' | 'error';
  }>({
    huggingFace: false,
    gemini: false,
    hasAnyProvider: false,
    status: 'checking'
  });
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [activeCategory, setActiveCategory] = useState('analysis');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickActions: QuickAction[] = [
    {
      icon: <Brain className="h-5 w-5" />,
      label: "Profile Analysis",
      action: "analyze-profile",
      description: "Deep dive into GitHub profile insights",
      gradient: "from-purple-500 via-pink-500 to-red-500",
      category: "analysis"
    },
    {
      icon: <FolderOpen className="h-5 w-5" />,
      label: "Repository Audit",
      action: "repository-analysis",
      description: "Comprehensive repository health check",
      gradient: "from-blue-500 via-cyan-500 to-teal-500",
      category: "analysis"
    },
    {
      icon: <Search className="h-5 w-5" />,
      label: "Explore Repositories",
      action: "user-repositories",
      description: "Discover and analyze user's projects",
      gradient: "from-indigo-500 via-purple-500 to-pink-500",
      category: "analysis"
    },
    {
      icon: <GitBranch className="h-5 w-5" />,
      label: "Profile Battle",
      action: "compare-profiles", 
      description: "Head-to-head profile comparison",
      gradient: "from-orange-500 via-red-500 to-pink-500",
      category: "comparison"
    },
    {
      icon: <Code className="h-5 w-5" />,
      label: "Code Quality Tips",
      action: "repository-tips",
      description: "Best practices for better repositories",
      gradient: "from-green-500 via-emerald-500 to-teal-500",
      category: "optimization"
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: "Growth Strategy",
      action: "growth-strategy",
      description: "Scale your GitHub influence",
      gradient: "from-yellow-500 via-orange-500 to-red-500",
      category: "optimization"
    },
    {
      icon: <Star className="h-5 w-5" />,
      label: "Profile Boost",
      action: "profile-optimization",
      description: "Optimize for maximum impact",
      gradient: "from-pink-500 via-rose-500 to-red-500",
      category: "optimization"
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Community Building",
      action: "community-engagement",
      description: "Engage with the developer ecosystem",
      gradient: "from-cyan-500 via-blue-500 to-indigo-500",
      category: "community"
    }
  ];

  const categories = [
    { id: 'analysis', label: 'Analysis', icon: <Brain className="h-4 w-4" /> },
    { id: 'comparison', label: 'Compare', icon: <GitBranch className="h-4 w-4" /> },
    { id: 'optimization', label: 'Optimize', icon: <Rocket className="h-4 w-4" /> },
    { id: 'community', label: 'Community', icon: <Users className="h-4 w-4" /> }
  ];

  // Enhanced API status checking
  useEffect(() => {
    const checkAPIStatus = async () => {
      try {
        setMessages(prev => [...prev, {
          text: "🔍 Initializing multi-provider AI systems...",
          isBot: true,
          timestamp: new Date(),
          type: 'loading'
        }]);

        const status = await getAPIStatus();
        
        setApiStatus({
          ...status,
          status: status.hasAnyProvider ? 'working' : 'error'
        });
        
        if (status.hasAnyProvider) {
          const providers = [];
          if (status.huggingFace) providers.push('🤗 Hugging Face');
          if (status.gemini) providers.push('🧠 Google Gemini');
          
          setMessages(prev => [...prev, {
            text: `✅ **AI Systems Online!**\n\n🚀 **Active Providers**: ${providers.join(' + ')}\n🎯 **Capabilities**: Advanced profile analysis, repository insights, code review, career guidance\n🔄 **Reliability**: Multi-provider fallback system\n\n🆕 **Enhanced Features**:\n• \"analyze facebook/react\" - Repository deep dive\n• \"repos of username\" - User exploration\n• \"compare @user1 vs @user2\" - Profile battles\n\n💡 **Pro Tip**: Update API keys in src/config/api.ts for full functionality!`,
            isBot: true,
            timestamp: new Date(),
            type: 'success'
          }]);
        } else {
          setMessages(prev => [...prev, {
            text: `🔧 **AI Configuration Required**\n\n⚠️ **Setup Needed**:\n${status.validation.issues.map(issue => `• ${issue}`).join('\n')}\n\n📋 **Quick Setup**:\n1. Get Hugging Face API key: https://huggingface.co/settings/tokens\n2. Get Google Gemini API key: https://makersuite.google.com/app/apikey\n3. Update src/config/api.ts with your keys\n4. Restart the application\n\n🎯 **Why Multiple Providers?** Enhanced reliability and performance!`,
            isBot: true,
            timestamp: new Date(),
            type: 'error'
          }]);
        }
      } catch (error) {
        console.error('API Status Check Error:', error);
        setApiStatus(prev => ({ ...prev, status: 'error' }));
        setMessages(prev => [...prev, {
          text: "❌ System initialization failed. Please check your configuration and try again.",
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
            text: `🔍 **Analyzing GitHub Profile: @${username}**\n\nProcessing with advanced AI models...`,
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
            text: `⚖️ **Profile Battle: @${usernames[0]} vs @${usernames[1]}**\n\nGathering data and running comparison algorithms...`,
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
      } else if (userMessage.toLowerCase().includes('test api') || userMessage.toLowerCase().includes('api status') || userMessage.toLowerCase().includes('system status')) {
        setMessages(prev => [...prev, {
          text: "🧪 **Running Comprehensive AI Diagnostics**\n\nTesting all providers and capabilities...",
          isBot: true,
          timestamp: new Date(),
          type: 'loading'
        }]);
        
        const status = await getAPIStatus();
        
        response = `🔧 **Multi-Provider AI System Report**

🤖 **Provider Status**:
• Hugging Face API: ${status.huggingFace ? '✅ Operational' : '❌ Not configured'}
• Google Gemini API: ${status.gemini ? '✅ Operational' : '❌ Not configured'}
• System Health: ${status.hasAnyProvider ? '🟢 Excellent' : '🔴 Needs Setup'}

📊 **Capabilities Matrix**:
${status.hasAnyProvider ? `✅ Profile analysis & optimization
✅ Repository health assessment  
✅ Code quality evaluation
✅ Career development advice
✅ Multi-provider AI fallback
✅ Real-time GitHub integration` : `❌ Limited functionality (API keys needed)
❌ Advanced analysis unavailable
❌ AI-powered insights disabled`}

🔧 **Configuration Status**:
${status.validation.issues.length > 0 ? status.validation.issues.map(issue => `• ${issue}`).join('\n') : '✅ All APIs configured correctly'}

🚀 **Advanced Features**:
• Repository Analysis: "analyze facebook/react"
• User Exploration: "repos of username"  
• Profile Battles: "compare @user1 vs @user2"
• Career Guidance: "how to improve my GitHub"

📝 **Setup Guide**: Update API keys in src/config/api.ts for full power!

${status.hasAnyProvider ? '🎉 **Status**: All systems operational! Ready for advanced AI assistance!' : '⚠️ **Action Required**: Configure API keys to unlock full potential.'}`;
        messageType = status.hasAnyProvider ? 'success' : 'error';
      } else {
        // Enhanced general chat with context awareness
        setMessages(prev => [...prev, {
          text: "🤔 **Processing with Advanced AI**\n\nAnalyzing your question and generating insights...",
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
          text: "🚨 **System Error Detected**\n\nOur advanced AI systems encountered an issue. The multi-provider fallback is working to resolve this. Please try again or ask a different question!", 
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
        prompt = 'How can I perform a comprehensive GitHub profile analysis? What advanced metrics and insights should I focus on?';
        break;
      case 'repository-analysis':
        prompt = 'What are the key factors for analyzing repository health and quality? How can I assess code maintainability?';
        break;
      case 'user-repositories':
        prompt = 'How can I effectively explore and analyze all repositories of a specific user? What patterns should I look for?';
        break;
      case 'compare-profiles':
        prompt = 'What are the most effective strategies for comparing GitHub profiles? Which metrics provide the most valuable insights?';
        break;
      case 'repository-tips':
        prompt = 'What are the advanced best practices for organizing, documenting, and maintaining world-class GitHub repositories?';
        break;
      case 'growth-strategy':
        prompt = 'What are proven strategies to exponentially grow my GitHub presence and attract top-tier collaborators and opportunities?';
        break;
      case 'profile-optimization':
        prompt = 'How can I optimize my GitHub profile to make it irresistible to employers, collaborators, and the developer community?';
        break;
      case 'community-engagement':
        prompt = 'How can I strategically engage with the GitHub community and make meaningful contributions to high-impact open source projects?';
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
        return <Brain className="h-4 w-4 text-purple-500" />;
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
    switch (apiStatus.status) {
      case 'working': return 'text-green-400';
      case 'partial': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getStatusText = () => {
    switch (apiStatus.status) {
      case 'working': return `Multi-AI Online`;
      case 'partial': return 'Partial AI Available';
      case 'error': return 'Setup Required';
      default: return 'Initializing...';
    }
  };

  const filteredActions = quickActions.filter(action => action.category === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Geometric Patterns */}
        <div className="absolute top-20 right-20 opacity-10">
          <Hexagon className="h-32 w-32 text-white animate-pulse" />
        </div>
        <div className="absolute bottom-20 left-20 opacity-10">
          <Triangle className="h-24 w-24 text-white animate-bounce" />
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5">
          <Layers className="h-64 w-64 text-white animate-spin" style={{ animationDuration: '20s' }} />
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center items-center mb-6">
              <div className="relative group">
                {/* Main AI Brain Icon */}
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-500 animate-pulse">
                    <Brain className="h-12 w-12 text-white" />
                  </div>
                  
                  {/* Floating Status Indicators */}
                  <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${apiStatus.status === 'working' ? 'bg-green-500 animate-pulse' : apiStatus.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                    {apiStatus.status === 'working' ? <Shield className="h-3 w-3 text-white" /> : <AlertCircle className="h-3 w-3 text-white" />}
                  </div>
                  
                  {/* Orbiting Elements */}
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: '10s' }}>
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg"></div>
                  </div>
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}>
                    <div className="absolute top-1/2 -right-4 transform -translate-y-1/2 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg"></div>
                  </div>
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: '12s' }}>
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full shadow-lg"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                AI GitHub
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Assistant
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-6 leading-relaxed">
              Next-generation AI powered by <span className="text-purple-400 font-semibold">Hugging Face</span> and <span className="text-blue-400 font-semibold">Google Gemini</span> for intelligent GitHub optimization and career acceleration
            </p>
            
            {/* Status Bar */}
            <div className="flex justify-center items-center space-x-4 mb-8">
              <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                <Activity className={`h-4 w-4 ${getStatusColor()}`} />
                <span className={`text-sm font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                <Globe className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-400">
                  Real-time GitHub Data
                </span>
              </div>
              
              <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                <Rocket className="h-4 w-4 text-pink-400" />
                <span className="text-sm font-medium text-pink-400">
                  Multi-Provider AI
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Enhanced Sidebar */}
            <div className="xl:col-span-1">
              <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sticky top-4">
                {/* Category Tabs */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Command className="h-5 w-5 mr-2 text-purple-400" />
                    AI Commands
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                          activeCategory === category.id
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {category.icon}
                        <span className="text-sm font-medium">{category.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  {filteredActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.action)}
                      className="w-full text-left p-4 rounded-xl bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 group border border-white/5 hover:border-white/20"
                    >
                      <div className="flex items-center mb-2">
                        <span className={`bg-gradient-to-r ${action.gradient} text-white p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform`}>
                          {action.icon}
                        </span>
                        <span className="font-semibold text-white text-sm">
                          {action.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {action.description}
                      </p>
                    </button>
                  ))}
                </div>
                
                {/* System Status */}
                <div className="mt-6 pt-4 border-t border-white/10">
                  <button
                    onClick={() => setInput('test api')}
                    className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 border border-blue-500/20"
                  >
                    <div className="flex items-center mb-2">
                      <Cpu className="h-4 w-4 text-blue-400 mr-2" />
                      <span className="font-semibold text-blue-300 text-sm">
                        System Diagnostics
                      </span>
                    </div>
                    <p className="text-xs text-blue-200">
                      Check all AI providers and capabilities
                    </p>
                  </button>
                </div>

                {/* Example Commands */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <h4 className="text-sm font-semibold text-white mb-2">
                    🚀 Try These Commands
                  </h4>
                  <div className="space-y-2">
                    {[
                      'analyze facebook/react',
                      'repos of torvalds',
                      'compare @user1 vs @user2'
                    ].map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setInput(example)}
                        className="w-full text-left text-xs bg-white/5 text-gray-300 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors border border-white/5"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Chat Interface */}
            <div className="xl:col-span-3">
              <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 h-[800px] flex flex-col overflow-hidden">
                {/* Chat Header */}
                <div className="border-b border-white/10 p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative">
                        <Bot className="h-10 w-10 text-purple-400 mr-4" />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black ${apiStatus.status === 'working' ? 'bg-green-500 animate-pulse' : apiStatus.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">Multi-Provider AI Assistant</h3>
                        <p className="text-sm text-gray-400">
                          Powered by Hugging Face + Google Gemini • Real-time GitHub Integration
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2 bg-black/30 rounded-full px-3 py-1">
                        <div className={`w-2 h-2 rounded-full ${apiStatus.status === 'working' ? 'bg-green-500 animate-pulse' : apiStatus.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                        <span className={`text-xs font-medium ${getStatusColor()}`}>
                          {getStatusText()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-transparent to-black/10">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 shadow-lg backdrop-blur-sm ${
                          message.isBot
                            ? message.type === 'error'
                              ? 'bg-red-500/20 text-red-100 border border-red-500/30'
                              : message.type === 'success'
                              ? 'bg-green-500/20 text-green-100 border border-green-500/30'
                              : message.type === 'loading'
                              ? 'bg-blue-500/20 text-blue-100 border border-blue-500/30'
                              : 'bg-white/10 text-white border border-white/20'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border border-purple-500/30'
                        }`}
                      >
                        {message.isBot && (
                          <div className="flex items-center mb-3">
                            {getMessageIcon(message.type || 'text')}
                            <span className="font-semibold ml-2">AI Assistant</span>
                            {message.metadata?.username && (
                              <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-1 rounded-full ml-2">
                                @{message.metadata.username}
                              </span>
                            )}
                            <span className="text-xs text-gray-400 ml-auto">
                              {formatTimestamp(message.timestamp)}
                            </span>
                          </div>
                        )}
                        <div className="whitespace-pre-line leading-relaxed">
                          {message.text}
                        </div>
                        {!message.isBot && (
                          <div className="text-xs text-purple-200 mt-2 text-right">
                            {formatTimestamp(message.timestamp)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Enhanced Typing Indicator */}
                  {typingIndicator && (
                    <div className="flex justify-start">
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 max-w-[85%] border border-white/20">
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-gray-300">AI is processing your request...</span>
                          <Brain className="h-4 w-4 text-purple-400 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Enhanced Input Area */}
                <div className="border-t border-white/10 p-6 bg-gradient-to-r from-black/20 to-black/30">
                  <div className="flex space-x-4">
                    <div className="flex-1 relative">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me about GitHub profiles, repositories, career advice, or try 'test api' for system status..."
                        className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 resize-none transition-all duration-200"
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
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl px-6 py-3 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          <span className="font-medium">Send</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Enhanced Example Commands */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs text-gray-400">Quick commands:</span>
                    {[
                      'test api',
                      'analyze @username', 
                      'analyze facebook/react',
                      'repos of torvalds',
                      'compare @user1 vs @user2', 
                      'career growth tips'
                    ].map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setInput(example)}
                        className="text-xs bg-white/10 text-gray-300 px-3 py-1 rounded-full hover:bg-white/20 transition-colors transform hover:scale-105 border border-white/10"
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

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default ChatbotPage;