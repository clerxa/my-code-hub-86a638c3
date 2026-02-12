import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VideoTrackingState {
  watchTimeSeconds: number;
  totalDurationSeconds: number | null;
  percentageWatched: number;
  isCompleted: boolean;
  isValidated: boolean;
}

export const useVideoTracking = (
  moduleId: number,
  userId: string,
) => {
  const { toast } = useToast();
  const [requiredPercentage, setRequiredPercentage] = useState<number>(30);
  const [state, setState] = useState<VideoTrackingState>({
    watchTimeSeconds: 0,
    totalDurationSeconds: null,
    percentageWatched: 0,
    isCompleted: false,
    isValidated: false,
  });
  
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);

  // Load validation settings
  useEffect(() => {
    const loadValidationSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('module_validation_settings')
          .select('video_min_watch_percentage')
          .eq('module_type', 'video')
          .single();

        if (error) {
          console.error('Error loading validation settings:', error);
          return;
        }

        if (data) {
          setRequiredPercentage(data.video_min_watch_percentage);
        }
      } catch (err) {
        console.error('Failed to load validation settings:', err);
      }
    };

    loadValidationSettings();
  }, []);

  // Load existing progress from database
  const loadProgress = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading progress:', error);
        return;
      }

      if (data) {
        setState({
          watchTimeSeconds: data.watch_time_seconds,
          totalDurationSeconds: data.total_duration_seconds,
          percentageWatched: parseFloat(data.percentage_watched?.toString() || '0'),
          isCompleted: data.completed || false,
          isValidated: data.completed || false,
        });
      }
    } catch (err) {
      console.error('Failed to load progress:', err);
    }
  }, [moduleId, userId]);

  // Save progress to database
  const saveProgress = useCallback(async (currentState: VideoTrackingState) => {
    const now = Date.now();
    // Save every 5 seconds to avoid too many writes
    if (now - lastSaveRef.current < 5000 && !currentState.isCompleted) {
      return;
    }
    lastSaveRef.current = now;

    try {
      const { error } = await supabase
        .from('video_progress')
        .upsert({
          user_id: userId,
          module_id: moduleId,
          watch_time_seconds: currentState.watchTimeSeconds,
          total_duration_seconds: currentState.totalDurationSeconds,
          percentage_watched: currentState.percentageWatched,
          completed: currentState.isCompleted,
          completed_at: currentState.isCompleted ? new Date().toISOString() : null,
        }, {
          onConflict: 'user_id,module_id'
        });

      if (error) {
        console.error('Error saving progress:', error);
      }
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
  }, [moduleId, userId]);

  // Update watch time
  const updateWatchTime = useCallback((currentTime: number, duration: number) => {
    setState(prev => {
      const newWatchTime = Math.max(prev.watchTimeSeconds, Math.floor(currentTime));
      const newPercentage = duration > 0 ? (newWatchTime / duration) * 100 : 0;
      const shouldValidate = !prev.isValidated && newPercentage >= requiredPercentage;

      const newState = {
        watchTimeSeconds: newWatchTime,
        totalDurationSeconds: duration,
        percentageWatched: newPercentage,
        isCompleted: shouldValidate || prev.isCompleted,
        isValidated: shouldValidate || prev.isValidated,
      };

      // Save progress
      saveProgress(newState);

      // Show validation notification
      if (shouldValidate) {
        toast({
          title: "Module validé 🎉",
          description: `Vous avez visionné ${requiredPercentage}% de la vidéo !`,
        });
      }

      return newState;
    });
  }, [requiredPercentage, saveProgress, toast]);

  // Set total duration
  const setTotalDuration = useCallback((duration: number) => {
    setState(prev => ({
      ...prev,
      totalDurationSeconds: duration,
    }));
  }, []);

  // Start tracking
  const startTracking = useCallback((getCurrentTime: () => number, getDuration: () => number) => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
    }

    trackingIntervalRef.current = setInterval(() => {
      const currentTime = getCurrentTime();
      const duration = getDuration();
      
      if (duration > 0) {
        updateWatchTime(currentTime, duration);
      }
    }, 1000);
  }, [updateWatchTime]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    // Final save
    saveProgress(state);
  }, [saveProgress, state]);

  // Load progress on mount
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    requiredPercentage,
    startTracking,
    stopTracking,
    setTotalDuration,
    updateWatchTime,
  };
};
