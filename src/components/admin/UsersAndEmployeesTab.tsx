import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Mail, Download, Upload, ChevronLeft, ChevronRight, ArrowUpDown, Eye, Save, X, Settings, Plus, Trash2, RotateCcw, UserX, Building2, RefreshCcw, UserPlus, KeyRound, LayoutDashboard, Flame } from "lucide-react";
import { CompanyTransferDialog } from "./CompanyTransferDialog";
import { UserResetDialog } from "./UserResetDialog";
import { BetaInviteDialog } from "./BetaInviteDialog";
import { UserSynthesisTable } from "./UserSynthesisTable";
import { IntentionScoreBadge } from "./IntentionScoreBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EmployeesImportTab } from "./EmployeesImportTab";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["app_role"];

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  company_id: string | null;
  total_points: number;
  completed_modules: number[];
  last_login: string | null;
  current_session_start: string | null;
  phone_number: string | null;
  birth_date: string | null;
  marital_status: string | null;
  children_count: number | null;
  job_title: string | null;
  avatar_url: string | null;
  is_active?: boolean | null;
  deleted_at?: string | null;
  created_at?: string | null;
  personal_email?: string | null;
  receive_on_personal_email?: boolean | null;
}

interface LastLoginDates {
  [userId: string]: string | null;
}

interface LoginCounts {
  [userId: string]: number;
}

interface Company {
  id: string;
  name: string;
  partnership_type: string | null;
}

const ITEMS_PER_PAGE_OPTIONS = [25, 50, 100];

interface UsersAndEmployeesTabProps {
  profiles: Profile[];
  companies: Company[];
  onRefresh: () => void;
}

export function UsersAndEmployeesTab({ profiles, companies, onRefresh }: UsersAndEmployeesTabProps) {
  // État commun
  const [loading, setLoading] = useState(false);
  const [deletingUsers, setDeletingUsers] = useState(false);
  const [deleteConfirmUserId, setDeleteConfirmUserId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [userToTransfer, setUserToTransfer] = useState<Profile | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<Profile | null>(null);
  const [bulkResetDialogOpen, setBulkResetDialogOpen] = useState(false);
  const [betaInviteDialogOpen, setBetaInviteDialogOpen] = useState(false);
  const [sendingPasswordReset, setSendingPasswordReset] = useState<string | null>(null);
  const [synthesisUserId, setSynthesisUserId] = useState<string | null>(null);
  // Login counts from daily_logins table
  const [loginCounts, setLoginCounts] = useState<LoginCounts>({});
  // Last login dates from daily_logins table (fallback for null last_login)
  const [lastLoginDates, setLastLoginDates] = useState<LastLoginDates>({});
  // États pour l'onglet "Invitations & Import"
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTermEmployees, setSearchTermEmployees] = useState("");
  const [filterCompanyEmployees, setFilterCompanyEmployees] = useState<string>("all");
  const [currentPageEmployees, setCurrentPageEmployees] = useState(1);
  const [itemsPerPageEmployees, setItemsPerPageEmployees] = useState(25);
  const [sortFieldEmployees, setSortFieldEmployees] = useState<keyof Profile>("last_name");
  const [sortOrderEmployees, setSortOrderEmployees] = useState<"asc" | "desc">("asc");
  const [sending, setSending] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Fetch login counts and last login dates from daily_logins table
  useEffect(() => {
    const fetchLoginData = async () => {
      try {
        const { data, error } = await supabase
          .from('daily_logins')
          .select('user_id, login_date')
          .order('login_date', { ascending: false });
        
        if (error) {
          console.error('Error fetching login data:', error);
          return;
        }

        // Count logins per user and get last login date
        const counts: LoginCounts = {};
        const lastLogins: LastLoginDates = {};
        
        (data || []).forEach((login: { user_id: string; login_date: string }) => {
          counts[login.user_id] = (counts[login.user_id] || 0) + 1;
          // Only set the first (most recent) login date for each user
          if (!lastLogins[login.user_id]) {
            lastLogins[login.user_id] = login.login_date;
          }
        });
        
        setLoginCounts(counts);
        setLastLoginDates(lastLogins);
      } catch (err) {
        console.error('Error fetching login data:', err);
      }
    };

    fetchLoginData();
  }, [profiles]);


  const handleDeleteUsers = async (userIds: string[]) => {
    try {
      setDeletingUsers(true);
      
      const { data: result, error } = await supabase.functions.invoke('delete-users', {
        body: { userIds },
      });

      if (error) {
        throw new Error(error.message || 'Erreur lors de la suppression');
      }
      
      if (result?.error) {
        throw new Error(result.error);
      }

      const { deactivated, failed } = result.summary || { deactivated: 0, failed: 0 };
      
      if (deactivated > 0 && failed === 0) {
        toast.success(`${deactivated} utilisateur(s) désactivé(s) avec succès`);
      } else if (deactivated > 0 && failed > 0) {
        toast.warning(`${deactivated} désactivé(s), ${failed} erreur(s)`);
      } else if (deactivated === 0 && failed > 0) {
        toast.error('Erreur lors de la désactivation');
      }
      
      setSelectedUserIds(new Set());
      onRefresh();
    } catch (error) {
      console.error("Error deactivating users:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la désactivation");
    } finally {
      setDeletingUsers(false);
      setDeleteConfirmUserId(null);
      setBulkDeleteConfirmOpen(false);
    }
  };

  const handleRestoreUsers = async (userIds: string[]) => {
    try {
      setDeletingUsers(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: true, deleted_at: null })
        .in('id', userIds);

      if (error) throw error;

      toast.success(`${userIds.length} utilisateur(s) restauré(s) avec succès`);
      setSelectedUserIds(new Set());
      onRefresh();
    } catch (error) {
      console.error("Error restoring users:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la restauration");
    } finally {
      setDeletingUsers(false);
    }
  };

  const handleSelectUserForDeletion = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUserIds);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleSelectAllUsersForDeletion = (checked: boolean) => {
    if (checked) {
      const ids = new Set(paginatedUsers.map(p => p.id));
      setSelectedUserIds(ids);
    } else {
      setSelectedUserIds(new Set());
    }
  };

  // États pour l'onglet "Gestion des utilisateurs"
  const [roles, setRoles] = useState<Record<string, UserRole>>({});
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [searchTermUsers, setSearchTermUsers] = useState("");
  const [currentPageUsers, setCurrentPageUsers] = useState(1);
  const [itemsPerPageUsers, setItemsPerPageUsers] = useState(25);
  const [sortFieldUsers, setSortFieldUsers] = useState<keyof Profile>("last_name");
  const [sortOrderUsers, setSortOrderUsers] = useState<"asc" | "desc">("asc");
  
  // Default columns including personal_email
  const defaultColumns = [
    "first_name",
    "last_name",
    "email",
    "personal_email",
    "company_id",
    "role",
    "total_points",
    "completed_modules",
    "login_count",
    "intention_score",
    "last_login",
  ];

  // Load visible columns from localStorage or use defaults
  // Version key to force refresh when new columns are added
  const COLUMNS_VERSION = 'v3';
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    const savedVersion = localStorage.getItem('admin_users_columns_version');
    const saved = localStorage.getItem('admin_users_visible_columns');
    
    // If version mismatch or no saved data, use defaults
    if (savedVersion !== COLUMNS_VERSION || !saved) {
      localStorage.setItem('admin_users_columns_version', COLUMNS_VERSION);
      return new Set(defaultColumns);
    }
    
    try {
      return new Set(JSON.parse(saved));
    } catch {
      return new Set(defaultColumns);
    }
  });

  // Save visible columns to localStorage when they change
  useEffect(() => {
    localStorage.setItem('admin_users_visible_columns', JSON.stringify(Array.from(visibleColumns)));
  }, [visibleColumns]);

  const allColumns = [
    { key: "first_name", label: "Prénom" },
    { key: "last_name", label: "Nom" },
    { key: "email", label: "Email professionnel" },
    { key: "personal_email", label: "Email secondaire" },
    { key: "company_id", label: "Entreprise" },
    { key: "role", label: "Rôle" },
    { key: "total_points", label: "Points" },
    { key: "completed_modules", label: "Modules réalisés" },
    { key: "login_count", label: "Nb connexions" },
    { key: "phone_number", label: "Téléphone" },
    { key: "birth_date", label: "Date de naissance" },
    { key: "marital_status", label: "Situation familiale" },
    { key: "children_count", label: "Enfants" },
    { key: "job_title", label: "Poste" },
    { key: "created_at", label: "Date d'inscription" },
    { key: "last_login", label: "Dernière connexion" },
    { key: "receive_on_personal_email", label: "Opt-in email perso" },
    { key: "intention_score", label: "Score intention RDV" },
  ];

  // Helper function to get effective last login (from profile or daily_logins)
  const getEffectiveLastLogin = (profile: Profile): string | null => {
    if (profile.last_login) return profile.last_login;
    return lastLoginDates[profile.id] || null;
  };

  useEffect(() => {
    fetchRoles();
  }, [profiles]);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (error) throw error;

      const rolesMap: Record<string, UserRole> = {};
      data?.forEach((r) => {
        rolesMap[r.user_id] = r.role;
      });
      setRoles(rolesMap);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Erreur lors du chargement des rôles");
    }
  };

  const getUserRole = (userId: string): UserRole => {
    return roles[userId] || "user";
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      // Delete existing roles for this user, then insert the new one
      // (unique constraint is on user_id+role, not user_id alone)
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      if (newRole !== "user") {
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });

        if (insertError) throw insertError;
      }

      setRoles((prev) => ({ ...prev, [userId]: newRole }));
      toast.success("Rôle mis à jour avec succès");
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error("Erreur lors de la mise à jour du rôle");
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "👑";
      case "contact_entreprise":
        return "🏢";
      case "user":
        return "👤";
      default:
        return "❓";
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "default";
      case "contact_entreprise":
        return "secondary";
      case "user":
        return "outline";
      default:
        return "outline";
    }
  };

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
      return newSet;
    });
  };

  const isColumnVisible = (columnKey: string) => visibleColumns.has(columnKey);

  // Fonctions pour l'onglet "Invitations & Import"
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = new Set(filteredEmployees.map(p => p.id));
      setSelectedIds(ids);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSendInvitations = async () => {
    if (selectedIds.size === 0) {
      toast.error("Aucun utilisateur sélectionné");
      return;
    }

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('send-invitations', {
        body: { userIds: Array.from(selectedIds) },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      const result = response.data;
      
      if (result.success) {
        toast.success(`${result.report.sent} invitation(s) envoyée(s), ${result.report.skipped} ignorée(s)`);
        setSelectedIds(new Set());
        onRefresh();
      } else {
        throw new Error(result.error || 'Erreur lors de l\'envoi');
      }
    } catch (error: any) {
      console.error('Send invitations error:', error);
      toast.error(`Erreur : ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleExportCSV = () => {
    // Get company names map
    const companyMap = new Map(companies.map(c => [c.id, c.name]));
    
    const headers = [
      'Prénom', 'Nom', 'Email professionnel', 'Email secondaire', 'Opt-in email perso',
      'Entreprise', 'Rôle', 'Téléphone', 'Date de naissance', 'Situation familiale',
      'Enfants', 'Poste', 'Date d\'inscription', 'Dernière connexion',
      'Nb connexions', 'Modules complétés', 'Points'
    ];

    const rows = filteredEmployees.map(p => {
      const companyName = p.company_id ? companyMap.get(p.company_id) || p.company_id : '';
      const role = getUserRole(p.id);
      const effectiveLastLogin = getEffectiveLastLogin(p);
      
      return [
        p.first_name || '',
        p.last_name || '',
        p.email,
        p.personal_email || '',
        p.receive_on_personal_email ? 'Oui' : 'Non',
        companyName,
        role === 'admin' ? 'Admin' : role === 'contact_entreprise' ? 'Contact entreprise' : 'Utilisateur',
        p.phone_number || '',
        p.birth_date ? format(new Date(p.birth_date), 'dd/MM/yyyy', { locale: fr }) : '',
        p.marital_status || '',
        p.children_count?.toString() || '',
        p.job_title || '',
        p.created_at ? format(new Date(p.created_at), 'dd/MM/yyyy', { locale: fr }) : '',
        effectiveLastLogin ? format(new Date(effectiveLastLogin), 'dd/MM/yyyy', { locale: fr }) : '',
        (loginCounts[p.id] || 0).toString(),
        p.completed_modules.length.toString(),
        p.total_points.toString(),
      ];
    });

    const csv = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `export_utilisateurs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handleSortEmployees = (field: keyof Profile) => {
    if (sortFieldEmployees === field) {
      setSortOrderEmployees(sortOrderEmployees === "asc" ? "desc" : "asc");
    } else {
      setSortFieldEmployees(field);
      setSortOrderEmployees("asc");
    }
    setCurrentPageEmployees(1);
  };

  const handleSortUsers = (field: keyof Profile) => {
    if (sortFieldUsers === field) {
      setSortOrderUsers(sortOrderUsers === "asc" ? "desc" : "asc");
    } else {
      setSortFieldUsers(field);
      setSortOrderUsers("asc");
    }
    setCurrentPageUsers(1);
  };

  // Fonctions pour l'onglet "Gestion des utilisateurs"
  const handleStartEdit = (profile: Profile) => {
    setEditingUserId(profile.id);
    setEditForm({ ...profile });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editingUserId) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update(editForm)
        .eq("id", editingUserId);

      if (error) throw error;

      toast.success("Profil mis à jour avec succès");
      setEditingUserId(null);
      setEditForm({});
      onRefresh();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleViewProfile = (profileId: string) => {
    window.open(`/employee/${profileId}`, "_blank");
  };

  const handleSendPasswordReset = async (profile: Profile) => {
    try {
      setSendingPasswordReset(profile.id);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session non trouvée");
        return;
      }

      const response = await supabase.functions.invoke('send-password-reset', {
        body: { userId: profile.id },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.success) {
        toast.success(`Email de réinitialisation envoyé à ${profile.email}`);
      } else {
        throw new Error(response.data?.error || "Erreur inconnue");
      }
    } catch (error: any) {
      console.error("Error sending password reset:", error);
      toast.error(error.message || "Erreur lors de l'envoi de l'email");
    } finally {
      setSendingPasswordReset(null);
    }
  };

  const isEditing = (profileId: string) => editingUserId === profileId;

  // Filtrage et tri pour "Invitations & Import" (utilisateurs actifs uniquement)
  const filteredEmployees = profiles
    .filter(p => {
      // Exclure les utilisateurs supprimés
      if (p.is_active === false) return false;
      
      const matchesSearch = !searchTermEmployees || 
        p.first_name?.toLowerCase().includes(searchTermEmployees.toLowerCase()) ||
        p.last_name?.toLowerCase().includes(searchTermEmployees.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTermEmployees.toLowerCase());
      
      const matchesCompany = filterCompanyEmployees === "all" || p.company_id === filterCompanyEmployees;

      return matchesSearch && matchesCompany;
    })
    .sort((a, b) => {
      const aVal = a[sortFieldEmployees];
      const bVal = b[sortFieldEmployees];
      
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrderEmployees === "asc" ? comparison : -comparison;
    });

  // Filtrage et tri pour "Gestion des utilisateurs" (utilisateurs actifs uniquement)
  const activeProfiles = profiles.filter(p => p.is_active !== false);
  const deletedProfiles = profiles.filter(p => p.is_active === false);

  const filteredUsers = activeProfiles
    .filter(p => {
      const matchesSearch = !searchTermUsers || 
        p.first_name?.toLowerCase().includes(searchTermUsers.toLowerCase()) ||
        p.last_name?.toLowerCase().includes(searchTermUsers.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTermUsers.toLowerCase());

      return matchesSearch;
    })
    .sort((a, b) => {
      const aVal = a[sortFieldUsers];
      const bVal = b[sortFieldUsers];
      
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrderUsers === "asc" ? comparison : -comparison;
    });

  // Filtrage pour les utilisateurs supprimés
  const filteredDeletedUsers = deletedProfiles
    .filter(p => {
      const matchesSearch = !searchTermUsers || 
        p.first_name?.toLowerCase().includes(searchTermUsers.toLowerCase()) ||
        p.last_name?.toLowerCase().includes(searchTermUsers.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTermUsers.toLowerCase());

      return matchesSearch;
    })
    .sort((a, b) => {
      // Tri par date de suppression (plus récent en premier)
      const aDate = a.deleted_at ? new Date(a.deleted_at).getTime() : 0;
      const bDate = b.deleted_at ? new Date(b.deleted_at).getTime() : 0;
      return bDate - aDate;
    });

  // Pagination pour "Invitations & Import"
  const totalPagesEmployees = Math.ceil(filteredEmployees.length / itemsPerPageEmployees);
  const startIndexEmployees = (currentPageEmployees - 1) * itemsPerPageEmployees;
  const paginatedEmployees = filteredEmployees.slice(startIndexEmployees, startIndexEmployees + itemsPerPageEmployees);

  // Pagination pour "Gestion des utilisateurs"
  const totalPagesUsers = Math.ceil(filteredUsers.length / itemsPerPageUsers);
  const startIndexUsers = (currentPageUsers - 1) * itemsPerPageUsers;
  const paginatedUsers = filteredUsers.slice(startIndexUsers, startIndexUsers + itemsPerPageUsers);

  const SortButtonEmployees = ({ field, label }: { field: keyof Profile; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSortEmployees(field)}
      className="h-8 px-2"
    >
      {label}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  const SortButtonUsers = ({ field, label }: { field: keyof Profile; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSortUsers(field)}
      className="h-8 px-2"
    >
      {label}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Utilisateurs</CardTitle>
              <CardDescription>
                Gérez les utilisateurs, leurs rôles et envoyez des invitations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setBetaInviteDialogOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Inviter Beta
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users">Gestion des utilisateurs ({activeProfiles.length})</TabsTrigger>
              <TabsTrigger value="deleted" className="text-muted-foreground">
                <UserX className="h-4 w-4 mr-1" />
                Utilisateurs supprimés ({deletedProfiles.length})
              </TabsTrigger>
              <TabsTrigger value="invitations">Invitations & Import</TabsTrigger>
            </TabsList>

            {/* Onglet "Gestion des utilisateurs" */}
            <TabsContent value="users" className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 max-w-sm">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom ou email..."
                      value={searchTermUsers}
                      onChange={(e) => {
                        setSearchTermUsers(e.target.value);
                        setCurrentPageUsers(1);
                      }}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedUserIds.size > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBulkResetDialogOpen(true)}
                      >
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Réinitialiser ({selectedUserIds.size})
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setBulkDeleteConfirmOpen(true)}
                        disabled={deletingUsers}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer ({selectedUserIds.size})
                      </Button>
                    </>
                  )}
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Colonnes
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Colonnes visibles</h4>
                        {allColumns.map((col) => (
                          <div key={col.key} className="flex items-center space-x-2">
                            <Checkbox
                              id={col.key}
                              checked={isColumnVisible(col.key)}
                              onCheckedChange={() => toggleColumn(col.key)}
                            />
                            <label
                              htmlFor={col.key}
                              className="text-sm cursor-pointer"
                            >
                              {col.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedUserIds.size === paginatedUsers.length && paginatedUsers.length > 0}
                            onCheckedChange={(checked) => handleSelectAllUsersForDeletion(checked as boolean)}
                          />
                        </TableHead>
                        {isColumnVisible("first_name") && (
                          <TableHead><SortButtonUsers field="first_name" label="Prénom" /></TableHead>
                        )}
                        {isColumnVisible("last_name") && (
                          <TableHead><SortButtonUsers field="last_name" label="Nom" /></TableHead>
                        )}
                        {isColumnVisible("email") && (
                          <TableHead><SortButtonUsers field="email" label="Email" /></TableHead>
                        )}
                        {isColumnVisible("company_id") && (
                          <TableHead>Entreprise</TableHead>
                        )}
                        {isColumnVisible("role") && (
                          <TableHead>Rôle</TableHead>
                        )}
                        {isColumnVisible("total_points") && (
                          <TableHead className="text-right"><SortButtonUsers field="total_points" label="Points" /></TableHead>
                        )}
                        {isColumnVisible("completed_modules") && (
                          <TableHead className="text-right">Modules</TableHead>
                        )}
                        {isColumnVisible("login_count") && (
                          <TableHead className="text-right">Connexions</TableHead>
                        )}
                        {isColumnVisible("phone_number") && (
                          <TableHead>Téléphone</TableHead>
                        )}
                        {isColumnVisible("birth_date") && (
                          <TableHead>Naissance</TableHead>
                        )}
                        {isColumnVisible("marital_status") && (
                          <TableHead>Situation</TableHead>
                        )}
                        {isColumnVisible("children_count") && (
                          <TableHead className="text-right">Enfants</TableHead>
                        )}
                        {isColumnVisible("job_title") && (
                          <TableHead>Poste</TableHead>
                        )}
                        {isColumnVisible("created_at") && (
                          <TableHead>Inscription</TableHead>
                        )}
                        {isColumnVisible("intention_score") && (
                          <TableHead className="text-center">
                            <span className="flex items-center gap-1 justify-center"><Flame className="h-3 w-3" /> Score RDV</span>
                          </TableHead>
                        )}
                        {isColumnVisible("last_login") && (
                          <TableHead>Dernière connexion</TableHead>
                        )}
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                            Aucun utilisateur trouvé
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedUsers.map((profile) => (
                          <TableRow key={profile.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedUserIds.has(profile.id)}
                                onCheckedChange={(checked) => handleSelectUserForDeletion(profile.id, checked as boolean)}
                              />
                            </TableCell>
                            {isColumnVisible("first_name") && (
                              <TableCell>
                                {isEditing(profile.id) ? (
                                  <Input
                                    value={editForm.first_name || ""}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, first_name: e.target.value })
                                    }
                                    className="h-8"
                                  />
                                ) : (
                                  profile.first_name || "-"
                                )}
                              </TableCell>
                            )}
                            {isColumnVisible("last_name") && (
                              <TableCell>
                                {isEditing(profile.id) ? (
                                  <Input
                                    value={editForm.last_name || ""}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, last_name: e.target.value })
                                    }
                                    className="h-8"
                                  />
                                ) : (
                                  profile.last_name || "-"
                                )}
                              </TableCell>
                            )}
                            {isColumnVisible("email") && (
                              <TableCell className="font-mono text-sm">
                                {profile.email}
                              </TableCell>
                            )}
                            {isColumnVisible("company_id") && (
                              <TableCell>
                                {profile.company_id
                                  ? companies.find((c) => c.id === profile.company_id)?.name || "-"
                                  : "-"}
                              </TableCell>
                            )}
                            {isColumnVisible("role") && (
                              <TableCell>
                                <Select
                                  value={getUserRole(profile.id)}
                                  onValueChange={(value: UserRole) =>
                                    handleRoleChange(profile.id, value)
                                  }
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue>
                                      <Badge variant={getRoleBadgeVariant(getUserRole(profile.id)) as any}>
                                        {getRoleIcon(getUserRole(profile.id))}{" "}
                                        {getUserRole(profile.id)}
                                      </Badge>
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">👤 user</SelectItem>
                                    <SelectItem value="contact_entreprise">
                                      🏢 contact_entreprise
                                    </SelectItem>
                                    <SelectItem value="admin">👑 admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            )}
                            {isColumnVisible("total_points") && (
                              <TableCell className="text-right font-semibold">
                                {profile.total_points}
                              </TableCell>
                            )}
                            {isColumnVisible("completed_modules") && (
                              <TableCell className="text-right">
                                {profile.completed_modules?.length || 0}
                              </TableCell>
                            )}
                            {isColumnVisible("login_count") && (
                              <TableCell className="text-right">
                                {loginCounts[profile.id] || 0}
                              </TableCell>
                            )}
                            {isColumnVisible("phone_number") && (
                              <TableCell>
                                {isEditing(profile.id) ? (
                                  <Input
                                    value={editForm.phone_number || ""}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, phone_number: e.target.value })
                                    }
                                    className="h-8"
                                  />
                                ) : (
                                  profile.phone_number || "-"
                                )}
                              </TableCell>
                            )}
                            {isColumnVisible("birth_date") && (
                              <TableCell>
                                {isEditing(profile.id) ? (
                                  <Input
                                    type="date"
                                    value={editForm.birth_date || ""}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, birth_date: e.target.value })
                                    }
                                    className="h-8"
                                  />
                                ) : profile.birth_date ? (
                                  format(new Date(profile.birth_date), "dd/MM/yyyy", {
                                    locale: fr,
                                  })
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                            )}
                            {isColumnVisible("marital_status") && (
                              <TableCell>
                                {isEditing(profile.id) ? (
                                  <Select
                                    value={editForm.marital_status || ""}
                                    onValueChange={(value) =>
                                      setEditForm({ ...editForm, marital_status: value })
                                    }
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="single">Célibataire</SelectItem>
                                      <SelectItem value="married">Marié(e)</SelectItem>
                                      <SelectItem value="divorced">Divorcé(e)</SelectItem>
                                      <SelectItem value="widowed">Veuf/Veuve</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  profile.marital_status || "-"
                                )}
                              </TableCell>
                            )}
                            {isColumnVisible("children_count") && (
                              <TableCell className="text-right">
                                {isEditing(profile.id) ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    value={editForm.children_count || 0}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        children_count: parseInt(e.target.value) || 0,
                                      })
                                    }
                                    className="h-8 w-20"
                                  />
                                ) : (
                                  profile.children_count || 0
                                )}
                              </TableCell>
                            )}
                            {isColumnVisible("job_title") && (
                              <TableCell>
                                {isEditing(profile.id) ? (
                                  <Input
                                    value={editForm.job_title || ""}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, job_title: e.target.value })
                                    }
                                    className="h-8"
                                  />
                                ) : (
                                  profile.job_title || "-"
                                )}
                              </TableCell>
                            )}
                            {isColumnVisible("created_at") && (
                              <TableCell>
                                {profile.created_at
                                  ? format(new Date(profile.created_at), "dd/MM/yy", {
                                      locale: fr,
                                    })
                                  : "-"}
                              </TableCell>
                            )}
                            {isColumnVisible("intention_score") && (
                              <TableCell className="text-center">
                                <IntentionScoreBadge userId={profile.id} compact />
                              </TableCell>
                            )}
                            {isColumnVisible("last_login") && (
                              <TableCell>
                                {(() => {
                                  const effectiveLogin = getEffectiveLastLogin(profile);
                                  return effectiveLogin
                                    ? format(new Date(effectiveLogin), "dd/MM/yy", {
                                        locale: fr,
                                      })
                                    : "-";
                                })()}
                              </TableCell>
                            )}
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                {isEditing(profile.id) ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={handleSaveEdit}
                                    >
                                      <Save className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={handleCancelEdit}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleStartEdit(profile)}
                                    >
                                      ✏️
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewProfile(profile.id)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setSynthesisUserId(profile.id)}
                                      title="Voir la synthèse complète"
                                    >
                                      <LayoutDashboard className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setUserToTransfer(profile);
                                        setTransferDialogOpen(true);
                                      }}
                                      title="Transférer vers une autre entreprise"
                                    >
                                      <Building2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleSendPasswordReset(profile)}
                                      title="Envoyer un email de réinitialisation du mot de passe"
                                      disabled={sendingPasswordReset === profile.id}
                                    >
                                      <KeyRound className={`h-4 w-4 ${sendingPasswordReset === profile.id ? 'animate-spin' : ''}`} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setUserToReset(profile);
                                        setResetDialogOpen(true);
                                      }}
                                      title="Réinitialiser les données"
                                    >
                                      <RefreshCcw className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDeleteConfirmUserId(profile.id)}
                                      className="text-destructive hover:text-destructive"
                                      disabled={deletingUsers}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination pour "Gestion des utilisateurs" */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Lignes par page:</span>
                  <Select
                    value={itemsPerPageUsers.toString()}
                    onValueChange={(value) => {
                      setItemsPerPageUsers(parseInt(value));
                      setCurrentPageUsers(1);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEMS_PER_PAGE_OPTIONS.map(option => (
                        <SelectItem key={option} value={option.toString()}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    {startIndexUsers + 1}-{Math.min(startIndexUsers + itemsPerPageUsers, filteredUsers.length)} sur {filteredUsers.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPageUsers(p => Math.max(1, p - 1))}
                    disabled={currentPageUsers === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPageUsers} sur {totalPagesUsers || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPageUsers(p => Math.min(totalPagesUsers, p + 1))}
                    disabled={currentPageUsers === totalPagesUsers || totalPagesUsers === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Onglet "Utilisateurs supprimés" */}
            <TabsContent value="deleted" className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 max-w-sm">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher dans les utilisateurs supprimés..."
                      value={searchTermUsers}
                      onChange={(e) => {
                        setSearchTermUsers(e.target.value);
                      }}
                      className="pl-8"
                    />
                  </div>
                </div>

                {selectedUserIds.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestoreUsers(Array.from(selectedUserIds))}
                    disabled={deletingUsers}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restaurer ({selectedUserIds.size})
                  </Button>
                )}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedUserIds.size === filteredDeletedUsers.length && filteredDeletedUsers.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUserIds(new Set(filteredDeletedUsers.map(p => p.id)));
                              } else {
                                setSelectedUserIds(new Set());
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Prénom</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Entreprise</TableHead>
                        <TableHead>Supprimé le</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDeletedUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Aucun utilisateur supprimé
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDeletedUsers.map((profile) => (
                          <TableRow key={profile.id} className="opacity-75">
                            <TableCell>
                              <Checkbox
                                checked={selectedUserIds.has(profile.id)}
                                onCheckedChange={(checked) => handleSelectUserForDeletion(profile.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell>{profile.first_name || "-"}</TableCell>
                            <TableCell>{profile.last_name || "-"}</TableCell>
                            <TableCell className="font-mono text-sm">{profile.email}</TableCell>
                            <TableCell>
                              {profile.company_id
                                ? companies.find((c) => c.id === profile.company_id)?.name || "-"
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {profile.deleted_at
                                ? format(new Date(profile.deleted_at), "dd/MM/yyyy HH:mm", { locale: fr })
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestoreUsers([profile.id])}
                                disabled={deletingUsers}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Restaurer
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* Onglet "Invitations & Import" */}
            <TabsContent value="invitations" className="space-y-4">
              <div className="flex items-center justify-between">
                <Button onClick={() => setImportDialogOpen(true)} variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Importer CSV
                </Button>
              </div>

              {/* Barre de recherche et filtres */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom ou email..."
                      value={searchTermEmployees}
                      onChange={(e) => {
                        setSearchTermEmployees(e.target.value);
                        setCurrentPageEmployees(1);
                      }}
                      className="pl-8"
                    />
                  </div>
                </div>

                <Select value={filterCompanyEmployees} onValueChange={(value) => {
                  setFilterCompanyEmployees(value);
                  setCurrentPageEmployees(1);
                }}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Entreprise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les entreprises</SelectItem>
                    {companies.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions groupées */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={handleSendInvitations}
                  disabled={selectedIds.size === 0 || sending}
                  size="sm"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {sending ? "Envoi en cours..." : `Envoyer invitation (${selectedIds.size})`}
                </Button>
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exporter CSV
                </Button>
              </div>

              {/* Tableau */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedIds.size === paginatedEmployees.length && paginatedEmployees.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead><SortButtonEmployees field="first_name" label="Prénom" /></TableHead>
                        <TableHead><SortButtonEmployees field="last_name" label="Nom" /></TableHead>
                        <TableHead><SortButtonEmployees field="email" label="Email" /></TableHead>
                        <TableHead>Entreprise</TableHead>
                        <TableHead>Entité partenariat</TableHead>
                        <TableHead className="text-right">Modules</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                        <TableHead>Dernière connexion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedEmployees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            Aucun utilisateur trouvé
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedEmployees.map((profile) => (
                          <TableRow key={profile.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.has(profile.id)}
                                onCheckedChange={(checked) => handleSelectOne(profile.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell>{profile.first_name || '-'}</TableCell>
                            <TableCell>{profile.last_name || '-'}</TableCell>
                            <TableCell className="font-mono text-sm">{profile.email}</TableCell>
                            <TableCell>
                              {profile.company_id 
                                ? companies.find(c => c.id === profile.company_id)?.name || '-'
                                : '-'
                              }
                            </TableCell>
                            <TableCell>
                              {profile.company_id 
                                ? companies.find(c => c.id === profile.company_id)?.partnership_type || '-'
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="text-right">{profile.completed_modules.length}</TableCell>
                            <TableCell className="text-right font-semibold">{profile.total_points}</TableCell>
                            <TableCell>
                              {(() => {
                                const effectiveLogin = getEffectiveLastLogin(profile);
                                return effectiveLogin 
                                  ? format(new Date(effectiveLogin), 'dd/MM/yy', { locale: fr }) 
                                  : '-';
                              })()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination pour "Invitations & Import" */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Lignes par page:</span>
                  <Select
                    value={itemsPerPageEmployees.toString()}
                    onValueChange={(value) => {
                      setItemsPerPageEmployees(parseInt(value));
                      setCurrentPageEmployees(1);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEMS_PER_PAGE_OPTIONS.map(option => (
                        <SelectItem key={option} value={option.toString()}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    {startIndexEmployees + 1}-{Math.min(startIndexEmployees + itemsPerPageEmployees, filteredEmployees.length)} sur {filteredEmployees.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPageEmployees(p => Math.max(1, p - 1))}
                    disabled={currentPageEmployees === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPageEmployees} sur {totalPagesEmployees || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPageEmployees(p => Math.min(totalPagesEmployees, p + 1))}
                    disabled={currentPageEmployees === totalPagesEmployees || totalPagesEmployees === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import CSV - Salariés</DialogTitle>
          </DialogHeader>
          <EmployeesImportTab />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmUserId} onOpenChange={(open) => !open && setDeleteConfirmUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'utilisateur sera désactivé et déplacé dans l'onglet "Utilisateurs supprimés". Vous pourrez le restaurer ultérieurement si nécessaire.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmUserId && handleDeleteUsers([deleteConfirmUserId])}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Désactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver {selectedUserIds.size} utilisateur(s) ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les utilisateurs sélectionnés seront désactivés et déplacés dans l'onglet "Utilisateurs supprimés". Vous pourrez les restaurer ultérieurement si nécessaire.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteUsers(Array.from(selectedUserIds))}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Désactiver {selectedUserIds.size} utilisateur(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Company Transfer Dialog */}
      <CompanyTransferDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        user={userToTransfer}
        companies={companies}
        onSuccess={onRefresh}
      />

      {/* User Reset Dialog - Individual */}
      <UserResetDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        userId={userToReset?.id || ''}
        userName={`${userToReset?.first_name || ''} ${userToReset?.last_name || ''}`}
        onReset={onRefresh}
      />

      {/* User Reset Dialog - Bulk */}
      <UserResetDialog
        open={bulkResetDialogOpen}
        onOpenChange={setBulkResetDialogOpen}
        userId=""
        userName=""
        bulkUserIds={Array.from(selectedUserIds)}
        onReset={onRefresh}
      />

      {/* Beta Invite Dialog */}
      <BetaInviteDialog
        open={betaInviteDialogOpen}
        onOpenChange={setBetaInviteDialogOpen}
        companies={companies}
        onSuccess={onRefresh}
      />

      {/* User Synthesis Dialog */}
      <Dialog open={!!synthesisUserId} onOpenChange={(open) => { if (!open) setSynthesisUserId(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Synthèse utilisateur</DialogTitle>
          </DialogHeader>
          {synthesisUserId && <UserSynthesisTable userId={synthesisUserId} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
