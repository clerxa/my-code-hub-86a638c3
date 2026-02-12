/**
 * ===========================================================
 * 📄 File: useBlockLayoutConfig.ts
 * 📌 Rôle du fichier : Hook pour gérer la configuration et l'ordre des blocs d'une page
 * 🧩 Dépendances importantes : 
 *   - supabase client pour les requêtes DB
 *   - sonner pour les notifications
 * 🔁 Logiques principales :
 *   - Récupération de la configuration des blocs depuis la DB
 *   - Mise à jour de l'ordre des blocs (drag & drop)
 *   - Mise à jour de la configuration individuelle des blocs
 *   - Gestion du state local et de la synchronisation DB
 * ===========================================================
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * 🔹 Configuration d'un bloc de page
 * 🔸 Définit les propriétés configurables pour chaque bloc
 * 
 * @interface BlockConfig
 * @property {boolean} visible - Si le bloc est affiché ou masqué
 * @property {string} [title] - Titre optionnel du bloc
 * @property {string} [description] - Description optionnelle du bloc
 * @property {any} [key: string] - Propriétés personnalisées additionnelles
 */
export interface BlockConfig {
  visible: boolean;
  title?: string;
  description?: string;
  [key: string]: any;
}

/**
 * 🔹 Hook personnalisé pour gérer les blocs d'une page
 * 🔸 Permet de réorganiser et configurer les blocs de contenu dynamiques
 * 
 * @hook
 * @param {string} pageName - Nom de la page pour identifier sa configuration
 * @returns {Object} Objet contenant l'état et les méthodes de gestion des blocs
 * @returns {string[]} returns.blocks - Liste ordonnée des IDs de blocs
 * @returns {Record<string, BlockConfig>} returns.layoutConfig - Configuration de chaque bloc
 * @returns {boolean} returns.loading - Indicateur de chargement initial
 * @returns {(newOrder: string[]) => Promise<void>} returns.updateBlockOrder - Met à jour l'ordre
 * @returns {(blockId: string, config: Partial<BlockConfig>) => Promise<void>} returns.updateBlockConfig - Met à jour la config d'un bloc
 * @returns {() => Promise<void>} returns.refetch - Recharge la configuration depuis la DB
 * 
 * @example
 * const { blocks, layoutConfig, updateBlockOrder } = useBlockLayoutConfig('company-dashboard');
 * 
 * // Réorganiser les blocs
 * await updateBlockOrder(['block2', 'block1', 'block3']);
 * 
 * // Masquer un bloc
 * await updateBlockConfig('block1', { visible: false });
 */
export const useBlockLayoutConfig = (pageName: string) => {
  // État local pour les blocs et leur configuration
  const [blocks, setBlocks] = useState<string[]>([]);
  const [layoutConfig, setLayoutConfig] = useState<Record<string, BlockConfig>>({});
  const [loading, setLoading] = useState(true);

  // Chargement initial de la configuration au montage
  useEffect(() => {
    fetchBlockOrder();
  }, [pageName]);

  /**
   * 🔹 Récupère la configuration des blocs depuis la base de données
   * 🔸 Charge l'ordre et la configuration pour la page spécifiée
   * 
   * @async
   * @private
   */
  const fetchBlockOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("block_orders")
        .select("*")
        .eq("page_name", pageName)
        .maybeSingle();

      // Gestion de l'erreur (sauf si aucune ligne trouvée)
      if (error && error.code !== 'PGRST116') throw error;

      // Configuration par défaut si aucune donnée n'existe pour la page employee
      if (!data && pageName === 'employee') {
        const defaultBlocks = [
          'profile',
          'progression',
          'theme_selector',
          'personalInfo',
          'inviteColleague',
          'referral',
          'invitationsTracker',
          'recommendations',
          'simulations',
          'webinars',
          'rdv_expert'
        ];
        const defaultConfig: Record<string, BlockConfig> = {
          profile: { visible: true },
          progression: { visible: true },
          theme_selector: { visible: true },
          personalInfo: { visible: true, title: "Informations personnelles", description: "Gérez vos informations de profil" },
          inviteColleague: { visible: true, title: "Inviter un collègue", description: "Invitez vos collègues à rejoindre FinCare" },
          referral: { visible: true, title: "Programme de parrainage", description: "Proposez un RDV expert à vos collègues" },
          invitationsTracker: { visible: true, title: "Mes invitations et parrainages", description: "Suivez le statut de vos invitations" },
          recommendations: { visible: true },
          simulations: { visible: true },
          webinars: { visible: true },
          rdv_expert: { visible: true }
        };
        setBlocks(defaultBlocks);
        setLayoutConfig(defaultConfig);
      } else if (data) {
        // Mise à jour du state si des données existent
        setBlocks(data.block_order as string[]);
        setLayoutConfig(data.layout_config as Record<string, BlockConfig>);
      }
    } catch (error) {
      console.error("Error fetching block order:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔹 Met à jour l'ordre des blocs dans la base de données
   * 🔸 Utilisé lors du drag & drop des blocs
   * 
   * @async
   * @param {string[]} newOrder - Nouvel ordre des IDs de blocs
   */
  const updateBlockOrder = async (newOrder: string[]) => {
    try {
      const { error } = await supabase
        .from("block_orders")
        .upsert({
          page_name: pageName,
          block_order: newOrder,
          layout_config: layoutConfig,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "page_name",
        });

      if (error) throw error;

      // Mise à jour du state local après succès
      setBlocks(newOrder);
      toast.success("Ordre des blocs mis à jour");
    } catch (error) {
      console.error("Error updating block order:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  /**
   * 🔹 Met à jour la configuration d'un bloc spécifique
   * 🔸 Permet de modifier les propriétés d'un bloc (visibilité, titre, etc.)
   * 
   * @async
   * @param {string} blockId - ID du bloc à modifier
   * @param {Partial<BlockConfig>} config - Propriétés à mettre à jour (partiel)
   */
  const updateBlockConfig = async (blockId: string, config: Partial<BlockConfig>) => {
    try {
      // Fusion de la nouvelle config avec l'existante
      const newConfig = {
        ...layoutConfig,
        [blockId]: { ...layoutConfig[blockId], ...config },
      };

      const { error } = await supabase
        .from("block_orders")
        .upsert({
          page_name: pageName,
          block_order: blocks,
          layout_config: newConfig,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "page_name",
        });

      if (error) throw error;

      // Mise à jour du state local après succès
      setLayoutConfig(newConfig);
      toast.success("Configuration mise à jour");
    } catch (error) {
      console.error("Error updating block config:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  // Retour des données et méthodes pour utilisation dans les composants
  return {
    blocks,
    layoutConfig,
    loading,
    updateBlockOrder,
    updateBlockConfig,
    refetch: fetchBlockOrder,
  };
};
