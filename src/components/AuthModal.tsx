import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Github, Sparkles, Star, Code } from 'lucide-react';

const AuthModal: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md mx-auto my-8 overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
        
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20"></div>
        
        {/* Floating Decorative Elements */}
        <div className="absolute top-6 right-6 w-12 h-12 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-lg animate-pulse"></div>
        <div className="absolute bottom-8 left-6 w-8 h-8 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-4 w-6 h-6 bg-gradient-to-br from-yellow-400/30 to-orange-400/30 rounded-full blur-lg animate-pulse delay-500"></div>
        
        {/* Header Section */}
        <div className="relative z-10 text-center pt-10 pb-8 px-8">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              {/* Main Icon Container */}
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-all duration-300">
                <Github className="h-10 w-10 text-white" />
              </div>
              
              {/* Floating Icons */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="absolute -bottom-1 -left-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <Star className="h-3 w-3 text-white" />
              </div>
              <div className="absolute top-1 -left-3 w-7 h-7 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg animate-pulse delay-300">
                <Code className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent mb-3">
            Welcome to GitHub Battle
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
            Join the ultimate GitHub profile comparison platform
          </p>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
              Profile Analysis
            </span>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
              AI Insights
            </span>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
              Real-time Data
            </span>
          </div>
        </div>

        {/* Sign In Form */}
        <div className="relative z-10 px-8 pb-8">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none border-none p-0 w-full",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                
                // Social Buttons
                socialButtonsBlockButton: "w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-2xl py-4 px-6 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-300 font-medium text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
                socialButtonsProviderIcon: "w-6 h-6",
                
                // Divider
                dividerLine: "bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent",
                dividerText: "text-gray-500 dark:text-gray-400 text-sm font-medium bg-white dark:bg-gray-900 px-4",
                
                // Form Elements
                formButtonPrimary: "w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white rounded-2xl py-4 font-semibold text-base transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5",
                
                formFieldInput: "w-full rounded-2xl border border-gray-200/50 dark:border-gray-600/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 text-base",
                
                formFieldLabel: "text-gray-700 dark:text-gray-300 font-semibold text-sm mb-3 block",
                
                // Links and Actions
                footerActionLink: "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors duration-200",
                formFieldAction: "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-semibold transition-colors duration-200",
                
                // Alerts and Messages
                alert: "rounded-2xl bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 text-red-700 dark:text-red-400 p-4 mb-4",
                alertText: "text-sm font-medium",
                
                // OTP Fields
                otpCodeFieldInput: "w-14 h-14 text-center rounded-xl border border-gray-200/50 dark:border-gray-600/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-lg font-semibold",
                
                // Success/Error States
                formFieldSuccessText: "text-green-600 dark:text-green-400 text-sm font-medium",
                formFieldWarningText: "text-yellow-600 dark:text-yellow-400 text-sm font-medium",
                formFieldErrorText: "text-red-600 dark:text-red-400 text-sm font-medium",
                
                // Footer
                footer: "text-center mt-6",
                footerActionText: "text-gray-600 dark:text-gray-400 text-sm",
                
                // Hidden Elements
                logoBox: "hidden",
                navbar: "hidden"
              },
              layout: {
                socialButtonsPlacement: "top",
                showOptionalFields: false,
                logoPlacement: "none"
              },
              variables: {
                colorPrimary: "#3B82F6",
                colorBackground: "transparent",
                colorInputBackground: "rgba(255, 255, 255, 0.8)",
                colorInputText: "#1F2937",
                borderRadius: "1rem",
                spacingUnit: "1rem",
                fontSize: "1rem"
              }
            }}
          />
        </div>

        {/* Bottom Section */}
        <div className="relative z-10 bg-gradient-to-r from-gray-50/80 via-white/80 to-gray-50/80 dark:from-gray-800/80 dark:via-gray-900/80 dark:to-gray-800/80 backdrop-blur-sm px-8 py-6 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              By continuing, you agree to our{' '}
              <span className="text-blue-600 dark:text-blue-400 font-medium">Terms of Service</span>
              {' '}and{' '}
              <span className="text-blue-600 dark:text-blue-400 font-medium">Privacy Policy</span>
            </p>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex justify-center items-center mt-4 space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Secure</span>
            </div>
            <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Fast</span>
            </div>
            <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-700"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Free</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;