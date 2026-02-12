/**
 * ===========================================================
 * 📄 File: useScrollAnimation.ts
 * 📌 Rôle du fichier : Hook pour déclencher des animations au scroll
 * 🧩 Dépendances importantes : IntersectionObserver API
 * 🔁 Logiques principales :
 *   - Détecte quand un élément devient visible dans le viewport
 *   - Gère les animations à l'apparition
 *   - Options configurables (seuil, marges, déclenchement unique)
 * ===========================================================
 */

import { useEffect, useRef, useState } from "react";

/**
 * 🔹 Options de configuration pour l'animation au scroll
 * 
 * @interface UseScrollAnimationOptions
 * @property {number} [threshold=0.1] - Pourcentage de visibilité pour déclencher (0-1)
 * @property {string} [rootMargin="0px"] - Marge autour du viewport (CSS margin syntax)
 * @property {boolean} [triggerOnce=true] - Si true, l'animation ne se déclenche qu'une fois
 */
interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * 🔹 Hook pour animer des éléments à l'apparition au scroll
 * 🔸 Utilise l'IntersectionObserver API pour détecter la visibilité
 * 
 * @hook
 * @param {UseScrollAnimationOptions} options - Configuration de l'animation
 * @returns {Object} Objet contenant la ref à attacher et l'état de visibilité
 * @returns {RefObject<HTMLElement>} returns.ref - Ref à attacher à l'élément animé
 * @returns {boolean} returns.isVisible - True quand l'élément est visible
 * 
 * @example
 * const { ref, isVisible } = useScrollAnimation({ threshold: 0.3, triggerOnce: true });
 * 
 * <div ref={ref} className={isVisible ? "fade-in" : "opacity-0"}>
 *   Contenu animé
 * </div>
 */
export const useScrollAnimation = (
  options: UseScrollAnimationOptions = {}
) => {
  // Extraction des options avec valeurs par défaut
  const { threshold = 0.1, rootMargin = "0px", triggerOnce = true } = options;
  
  // Ref pour l'élément à observer
  const ref = useRef<HTMLElement>(null);
  
  // État de visibilité de l'élément
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    /**
     * 🔹 Callback de l'IntersectionObserver
     * 🔸 Déclenché quand l'élément entre/sort du viewport
     */
    const observer = new IntersectionObserver(
      ([entry]) => {
        // L'élément est entré dans le viewport
        if (entry.isIntersecting) {
          setIsVisible(true);
          
          // Si déclenchement unique, on arrête d'observer
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } 
        // L'élément est sorti du viewport (seulement si !triggerOnce)
        else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    // Démarrage de l'observation
    observer.observe(element);

    // Nettoyage : déconnexion de l'observer
    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
};