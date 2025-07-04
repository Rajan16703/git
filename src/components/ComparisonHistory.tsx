import React, { useState, useEffect } from 'react';
import { Clock, Share2, Eye, Trash2, ExternalLink, Users, Star, Calendar, Search, Filter } from 'lucide-react';
import { ComparisonHistory as ComparisonHistoryType } from '../types';
import { ComparisonHistoryService } from '../services/comparisonHistory';
import { useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

interface ComparisonHistoryProps {
  onLoadComparison: (comparison: ComparisonHistoryType) => void;
}

const ComparisonHistory: React.FC<ComparisonHistoryProps> = ({ onLoadComparison }) => {
  const { user } = useUser();
  const [history, setHistory] = useState<ComparisonHistoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all');

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await ComparisonHistoryService.getUserHistory(user.id);
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Failed to load comparison history');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (comparison: ComparisonHistoryType) => {
    try {
      const shareLink = await ComparisonHistoryService.createShareLink(
        comparison.id,
        { isPublic: true },
        user?.id
      );
      
      const url = `${window.location.origin}/comparison/${shareLink.share_token}`;
      
      if (navigator.share) {
        await navigator.share({
          title: `GitHub Profile Comparison: ${comparison.usernames.join(' vs ')}`,
          text: 'Check out this GitHub profile comparison!',
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Share link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing comparison:', error);
      toast.error('Failed to create share link');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this comparison?')) return;
    
    try {
      await ComparisonHistoryService.deleteComparison(id);
      setHistory(prev => prev.filter(item => item.id !== id));
      toast.success('Comparison deleted successfully');
    } catch (error) {
      console.error('Error deleting comparison:', error);
      toast.error('Failed to delete comparison');
    }
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.usernames.some(username => 
      username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'public' && item.is_public) ||
      (filterType === 'private' && !item.is_public);
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Sign in to view history
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to save and view your comparison history
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Clock className="h-5 w-5 mr-2 text-blue-600" />
          Comparison History
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filteredHistory.length} comparison{filteredHistory.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'public' | 'private')}
            className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
          >
            <option value="all">All</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm || filterType !== 'all' ? 'No matching comparisons' : 'No comparison history'}
          </h4>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Start comparing GitHub profiles to build your history'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((comparison) => (
            <div
              key={comparison.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {comparison.usernames.join(' vs ')}
                    </span>
                    {comparison.is_public && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                        Public
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(comparison.created_at)}</span>
                    </div>
                    
                    {comparison.comparison_data?.summary?.winner && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>Winner: {comparison.comparison_data.summary.winner}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onLoadComparison(comparison)}
                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                    title="Load comparison"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleShare(comparison)}
                    className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition-colors"
                    title="Share comparison"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(comparison.id)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                    title="Delete comparison"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComparisonHistory;