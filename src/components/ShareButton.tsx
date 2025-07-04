import React, { useState } from 'react';
import { Share2, Copy, Link, Globe, Lock, Clock, Check } from 'lucide-react';
import { ComparisonHistoryService } from '../services/comparisonHistory';
import { ShareOptions } from '../types';
import { useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

interface ShareButtonProps {
  usernames: string[];
  comparisonId?: string;
  onSave?: () => Promise<string>; // Returns comparison ID
}

const ShareButton: React.FC<ShareButtonProps> = ({ usernames, comparisonId, onSave }) => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    isPublic: false,
    expiresIn: undefined,
    allowComments: false,
    requireAuth: false
  });

  const handleShare = async (shareType: 'quick' | 'advanced') => {
    if (usernames.length === 0) {
      toast.error('Add profiles to compare before sharing');
      return;
    }

    setLoading(true);
    try {
      let currentComparisonId = comparisonId;
      
      // Save comparison if not already saved
      if (!currentComparisonId && onSave) {
        currentComparisonId = await onSave();
      }

      if (!currentComparisonId) {
        toast.error('Please save the comparison first');
        return;
      }

      // Create share link
      const shareLink = await ComparisonHistoryService.createShareLink(
        currentComparisonId,
        shareType === 'quick' ? { isPublic: true } : shareOptions,
        user?.id
      );

      const url = `${window.location.origin}/comparison/${shareLink.share_token}`;
      
      if (shareType === 'quick') {
        // Quick share - try native sharing first, fallback to clipboard
        try {
          if (navigator.share) {
            await navigator.share({
              title: `GitHub Profile Battle: ${usernames.join(' vs ')}`,
              text: 'Check out this GitHub profile comparison!',
              url: url,
            });
          } else {
            await navigator.clipboard.writeText(url);
            toast.success('Share link copied to clipboard!');
          }
        } catch (error) {
          // Fallback to clipboard
          await navigator.clipboard.writeText(url);
          toast.success('Share link copied to clipboard!');
        }
      } else {
        // Advanced share - copy to clipboard
        await navigator.clipboard.writeText(url);
        toast.success('Custom share link created and copied!');
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickShare = () => handleShare('quick');
  const handleAdvancedShare = () => handleShare('advanced');

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <button
          onClick={handleQuickShare}
          disabled={usernames.length === 0 || loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          Share
        </button>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={usernames.length === 0}
          className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Advanced sharing options"
        >
          <Link className="h-4 w-4" />
        </button>
      </div>

      {/* Advanced Share Modal */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Advanced Sharing Options
            </h3>
            
            <div className="space-y-4">
              {/* Public/Private Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {shareOptions.isPublic ? (
                    <Globe className="h-4 w-4 text-green-600" />
                  ) : (
                    <Lock className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {shareOptions.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
                <button
                  onClick={() => setShareOptions(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    shareOptions.isPublic ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      shareOptions.isPublic ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Link Expiration
                </label>
                <select
                  value={shareOptions.expiresIn || ''}
                  onChange={(e) => setShareOptions(prev => ({ 
                    ...prev, 
                    expiresIn: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Never expires</option>
                  <option value="1">1 hour</option>
                  <option value="24">24 hours</option>
                  <option value="168">1 week</option>
                  <option value="720">1 month</option>
                </select>
              </div>

              {/* Description */}
              <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                {shareOptions.isPublic ? (
                  <div className="flex items-start space-x-2">
                    <Globe className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-400">Public Link</p>
                      <p>Anyone with the link can view this comparison. It will also appear in public listings.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-2">
                    <Lock className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-400">Private Link</p>
                      <p>Only people with the direct link can view this comparison.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdvancedShare}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span>Create Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareButton;