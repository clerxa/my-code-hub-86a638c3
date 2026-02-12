/**
 * ===========================================================
 * 📄 File: CommunityManagementTab.tsx
 * 📌 Rôle : CMS de gestion de la communauté (Forum)
 * ===========================================================
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Plus, 
  Trash2, 
  Save, 
  TrendingUp, 
  MessageSquare, 
  Users, 
  Eye, 
  ThumbsUp,
  Settings,
  BarChart3,
  FolderOpen,
  Edit2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Award,
  Compass,
  Zap,
  Star,
  Crown,
  Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ForumCategory } from "@/types/forum";
import { IconSelector } from "@/components/admin/IconSelector";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ModerationReasonsTab } from "./ModerationReasonsTab";

interface TrendingRules {
  min_views: number;
  min_likes: number;
  time_window_hours: number;
  weight_views: number;
  weight_likes: number;
  weight_comments: number;
}

interface ContributionLevel {
  name: string;
  min_score: number;
  icon: string;
  color: string;
}

interface ContributionConfig {
  levels: ContributionLevel[];
  points_per_post: number;
  points_per_comment: number;
  points_per_like_received: number;
}

interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  metadata: any;
  created_at: string;
  user?: {
    first_name: string | null;
    last_name: string | null;
    forum_pseudo: string | null;
    avatar_url: string | null;
  };
}

interface ForumStats {
  totalPosts: number;
  totalComments: number;
  totalUsers: number;
  todayPosts: number;
  todayComments: number;
  activeUsers: number;
}

const defaultContributionConfig: ContributionConfig = {
  levels: [
    { name: "Contributeur Explorateur", min_score: 0, icon: "Compass", color: "#6B7280" },
    { name: "Contributeur Actif", min_score: 10, icon: "Zap", color: "#3B82F6" },
    { name: "Contributeur Référent", min_score: 50, icon: "Award", color: "#8B5CF6" },
    { name: "Contributeur Expert", min_score: 150, icon: "Star", color: "#F59E0B" },
    { name: "Contributeur Leader", min_score: 300, icon: "Crown", color: "#EF4444" }
  ],
  points_per_post: 5,
  points_per_comment: 2,
  points_per_like_received: 1
};

const levelIconMap: Record<string, any> = {
  Compass,
  Zap,
  Award,
  Star,
  Crown
};

export function CommunityManagementTab() {
  const [activeTab, setActiveTab] = useState("categories");
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [trendingRules, setTrendingRules] = useState<TrendingRules>({
    min_views: 10,
    min_likes: 3,
    time_window_hours: 48,
    weight_views: 1,
    weight_likes: 2,
    weight_comments: 3
  });
  const [contributionConfig, setContributionConfig] = useState<ContributionConfig>(defaultContributionConfig);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ForumStats>({
    totalPosts: 0,
    totalComments: 0,
    totalUsers: 0,
    todayPosts: 0,
    todayComments: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Category dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ForumCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "HelpCircle",
    color: "#3b82f6"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCategories(),
        fetchTrendingRules(),
        fetchContributionConfig(),
        fetchActivityLogs(),
        fetchStats()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("forum_categories")
      .select("*")
      .order("order_num");

    if (error) {
      console.error("Error fetching categories:", error);
      return;
    }
    setCategories(data || []);
  };

  const fetchTrendingRules = async () => {
    const { data, error } = await supabase
      .from("forum_settings")
      .select("value")
      .eq("key", "trending_rules")
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching trending rules:", error);
      return;
    }

    if (data?.value && typeof data.value === "object" && !Array.isArray(data.value)) {
      setTrendingRules(data.value as unknown as TrendingRules);
    }
  };

  const fetchContributionConfig = async () => {
    const { data, error } = await supabase
      .from("forum_settings")
      .select("value")
      .eq("key", "contribution_levels")
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching contribution config:", error);
      return;
    }

    if (data?.value && typeof data.value === "object" && !Array.isArray(data.value)) {
      setContributionConfig(data.value as unknown as ContributionConfig);
    }
  };

  const fetchActivityLogs = async () => {
    const { data, error } = await supabase
      .from("forum_activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching activity logs:", error);
      return;
    }

    // Fetch user info for logs
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(log => log.user_id).filter(Boolean))];
      const { data: users } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, forum_pseudo, avatar_url")
        .in("id", userIds);

      const usersMap = new Map(users?.map(u => [u.id, u]) || []);
      
      setActivityLogs(data.map(log => ({
        ...log,
        user: log.user_id ? usersMap.get(log.user_id) : undefined
      })));
    } else {
      setActivityLogs([]);
    }
  };

  const fetchStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [postsRes, commentsRes, todayPostsRes, todayCommentsRes, usersRes] = await Promise.all([
      supabase.from("forum_posts").select("id", { count: "exact", head: true }),
      supabase.from("forum_comments").select("id", { count: "exact", head: true }),
      supabase.from("forum_posts").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
      supabase.from("forum_comments").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
      supabase.from("profiles").select("id", { count: "exact", head: true }).not("forum_pseudo", "is", null)
    ]);

    setStats({
      totalPosts: postsRes.count || 0,
      totalComments: commentsRes.count || 0,
      totalUsers: usersRes.count || 0,
      todayPosts: todayPostsRes.count || 0,
      todayComments: todayCommentsRes.count || 0,
      activeUsers: usersRes.count || 0
    });
  };

  const saveTrendingRules = async () => {
    setSaving(true);
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from("forum_settings")
        .select("id")
        .eq("key", "trending_rules")
        .maybeSingle();

      let error;
      if (existing) {
        const result = await supabase
          .from("forum_settings")
          .update({
            value: JSON.parse(JSON.stringify(trendingRules)),
            description: "Règles pour définir les sujets tendance"
          })
          .eq("key", "trending_rules");
        error = result.error;
      } else {
        const result = await supabase
          .from("forum_settings")
          .insert([{
            key: "trending_rules",
            value: JSON.parse(JSON.stringify(trendingRules)),
            description: "Règles pour définir les sujets tendance"
          }]);
        error = result.error;
      }

      if (error) throw error;
      toast.success("Règles de tendance mises à jour");
    } catch (error) {
      console.error("Error saving trending rules:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const saveContributionConfig = async () => {
    setSaving(true);
    try {
      // Validate levels are sorted by min_score
      const sortedLevels = [...contributionConfig.levels].sort((a, b) => a.min_score - b.min_score);
      const configToSave = { ...contributionConfig, levels: sortedLevels };

      const { data: existing } = await supabase
        .from("forum_settings")
        .select("id")
        .eq("key", "contribution_levels")
        .maybeSingle();

      let error;
      if (existing) {
        const result = await supabase
          .from("forum_settings")
          .update({
            value: JSON.parse(JSON.stringify(configToSave)),
            description: "Configuration des niveaux de contribution"
          })
          .eq("key", "contribution_levels");
        error = result.error;
      } else {
        const result = await supabase
          .from("forum_settings")
          .insert([{
            key: "contribution_levels",
            value: JSON.parse(JSON.stringify(configToSave)),
            description: "Configuration des niveaux de contribution"
          }]);
        error = result.error;
      }

      if (error) throw error;
      setContributionConfig(configToSave);
      toast.success("Niveaux de contribution mis à jour");
    } catch (error) {
      console.error("Error saving contribution config:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const updateLevel = (index: number, field: keyof ContributionLevel, value: string | number) => {
    setContributionConfig(prev => ({
      ...prev,
      levels: prev.levels.map((level, i) => 
        i === index ? { ...level, [field]: value } : level
      )
    }));
  };

  const openCategoryDialog = (category?: ForumCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        color: category.color
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: "",
        slug: "",
        description: "",
        icon: "HelpCircle",
        color: "#3b82f6"
      });
    }
    setCategoryDialogOpen(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleCategoryNameChange = (name: string) => {
    setCategoryForm(prev => ({
      ...prev,
      name,
      slug: !editingCategory ? generateSlug(name) : prev.slug
    }));
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim() || !categoryForm.slug.trim()) {
      toast.error("Nom et slug sont requis");
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from("forum_categories")
          .update({
            name: categoryForm.name,
            slug: categoryForm.slug,
            description: categoryForm.description,
            icon: categoryForm.icon,
            color: categoryForm.color
          })
          .eq("id", editingCategory.id);

        if (error) throw error;
        toast.success("Catégorie mise à jour");
      } else {
        const maxOrder = Math.max(...categories.map(c => c.order_num), 0);
        const { error } = await supabase
          .from("forum_categories")
          .insert({
            name: categoryForm.name,
            slug: categoryForm.slug,
            description: categoryForm.description,
            icon: categoryForm.icon,
            color: categoryForm.color,
            order_num: maxOrder + 1
          });

        if (error) throw error;
        toast.success("Catégorie créée");
      }

      setCategoryDialogOpen(false);
      fetchCategories();
    } catch (error: any) {
      console.error("Error saving category:", error);
      if (error.code === "23505") {
        toast.error("Ce slug existe déjà");
      } else {
        toast.error("Erreur lors de la sauvegarde");
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!confirm("Supprimer cette catégorie ? Les posts associés seront orphelins.")) return;

    try {
      const { error } = await supabase
        .from("forum_categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;
      toast.success("Catégorie supprimée");
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      "post_created": "Nouveau post",
      "post_liked": "Like post",
      "comment_created": "Nouveau commentaire",
      "comment_liked": "Like commentaire",
      "post_viewed": "Vue post"
    };
    return labels[action] || action;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "post_created": return <MessageSquare className="h-4 w-4" />;
      case "post_liked": return <ThumbsUp className="h-4 w-4" />;
      case "comment_created": return <MessageSquare className="h-4 w-4" />;
      case "comment_liked": return <ThumbsUp className="h-4 w-4" />;
      case "post_viewed": return <Eye className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestion de la Communauté</h2>
        <p className="text-muted-foreground">
          Gérez les catégories, les règles de tendance et surveillez l'activité du forum
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPosts}</p>
                <p className="text-sm text-muted-foreground">Posts total</p>
              </div>
            </div>
            {stats.todayPosts > 0 && (
              <Badge variant="secondary" className="mt-2">
                +{stats.todayPosts} aujourd'hui
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <MessageSquare className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalComments}</p>
                <p className="text-sm text-muted-foreground">Commentaires</p>
              </div>
            </div>
            {stats.todayComments > 0 && (
              <Badge variant="secondary" className="mt-2">
                +{stats.todayComments} aujourd'hui
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
                <p className="text-sm text-muted-foreground">Utilisateurs anonymes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <FolderOpen className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Catégories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-3xl grid-cols-5">
          <TabsTrigger value="categories" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Catégories</span>
          </TabsTrigger>
          <TabsTrigger value="moderation" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Modération</span>
          </TabsTrigger>
          <TabsTrigger value="levels" className="gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Niveaux</span>
          </TabsTrigger>
          <TabsTrigger value="trending" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Tendances</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Activité</span>
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Catégories du Forum</CardTitle>
                <CardDescription>Organisez les discussions par thématique</CardDescription>
              </div>
              <Button onClick={() => openCategoryDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle catégorie
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Ordre</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {category.slug}
                        </code>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {category.description}
                      </TableCell>
                      <TableCell>{category.order_num}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openCategoryDialog(category)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteCategory(category.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {categories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Aucune catégorie. Créez-en une pour organiser le forum.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Moderation Tab */}
        <TabsContent value="moderation" className="space-y-4">
          <ModerationReasonsTab />
        </TabsContent>

        {/* Contribution Levels Tab */}
        <TabsContent value="levels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Niveaux de Contribution
              </CardTitle>
              <CardDescription>
                Configurez les niveaux de contribution basés sur l'activité des utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Points Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium">Points attribués par action</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="points_post">Points par post</Label>
                    <Input
                      id="points_post"
                      type="number"
                      min="0"
                      value={contributionConfig.points_per_post}
                      onChange={(e) => setContributionConfig(prev => ({
                        ...prev,
                        points_per_post: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="points_comment">Points par commentaire</Label>
                    <Input
                      id="points_comment"
                      type="number"
                      min="0"
                      value={contributionConfig.points_per_comment}
                      onChange={(e) => setContributionConfig(prev => ({
                        ...prev,
                        points_per_comment: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="points_like">Points par like reçu</Label>
                    <Input
                      id="points_like"
                      type="number"
                      min="0"
                      value={contributionConfig.points_per_like_received}
                      onChange={(e) => setContributionConfig(prev => ({
                        ...prev,
                        points_per_like_received: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Levels Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium">Configuration des niveaux</h4>
                <p className="text-sm text-muted-foreground">
                  Score = (posts × {contributionConfig.points_per_post}) + (commentaires × {contributionConfig.points_per_comment}) + (likes reçus × {contributionConfig.points_per_like_received})
                </p>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Niveau</TableHead>
                      <TableHead>Score minimum</TableHead>
                      <TableHead>Icône</TableHead>
                      <TableHead>Couleur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contributionConfig.levels.map((level, index) => {
                      const IconComponent = levelIconMap[level.icon] || Award;
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={level.name}
                              onChange={(e) => updateLevel(index, "name", e.target.value)}
                              className="max-w-[200px]"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={level.min_score}
                              onChange={(e) => updateLevel(index, "min_score", parseInt(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={level.icon}
                              onValueChange={(value) => updateLevel(index, "icon", value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue>
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="h-4 w-4" />
                                    {level.icon}
                                  </div>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(levelIconMap).map(([name, Icon]) => (
                                  <SelectItem key={name} value={name}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="h-4 w-4" />
                                      {name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input
                                type="color"
                                value={level.color}
                                onChange={(e) => updateLevel(index, "color", e.target.value)}
                                className="w-12 h-8 p-1 cursor-pointer"
                              />
                              <div 
                                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                                style={{ backgroundColor: level.color }}
                              >
                                <IconComponent className="h-3 w-3" />
                                Aperçu
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <Button onClick={saveContributionConfig} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Enregistrement..." : "Enregistrer les niveaux"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trending Rules Tab */}
        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Règles des Tendances
              </CardTitle>
              <CardDescription>
                Définissez les critères pour qu'un sujet soit considéré comme "tendance"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Seuils minimums</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="min_views">Vues minimum</Label>
                    <Input
                      id="min_views"
                      type="number"
                      min="0"
                      value={trendingRules.min_views}
                      onChange={(e) => setTrendingRules(prev => ({
                        ...prev,
                        min_views: parseInt(e.target.value) || 0
                      }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Nombre minimum de vues pour être éligible
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min_likes">Likes minimum</Label>
                    <Input
                      id="min_likes"
                      type="number"
                      min="0"
                      value={trendingRules.min_likes}
                      onChange={(e) => setTrendingRules(prev => ({
                        ...prev,
                        min_likes: parseInt(e.target.value) || 0
                      }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Nombre minimum de likes pour être éligible
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time_window">Fenêtre de temps (heures)</Label>
                    <Input
                      id="time_window"
                      type="number"
                      min="1"
                      value={trendingRules.time_window_hours}
                      onChange={(e) => setTrendingRules(prev => ({
                        ...prev,
                        time_window_hours: parseInt(e.target.value) || 24
                      }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Seuls les posts créés dans cette fenêtre sont considérés
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Pondération du score</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Score = (vues × poids) + (likes × poids) + (commentaires × poids)
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="weight_views">Poids des vues</Label>
                    <Input
                      id="weight_views"
                      type="number"
                      min="0"
                      step="0.5"
                      value={trendingRules.weight_views}
                      onChange={(e) => setTrendingRules(prev => ({
                        ...prev,
                        weight_views: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight_likes">Poids des likes</Label>
                    <Input
                      id="weight_likes"
                      type="number"
                      min="0"
                      step="0.5"
                      value={trendingRules.weight_likes}
                      onChange={(e) => setTrendingRules(prev => ({
                        ...prev,
                        weight_likes: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight_comments">Poids des commentaires</Label>
                    <Input
                      id="weight_comments"
                      type="number"
                      min="0"
                      step="0.5"
                      value={trendingRules.weight_comments}
                      onChange={(e) => setTrendingRules(prev => ({
                        ...prev,
                        weight_comments: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={saveTrendingRules} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Enregistrement..." : "Enregistrer les règles"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Activité récente
              </CardTitle>
              <CardDescription>
                Les 50 dernières actions sur le forum
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune activité enregistrée pour le moment
                </div>
              ) : (
                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div className="p-2 rounded-lg bg-muted">
                        {getActionIcon(log.action_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={log.user?.avatar_url || ""} />
                            <AvatarFallback className="text-xs">
                              {log.user?.first_name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">
                            {log.user?.forum_pseudo || 
                             `${log.user?.first_name || ""} ${log.user?.last_name || ""}`.trim() || 
                             "Utilisateur"}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {getActionLabel(log.action_type)}
                          </Badge>
                        </div>
                        {log.user?.forum_pseudo && log.user?.first_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Vrai nom : {log.user.first_name} {log.user.last_name}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "dd MMM HH:mm", { locale: fr })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nom *</Label>
              <Input
                id="cat-name"
                value={categoryForm.name}
                onChange={(e) => handleCategoryNameChange(e.target.value)}
                placeholder="Ex: Investissements"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-slug">Slug *</Label>
              <Input
                id="cat-slug"
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="ex: investissements"
              />
              <p className="text-xs text-muted-foreground">
                Identifiant unique utilisé dans les URLs
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description de la catégorie..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icône</Label>
                <IconSelector
                  value={categoryForm.icon}
                  onChange={(icon) => setCategoryForm(prev => ({ ...prev, icon }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cat-color">Couleur</Label>
                <div className="flex gap-2">
                  <Input
                    id="cat-color"
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveCategory} disabled={saving}>
              {saving ? "..." : editingCategory ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
