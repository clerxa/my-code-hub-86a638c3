import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Handshake, Upload, User, Mail, Shield } from "lucide-react";


interface ProfileBannerProps {
  profile: {
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
    job_title?: string | null;
    total_points: number;
    completed_modules?: number[] | null;
  };
  company: {
    name: string;
    partnership_type?: string | null;
    enable_points_ranking?: boolean;
  } | null;
  riskProfile?: {
    profile_type: string;
    total_weighted_score: number;
  } | null;
  uploading: boolean;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNavigatePartnership: () => void;
  onOpenRiskProfile: () => void;
}

const ProfileBanner: React.FC<ProfileBannerProps> = ({
  profile,
  company,
  riskProfile,
  uploading,
  onAvatarUpload,
  onNavigatePartnership,
  onOpenRiskProfile,
}) => {
  const isPartner = company?.partnership_type && company.partnership_type.toLowerCase() !== "aucun";

  return (
    <div className="relative overflow-hidden rounded-xl border border-transparent"
      style={{
        background: "linear-gradient(135deg, hsl(220 20% 14% / 0.85) 0%, hsl(250 30% 18% / 0.9) 50%, hsl(220 25% 12% / 0.85) 100%)",
        borderImage: "linear-gradient(135deg, hsl(271 81% 56%), hsl(217 91% 60%)) 1",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Radial glow background */}
      <div className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 30% 50%, hsl(217 91% 60% / 0.3) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, hsl(271 81% 56% / 0.25) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row gap-5 sm:gap-8 items-start">
        {/* Avatar with glow aura */}
        <div className="flex flex-col items-center w-full md:w-auto">
          <Input type="file" accept="image/*" onChange={onAvatarUpload} disabled={uploading} className="hidden" id="avatar-upload-banner" />
          <Label htmlFor="avatar-upload-banner" className="cursor-pointer group relative">
            {/* Glow ring */}
            <div className="absolute -inset-2 rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-500 blur-md"
              style={{ background: "linear-gradient(135deg, hsl(217 91% 60%), hsl(38 92% 50%))" }}
            />
            <div className="absolute -inset-1 rounded-full"
              style={{ background: "linear-gradient(135deg, hsl(217 91% 60%), hsl(271 81% 56%), hsl(38 92% 50%))", padding: "2px" }}
            >
              <div className="w-full h-full rounded-full bg-[hsl(220_20%_14%)]" />
            </div>
            <Avatar className="h-24 w-24 sm:h-28 sm:w-28 relative z-10 border-2 border-transparent transition-transform duration-300 group-hover:scale-105">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="text-xl sm:text-2xl bg-[hsl(220_20%_18%)] text-white">
                {(profile?.first_name?.[0] || profile?.last_name?.[0])
                  ? <>{profile?.first_name?.[0]}{profile?.last_name?.[0]}</>
                  : <User className="h-10 w-10 sm:h-12 sm:w-12 text-white/60" />}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
              <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </Label>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3 sm:space-y-4 min-w-0 w-full">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white break-words"
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
            >
              {profile?.first_name} {profile?.last_name}
            </h1>
            {profile?.job_title && (
              <p className="text-base sm:text-lg text-white/70 font-medium truncate mt-1">{profile.job_title}</p>
            )}

            {company && (
              <div className="mt-3">
                {isPartner ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="bg-[hsl(38_92%_50%)] hover:bg-[hsl(38_92%_55%)] text-white border-none px-3 py-1.5 text-xs sm:text-sm font-semibold cursor-help shadow-[0_4px_15px_rgba(245,158,11,0.4)]">
                        <Handshake className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                        <span className="truncate">{company.name}, partenaire officiel de MyFinCare</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs text-center">
                      <p>Votre entreprise a mis en place un partenariat officiel avec FinCare, vous permettant d'accéder à des fonctionnalités avancées et un accompagnement personnalisé.</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm text-white/50">
                      {company.name} n'est pas encore partenaire officiel de FinCare
                    </p>
                    <Button variant="outline" size="sm" className="border-white/20 text-white/80 hover:bg-white/10 hover:text-white text-xs sm:text-sm" onClick={onNavigatePartnership}>
                      <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="hidden sm:inline">Proposer un partenariat à mon entreprise</span>
                      <span className="sm:hidden">Proposer un partenariat</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Risk profile */}
          <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
            <div className="w-full">
              {riskProfile && (
                <Button variant="outline" size="sm" onClick={onOpenRiskProfile}
                  className="w-full gap-2 flex-wrap justify-center sm:justify-start h-auto py-2 border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <Shield className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Profil de risque : <strong>{riskProfile.profile_type}</strong></span>
                  <Badge variant="secondary" className="ml-1 text-xs bg-white/10 text-white/90 border-white/20">
                    {riskProfile.total_weighted_score.toFixed(0)}/100
                  </Badge>
                </Button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileBanner;
