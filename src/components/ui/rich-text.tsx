import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";

interface RichTextProps {
  content: string | null | undefined;
  className?: string;
  as?: "p" | "div" | "span";
}

/**
 * Composant pour afficher du texte enrichi (HTML) de manière sécurisée.
 * Utilise DOMPurify pour nettoyer le HTML avant de l'afficher.
 */
export const RichText = ({ content, className, as: Component = "div" }: RichTextProps) => {
  if (!content) return null;

  // Vérifie si le contenu contient des balises HTML
  const hasHtmlTags = /<[^>]+>/.test(content);

  if (!hasHtmlTags) {
    // Si pas de HTML, affiche le texte tel quel
    return <Component className={className}>{content}</Component>;
  }

  // Nettoie le HTML pour éviter les attaques XSS
  const sanitizedHtml = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
  });

  return (
    <Component
      className={cn("prose prose-sm max-w-none dark:prose-invert", className)}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

/**
 * Fonction utilitaire pour extraire le texte brut du HTML
 * Utile pour les aperçus ou les résumés
 */
export const stripHtml = (html: string | null | undefined): string => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
};
