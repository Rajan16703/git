import { supabase } from './supabase';
import { ComparisonHistory, ComparisonShare, ShareOptions, ProfileWithMetrics } from '../types';

export class ComparisonHistoryService {
  
  // Save a new comparison to history
  static async saveComparison(
    usernames: string[], 
    profiles: ProfileWithMetrics[], 
    userId?: string
  ): Promise<ComparisonHistory> {
    try {
      const comparisonData = {
        profiles: profiles.map(profile => ({
          user: profile.user,
          metrics: profile.metrics,
          timestamp: new Date().toISOString()
        })),
        summary: {
          winner: profiles.length > 0 ? profiles[0].user.login : null,
          totalProfiles: profiles.length,
          createdAt: new Date().toISOString()
        }
      };

      const { data, error } = await supabase
        .from('comparison_history')
        .insert({
          user_id: userId || null,
          usernames,
          comparison_data: comparisonData,
          is_public: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving comparison:', error);
      throw new Error('Failed to save comparison');
    }
  }

  // Get user's comparison history
  static async getUserHistory(userId: string, limit: number = 20): Promise<ComparisonHistory[]> {
    try {
      const { data, error } = await supabase
        .from('comparison_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user history:', error);
      throw new Error('Failed to fetch comparison history');
    }
  }

  // Get comparison by ID
  static async getComparison(id: string): Promise<ComparisonHistory | null> {
    try {
      const { data, error } = await supabase
        .from('comparison_history')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error fetching comparison:', error);
      throw new Error('Failed to fetch comparison');
    }
  }

  // Get comparison by share token
  static async getComparisonByShareToken(shareToken: string): Promise<ComparisonHistory | null> {
    try {
      // First try to get from comparison_history directly
      let { data, error } = await supabase
        .from('comparison_history')
        .select('*')
        .eq('share_token', shareToken)
        .single();

      if (error && error.code !== 'PGRST116') {
        // If not found, try to get from comparison_shares
        const { data: shareData, error: shareError } = await supabase
          .from('comparison_shares')
          .select(`
            *,
            comparison_history (*)
          `)
          .eq('share_token', shareToken)
          .single();

        if (shareError) {
          if (shareError.code === 'PGRST116') return null;
          throw shareError;
        }

        // Increment view count
        await supabase
          .from('comparison_shares')
          .update({ view_count: (shareData.view_count || 0) + 1 })
          .eq('id', shareData.id);

        return shareData.comparison_history;
      }

      return data;
    } catch (error) {
      console.error('Error fetching shared comparison:', error);
      throw new Error('Failed to fetch shared comparison');
    }
  }

  // Create a share link for a comparison
  static async createShareLink(
    comparisonId: string, 
    options: ShareOptions,
    userId?: string
  ): Promise<ComparisonShare> {
    try {
      const expiresAt = options.expiresIn 
        ? new Date(Date.now() + options.expiresIn * 60 * 60 * 1000).toISOString()
        : null;

      // Update comparison to be public if requested
      if (options.isPublic) {
        await supabase
          .from('comparison_history')
          .update({ is_public: true })
          .eq('id', comparisonId);
      }

      const { data, error } = await supabase
        .from('comparison_shares')
        .insert({
          comparison_id: comparisonId,
          shared_by: userId || null,
          expires_at: expiresAt
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating share link:', error);
      throw new Error('Failed to create share link');
    }
  }

  // Update comparison
  static async updateComparison(
    id: string, 
    updates: Partial<ComparisonHistory>
  ): Promise<ComparisonHistory> {
    try {
      const { data, error } = await supabase
        .from('comparison_history')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating comparison:', error);
      throw new Error('Failed to update comparison');
    }
  }

  // Delete comparison
  static async deleteComparison(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('comparison_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting comparison:', error);
      throw new Error('Failed to delete comparison');
    }
  }

  // Get popular public comparisons
  static async getPopularComparisons(limit: number = 10): Promise<ComparisonHistory[]> {
    try {
      const { data, error } = await supabase
        .from('comparison_history')
        .select(`
          *,
          comparison_shares (
            view_count
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching popular comparisons:', error);
      throw new Error('Failed to fetch popular comparisons');
    }
  }

  // Search comparisons by usernames
  static async searchComparisons(
    usernames: string[], 
    userId?: string
  ): Promise<ComparisonHistory[]> {
    try {
      let query = supabase
        .from('comparison_history')
        .select('*')
        .contains('usernames', usernames)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching comparisons:', error);
      throw new Error('Failed to search comparisons');
    }
  }

  // Get share statistics for a comparison
  static async getShareStats(comparisonId: string): Promise<{
    totalViews: number;
    totalShares: number;
    recentViews: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('comparison_shares')
        .select('view_count, created_at')
        .eq('comparison_id', comparisonId);

      if (error) throw error;

      const totalViews = data?.reduce((sum, share) => sum + (share.view_count || 0), 0) || 0;
      const totalShares = data?.length || 0;
      
      // Recent views (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentViews = data?.filter(share => 
        new Date(share.created_at) > weekAgo
      ).reduce((sum, share) => sum + (share.view_count || 0), 0) || 0;

      return { totalViews, totalShares, recentViews };
    } catch (error) {
      console.error('Error fetching share stats:', error);
      return { totalViews: 0, totalShares: 0, recentViews: 0 };
    }
  }
}