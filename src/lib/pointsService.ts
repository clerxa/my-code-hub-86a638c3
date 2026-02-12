/**
 * Service centralisé pour l'attribution des points
 * Ce service peut être appelé depuis n'importe où dans l'application
 */
import { supabase } from "@/integrations/supabase/client";

export type PointsCategory = 
  | 'guide_completion'
  | 'video_completion'
  | 'quiz_completion'
  | 'simulator_completion'
  | 'webinar_registration'
  | 'daily_login'
  | 'forum_create_post'
  | 'forum_create_comment'
  | 'forum_receive_like'
  | 'forum_give_like'
  | 'colleague_invitation'
  | 'partnership_request'
  | 'appointment_booking'
  | 'financial_profile_completion';

interface PointsConfig {
  category: string;
  points: number;
  is_active: boolean;
}

// Cache for points configuration
let pointsConfigCache: PointsConfig[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute

async function getPointsConfig(): Promise<PointsConfig[]> {
  const now = Date.now();
  
  if (pointsConfigCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return pointsConfigCache;
  }

  const { data, error } = await supabase
    .from('points_configuration')
    .select('category, points, is_active');

  if (error) {
    console.error('Error fetching points config:', error);
    return pointsConfigCache || [];
  }

  pointsConfigCache = data || [];
  cacheTimestamp = now;
  return pointsConfigCache;
}

export function clearPointsCache() {
  pointsConfigCache = null;
  cacheTimestamp = 0;
}

export async function getPointsForCategory(category: PointsCategory): Promise<{ points: number; isActive: boolean }> {
  const configs = await getPointsConfig();
  const config = configs.find(c => c.category === category);
  
  if (!config) {
    return { points: 0, isActive: false };
  }
  
  return { points: config.points, isActive: config.is_active };
}

/**
 * Award points with duplicate prevention
 * @param userId - User ID
 * @param category - Points category
 * @param referenceId - Optional reference (module_id, appointment_id, etc.) to prevent duplicates
 * @param customPoints - Optional custom points amount
 */
export async function awardPoints(
  userId: string,
  category: PointsCategory,
  referenceId?: string,
  customPoints?: number
): Promise<{ success: boolean; pointsAwarded: number; alreadyAwarded?: boolean }> {
  try {
    const { points, isActive } = await getPointsForCategory(category);
    const pointsToAward = customPoints ?? points;
    
    if (!isActive || pointsToAward <= 0) {
      return { success: true, pointsAwarded: 0 };
    }

    // Check if points already awarded for this specific action
    if (referenceId) {
      const { data: existing } = await supabase
        .from('points_history')
        .select('id')
        .eq('user_id', userId)
        .eq('category', category)
        .eq('reference_id', referenceId)
        .maybeSingle();

      if (existing) {
        return { success: true, pointsAwarded: 0, alreadyAwarded: true };
      }
    }

    // Get current points
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('total_points')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const currentPoints = profile?.total_points || 0;
    const newTotal = currentPoints + pointsToAward;

    // Update points
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ total_points: newTotal })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Record in history to prevent future duplicates
    if (referenceId) {
      await supabase
        .from('points_history')
        .insert({
          user_id: userId,
          category,
          reference_id: referenceId,
          points_awarded: pointsToAward,
        });
    }

    return { success: true, pointsAwarded: pointsToAward };
  } catch (error) {
    console.error(`Error awarding points for ${category}:`, error);
    return { success: false, pointsAwarded: 0 };
  }
}

export async function awardDailyLoginPoints(userId: string): Promise<{ success: boolean; pointsAwarded: number; alreadyAwarded: boolean }> {
  try {
    const { isActive } = await getPointsForCategory('daily_login');
    
    if (!isActive) {
      return { success: true, pointsAwarded: 0, alreadyAwarded: false };
    }

    // Check if already logged in today
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existingLogin, error: checkError } = await supabase
      .from('daily_logins')
      .select('id, points_awarded')
      .eq('user_id', userId)
      .eq('login_date', today)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingLogin) {
      if (existingLogin.points_awarded) {
        return { success: true, pointsAwarded: 0, alreadyAwarded: true };
      }
      
      // Record exists but points not awarded yet
      const result = await awardPoints(userId, 'daily_login');
      
      if (result.success) {
        await supabase
          .from('daily_logins')
          .update({ points_awarded: true })
          .eq('id', existingLogin.id);
      }
      
      return { ...result, alreadyAwarded: false };
    }

    // First login of the day
    const { error: insertError } = await supabase
      .from('daily_logins')
      .insert({
        user_id: userId,
        login_date: today,
        points_awarded: true,
      });

    if (insertError) throw insertError;

    const result = await awardPoints(userId, 'daily_login');
    return { ...result, alreadyAwarded: false };
  } catch (error) {
    console.error('Error awarding daily login points:', error);
    return { success: false, pointsAwarded: 0, alreadyAwarded: false };
  }
}

// Forum-specific award functions
export async function awardForumPostPoints(userId: string): Promise<{ success: boolean; pointsAwarded: number }> {
  return awardPoints(userId, 'forum_create_post');
}

export async function awardForumCommentPoints(userId: string): Promise<{ success: boolean; pointsAwarded: number }> {
  return awardPoints(userId, 'forum_create_comment');
}

export async function awardForumGiveLikePoints(userId: string): Promise<{ success: boolean; pointsAwarded: number }> {
  return awardPoints(userId, 'forum_give_like');
}

export async function awardForumReceiveLikePoints(postAuthorId: string): Promise<{ success: boolean; pointsAwarded: number }> {
  return awardPoints(postAuthorId, 'forum_receive_like');
}
