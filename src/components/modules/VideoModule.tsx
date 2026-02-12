import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Play, CheckCircle2 } from 'lucide-react';
import { useVideoTracking } from '@/hooks/useVideoTracking';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';

interface VideoModuleProps {
  moduleId: number;
  title: string;
  description: string;
  embedCode: string;
  points: number;
  userId: string;
  onValidate: () => void;
  onClose: () => void;
}

export const VideoModule = ({
  moduleId,
  title,
  description,
  embedCode,
  points,
  userId,
  onValidate,
  onClose,
}: VideoModuleProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<any>(null);

  const {
    watchTimeSeconds,
    totalDurationSeconds,
    percentageWatched,
    isValidated,
    requiredPercentage,
    startTracking,
    stopTracking,
    setTotalDuration,
  } = useVideoTracking(moduleId, userId);

  // Extract video URL from embed code
  const getVideoUrl = () => {
    const srcMatch = embedCode.match(/src=["']([^"']+)["']/);
    return srcMatch ? srcMatch[1] : embedCode;
  };

  // Detect video platform
  const getVideoPlatform = (url: string): 'youtube' | 'vimeo' | 'other' => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    return 'other';
  };

  const videoUrl = getVideoUrl();
  const platform = getVideoPlatform(videoUrl);

  // Initialize YouTube Player
  useEffect(() => {
    if (platform === 'youtube' && !playerRef.current) {
      // Load YouTube IFrame API
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      // @ts-ignore
      window.onYouTubeIframeAPIReady = () => {
        const videoId = videoUrl.match(/embed\/([^?]+)/)?.[1];
        if (!videoId) return;

        // @ts-ignore
        playerRef.current = new window.YT.Player(iframeRef.current, {
          videoId,
          events: {
            onReady: (event: any) => {
              setPlayerReady(true);
              const duration = event.target.getDuration();
              setTotalDuration(duration);
            },
            onStateChange: (event: any) => {
              // @ts-ignore
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                startTracking(
                  () => playerRef.current?.getCurrentTime() || 0,
                  () => playerRef.current?.getDuration() || 0
                );
              } else {
                setIsPlaying(false);
                stopTracking();
              }
            },
          },
        });
      };
    }
  }, [platform, videoUrl, startTracking, stopTracking, setTotalDuration]);

  // Initialize Vimeo Player
  useEffect(() => {
    if (platform === 'vimeo' && !playerRef.current) {
      // Load Vimeo Player API
      const script = document.createElement('script');
      script.src = 'https://player.vimeo.com/api/player.js';
      document.body.appendChild(script);

      let vimeoTrackingInterval: NodeJS.Timeout | null = null;

      script.onload = () => {
        // @ts-ignore
        playerRef.current = new window.Vimeo.Player(iframeRef.current);
        
        playerRef.current.getDuration().then((duration: number) => {
          setTotalDuration(duration);
          setPlayerReady(true);
        });

        playerRef.current.on('play', () => {
          setIsPlaying(true);
          
          // For Vimeo, we need to poll manually since API is async
          vimeoTrackingInterval = setInterval(() => {
            if (playerRef.current) {
              Promise.all([
                playerRef.current.getCurrentTime(),
                playerRef.current.getDuration()
              ]).then(([currentTime, duration]) => {
                if (duration > 0) {
                  startTracking(
                    () => currentTime,
                    () => duration
                  );
                }
              });
            }
          }, 1000);
        });

        playerRef.current.on('pause', () => {
          setIsPlaying(false);
          if (vimeoTrackingInterval) {
            clearInterval(vimeoTrackingInterval);
            vimeoTrackingInterval = null;
          }
          stopTracking();
        });

        playerRef.current.on('ended', () => {
          if (vimeoTrackingInterval) {
            clearInterval(vimeoTrackingInterval);
            vimeoTrackingInterval = null;
          }
          stopTracking();
        });
      };

      return () => {
        if (vimeoTrackingInterval) {
          clearInterval(vimeoTrackingInterval);
        }
      };
    }
  }, [platform, startTracking, stopTracking, setTotalDuration]);

  // Handle validation
  useEffect(() => {
    if (isValidated) {
      onValidate();
    }
  }, [isValidated, onValidate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress Card */}
        {playerReady && totalDurationSeconds && (
          <Card className={`mb-6 ${isValidated ? 'border-success bg-success/10' : 'border-primary/30 bg-primary/5'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {isValidated ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-6 w-6 text-success" />
                      <span className="font-bold text-lg text-success">Module validé !</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Play className="h-6 w-6 text-primary" />
                      <span className="font-semibold text-lg">En cours de visionnage</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatTime(watchTimeSeconds)} / {formatTime(totalDurationSeconds)}
                  </span>
                  <Badge 
                    variant={isValidated ? 'default' : 'secondary'} 
                    className={`text-base px-3 py-1 ${isValidated ? 'bg-success text-white' : ''}`}
                  >
                    {Math.round(percentageWatched)}%
                  </Badge>
                </div>
              </div>
              <Progress value={percentageWatched} className="h-3 mb-3" />
              {!isValidated && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                  <p>
                    Visionnez au moins <span className="font-semibold text-foreground">{requiredPercentage}%</span> de la vidéo pour valider le module et gagner <span className="font-semibold text-foreground">{points} points</span>
                  </p>
                </div>
              )}
              {isValidated && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <p className="font-semibold text-success">
                    Félicitations ! Vous avez gagné {points} points
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Video Player */}
        <Card className="border-border/50 overflow-hidden shadow-card">
          <CardContent className="p-0">
            <AspectRatio ratio={16 / 9} className="bg-muted">
              <iframe
                ref={iframeRef}
                src={videoUrl}
                title={title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </AspectRatio>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6 border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span className="text-lg">📺</span>
              Instructions
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Regardez la vidéo attentivement</li>
              <li>• Votre progression est sauvegardée automatiquement</li>
              <li>• Vous pouvez mettre en pause et reprendre plus tard</li>
              <li>• Le module sera validé après {requiredPercentage}% de visionnage</li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Button */}
        {isValidated && (
          <div className="mt-6 flex justify-center">
            <Button onClick={onClose} size="lg" className="gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Continuer le parcours
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
