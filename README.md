# GitHub Profile Battle

A modern web application for comparing GitHub profiles with AI-powered insights and analysis.

## Features

- **Profile Comparison**: Compare multiple GitHub profiles side by side
- **AI Analysis**: Get intelligent insights powered by Hugging Face and Google Gemini
- **Repository Analysis**: Deep dive into repository health and quality
- **Comparison History**: Save and share your comparisons
- **Real-time Data**: Live GitHub API integration

## AI Configuration

This application uses multiple AI providers for enhanced functionality:

### Hugging Face API
1. Get your API key from [Hugging Face](https://huggingface.co/settings/tokens)
2. Update `src/config/api.ts`:
   ```typescript
   HUGGINGFACE: {
     API_KEY: 'hf_your_actual_api_key_here',
     // ... rest of config
   }
   ```

### Google Gemini API
1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Update `src/config/api.ts`:
   ```typescript
   GEMINI: {
     API_KEY: 'your_actual_gemini_api_key_here',
     // ... rest of config
   }
   ```

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd github-profile-battle
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Keys**
   - Open `src/config/api.ts`
   - Replace the placeholder API keys with your actual keys
   - Save the file

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Test AI Services**
   - Navigate to the AI Assistant page
   - Click "AI System Status" or type "test api"
   - Verify that your APIs are working correctly

## Environment Variables

The following environment variables are required:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## AI Features

- **Profile Analysis**: Comprehensive GitHub profile evaluation
- **Repository Insights**: Code quality and health assessment
- **Comparison Intelligence**: Smart profile comparisons
- **Career Advice**: Personalized development recommendations
- **Multi-Provider Fallback**: Automatic switching between AI providers

## Commands

Try these commands in the AI Assistant:

- `analyze @username` - Analyze a GitHub profile
- `analyze owner/repo` - Analyze a repository
- `repos of username` - List user's repositories
- `compare @user1 vs @user2` - Compare two profiles
- `test api` - Check AI service status

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase
- **AI**: Hugging Face, Google Gemini
- **Deployment**: Netlify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details