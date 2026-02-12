/**
 * ===========================================================
 * 📄 File: utils.ts
 * 📌 Rôle du fichier : Utilitaires généraux pour l'application
 * 🧩 Dépendances importantes : clsx, tailwind-merge
 * 🔁 Logiques principales :
 *   - Fusion intelligente de classes CSS/Tailwind
 * ===========================================================
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 🔹 Fonction utilitaire pour fusionner des classes CSS
 * 🔸 Combine clsx et tailwind-merge pour gérer intelligemment
 * les classes conditionnelles et éviter les conflits Tailwind
 * 
 * @function
 * @param {...ClassValue[]} inputs - Classes à fusionner (strings, objets, arrays)
 * @returns {string} String de classes CSS fusionnées et optimisées
 * 
 * @example
 * // Classes simples
 * cn("text-base", "font-bold") // "text-base font-bold"
 * 
 * @example
 * // Classes conditionnelles
 * cn("text-base", isActive && "text-primary") // "text-base text-primary" si isActive
 * 
 * @example
 * // Résolution de conflits Tailwind (dernière classe gagne)
 * cn("text-red-500", "text-blue-500") // "text-blue-500"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
