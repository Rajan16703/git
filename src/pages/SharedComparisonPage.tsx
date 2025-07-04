import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ComparisonHistoryService } from '../services/comparisonHistory';
import { ComparisonHistory, ProfileWithMetrics } from '../types';
import ComparisonResults from '../components/ComparisonResults';
import ProfileCard from '../components/ProfileCard';
import { Github, ArrowLeft, Share2, Eye, Calendar, Users, ExternalLink } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import toast from 'react-hot-toast';

const SharedComparisonPage: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [comparison, setComparison] = useState<ComparisonHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shareToken) {
      loadSharedComparison(shareToken);
    }
  }, [shareToken]);

  const loadSharedComparison = async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await ComparisonHistoryService.getComparisonByShareToken(token);
      
      if (!data) {
        setError('Comparison not found or link has expired');
        return;
      }
      
      setComparison(data);
    } catch (err) {
      console.error('Error loading shared comparison:', err);
      setError('Failed to load shared comparison');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!comparison) return;
    
    try {
      const url = window.location.href;
      
      if (navigator.share) {
        await navigator.share({
          title: `GitHub Profile Battle: ${comparison.usernames.join(' vs ')}`,
          text: 'Check out this GitHub profile comparison!',
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner message="Loading shared comparison..." />
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <ErrorDisplay 
            message={error || 'Comparison not found'} 
            onDismiss={() => setError(null)} 
          />
          <div className="text-center mt-6">
            <Link 
              to="/" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Convert comparison data to ProfileWithMetrics format
  const profiles: ProfileWithMetrics[] = comparison.comparison_data?.profiles?.map((profileData: any) => ({
    user: profileData.user,
    metrics: profileData.metrics,
    repos: [] // We don't store repos in history
  })) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Github className="h-12 w-12 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Shared GitHub Profile Comparison
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {comparison.usernames.join(' vs ')}
        </p>
      </div>

      {/* Comparison Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900 dark:text-white">
                {comparison.usernames.length} profiles
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {formatDate(comparison.created_at)}
              </span>
            </div>
            
            {comparison.is_public && (
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded-full">
                Public
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
            
            <Link
              to="/"
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Create Your Own</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Comparison Results */}
      {profiles.length > 0 && (
        <ComparisonResults profiles={profiles} />
      )}

      {/* Profile Cards */}
      {profiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {profiles
            .sort((a, b) => b.metrics.totalScore - a.metrics.totalScore)
            .map((profile, index) => (
              <ProfileCard
                key={profile.user.id}
                profile={profile}
                rank={index + 1}
                onRemove={() => {}} // Disable remove for shared comparisons
              />
            ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Want to create your own GitHub profile comparison?
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Github className="h-5 w-5 mr-2" />
          Start Comparing Profiles
        </Link>
      </div>
    </div>
  );
};

export default SharedComparisonPage;