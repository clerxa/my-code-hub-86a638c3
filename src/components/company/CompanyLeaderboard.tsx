import { useState, useEffect } from "react";
import { Trophy, Medal, Award, Crown, TrendingUp, Info, Star, BookOpen, Video, HelpCircle, Calculator, Calendar, Users, MessageSquare, ThumbsUp, LogIn, Heart, Handshake, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface LeaderboardEntry {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  total_points: number;
  rank: number;
}

interface CompanyLeaderboardProps {
  companyId: string;
  currentUserId?: string;
  limit?: number;
}

export const CompanyLeaderboard = ({ 
  companyId, 
  currentUserId,
  limit = 10 
}: CompanyLeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [pointsRules, setPointsRules] = useState<{ category: string; points: number; description: string }[]>([]);
  const [rulesOpen, setRulesOpen] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      
      // Fetch top entries and points rules in parallel
      const [leaderboardResult, rulesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, total_points')
          .eq('company_id', companyId)
          .order('total_points', { ascending: false })
          .limit(limit),
        supabase
          .from('points_configuration')
          .select('category, points, description')
          .eq('is_active', true)
          .order('points', { ascending: false })
      ]);

      if (rulesResult.data) {
        setPointsRules(rulesResult.data.map(r => ({
          category: r.category,
          points: r.points,
          description: r.description || r.category
        })));
      }

      const { data, error } = leaderboardResult;

      if (error) {
        console.error('Error fetching leaderboard:', error);
        setLoading(false);
        return;
      }

      const rankedEntries = (data || []).map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      setEntries(rankedEntries);

      // Find current user's rank if not in top entries
      if (currentUserId) {
        const currentUserEntry = rankedEntries.find(e => e.id === currentUserId);
        if (currentUserEntry) {
          setUserRank(currentUserEntry);
        } else {
          const { data: allUsers } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, total_points')
            .eq('company_id', companyId)
            .order('total_points', { ascending: false });

          if (allUsers) {
            const userIndex = allUsers.findIndex(u => u.id === currentUserId);
            if (userIndex !== -1) {
              setUserRank({
                ...allUsers[userIndex],
                rank: userIndex + 1,
              });
            }
          }
        }
      }

      setLoading(false);
    };

    if (companyId) {
      fetchLeaderboard();
    }
  }, [companyId, currentUserId, limit]);

  const getCategoryIcon = (category: string) => {
    const iconClass = "h-4 w-4";
    switch (category) {
      case 'financial_profile_completion': return <UserCheck className={iconClass} />;
      case 'partnership_request': return <Handshake className={iconClass} />;
      case 'appointment_booking': return <Calendar className={iconClass} />;
      case 'colleague_invitation': return <Users className={iconClass} />;
      case 'quiz_completion': return <HelpCircle className={iconClass} />;
      case 'simulator_completion': return <Calculator className={iconClass} />;
      case 'guide_completion': return <BookOpen className={iconClass} />;
      case 'video_completion': return <Video className={iconClass} />;
      case 'webinar_registration': return <Star className={iconClass} />;
      case 'forum_create_post': return <MessageSquare className={iconClass} />;
      case 'forum_create_comment': return <MessageSquare className={iconClass} />;
      case 'daily_login': return <LogIn className={iconClass} />;
      case 'forum_receive_like': return <Heart className={iconClass} />;
      case 'forum_give_like': return <ThumbsUp className={iconClass} />;
      default: return <Star className={iconClass} />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'financial_profile_completion': 'Profil financier complété',
      'partnership_request': 'Demande de partenariat',
      'appointment_booking': 'Prise de rendez-vous',
      'colleague_invitation': 'Invitation d\'un collègue',
      'quiz_completion': 'Quiz terminé',
      'simulator_completion': 'Simulateur utilisé',
      'guide_completion': 'Guide lu',
      'video_completion': 'Vidéo visionnée',
      'webinar_registration': 'Inscription webinaire',
      'forum_create_post': 'Post sur le forum',
      'forum_create_comment': 'Commentaire sur le forum',
      'daily_login': 'Connexion quotidienne',
      'forum_receive_like': 'Like reçu',
      'forum_give_like': 'Like donné',
    };
    return labels[category] || category;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground w-5 text-center">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-300/10 to-gray-400/10 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/10 to-orange-500/10 border-amber-600/30";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Classement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Classement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Aucun classement disponible pour le moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Classement des collaborateurs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.map((entry) => {
          const isCurrentUser = entry.id === currentUserId;
          
          return (
            <div
              key={entry.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                getRankStyle(entry.rank),
                isCurrentUser && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            >
              <div className="flex items-center justify-center w-8">
                {getRankIcon(entry.rank)}
              </div>
              
              <Avatar className="h-10 w-10">
                <AvatarImage src={entry.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {entry.first_name?.[0]}{entry.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium truncate",
                  isCurrentUser && "text-primary"
                )}>
                  {entry.first_name} {entry.last_name}
                  {isCurrentUser && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Vous
                    </Badge>
                  )}
                </p>
              </div>
              
              <div className="flex items-center gap-1 text-right">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{entry.total_points}</span>
                <span className="text-xs text-muted-foreground">pts</span>
              </div>
            </div>
          );
        })}

        {/* Show current user if not in top list */}
        {userRank && !entries.find(e => e.id === currentUserId) && (
          <>
            <div className="flex items-center justify-center py-2">
              <span className="text-muted-foreground text-sm">• • •</span>
            </div>
            <div
              className="flex items-center gap-3 p-3 rounded-lg border ring-2 ring-primary ring-offset-2 ring-offset-background"
            >
              <div className="flex items-center justify-center w-8">
                <span className="text-sm font-medium text-muted-foreground">{userRank.rank}</span>
              </div>
              
              <Avatar className="h-10 w-10">
                <AvatarImage src={userRank.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {userRank.first_name?.[0]}{userRank.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-primary">
                  {userRank.first_name} {userRank.last_name}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Vous
                  </Badge>
                </p>
              </div>
              
              <div className="flex items-center gap-1 text-right">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{userRank.total_points}</span>
                <span className="text-xs text-muted-foreground">pts</span>
              </div>
            </div>
          </>
        )}

        {/* Points rules section */}
        {pointsRules.length > 0 && (
          <Collapsible open={rulesOpen} onOpenChange={setRulesOpen} className="mt-6">
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2 border-t pt-4">
              <Info className="h-4 w-4" />
              <span className="font-medium">Comment gagner des points ?</span>
              <span className={cn("ml-auto transition-transform text-xs", rulesOpen && "rotate-180")}>▼</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="grid gap-2">
                {pointsRules.map((rule) => (
                  <div
                    key={rule.category}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50 text-sm"
                  >
                    <span className="text-muted-foreground">{getCategoryIcon(rule.category)}</span>
                    <span className="flex-1">{getCategoryLabel(rule.category)}</span>
                    <Badge variant="outline" className="font-semibold tabular-nums">
                      +{rule.points} pts
                    </Badge>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};
