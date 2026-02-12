import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PointsConfig {
  category: string;
  points: number;
  is_active: boolean;
}

type PointsCategory = 
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

const defaultPoints: Record<PointsCategory, number> = {
  guide_completion: 30,
  video_completion: 25,
  quiz_completion: 40,
  simulator_completion: 35,
  webinar_registration: 20,
  daily_login: 5,
  forum_create_post: 15,
  forum_create_comment: 10,
  forum_receive_like: 5,
  forum_give_like: 2,
  colleague_invitation: 50,
  partnership_request: 100,
  appointment_booking: 75,
  financial_profile_completion: 100,
};

export const usePointsConfiguration = () => {
  const [configs, setConfigs] = useState<PointsConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfigs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('points_configuration')
        .select('category, points, is_active');

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching points configuration:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const getPoints = useCallback((category: PointsCategory): number => {
    const config = configs.find(c => c.category === category);
    if (!config || !config.is_active) return 0;
    return config.points;
  }, [configs]);

  const isActive = useCallback((category: PointsCategory): boolean => {
    const config = configs.find(c => c.category === category);
    return config?.is_active ?? true;
  }, [configs]);

  const awardPoints = useCallback(async (
    userId: string,
    category: PointsCategory,
    customPoints?: number
  ): Promise<{ success: boolean; pointsAwarded: number }> => {
    const points = customPoints ?? getPoints(category);
    
    if (points <= 0) {
      return { success: true, pointsAwarded: 0 };
    }

    try {
      // Get current points
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const currentPoints = profile?.total_points || 0;
      const newTotal = currentPoints + points;

      // Update points
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ total_points: newTotal })
        .eq('id', userId);

      if (updateError) throw updateError;

      return { success: true, pointsAwarded: points };
    } catch (error) {
      console.error(`Error awarding points for ${category}:`, error);
      return { success: false, pointsAwarded: 0 };
    }
  }, [getPoints]);

  const awardDailyLoginPoints = useCallback(async (userId: string): Promise<{ success: boolean; pointsAwarded: number; alreadyAwarded: boolean }> => {
    if (!isActive('daily_login')) {
      return { success: true, pointsAwarded: 0, alreadyAwarded: false };
    }

    try {
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
        // Already logged in today
        if (existingLogin.points_awarded) {
          return { success: true, pointsAwarded: 0, alreadyAwarded: true };
        }
        
        // Record exists but points not awarded yet, award them now
        const result = await awardPoints(userId, 'daily_login');
        
        if (result.success) {
          await supabase
            .from('daily_logins')
            .update({ points_awarded: true })
            .eq('id', existingLogin.id);
        }
        
        return { ...result, alreadyAwarded: false };
      }

      // First login of the day, create record and award points
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
  }, [isActive, awardPoints]);

  return {
    configs,
    loading,
    getPoints,
    isActive,
    awardPoints,
    awardDailyLoginPoints,
    refetch: fetchConfigs,
  };
};
