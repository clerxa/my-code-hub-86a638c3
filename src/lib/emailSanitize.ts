/**
 * Sanitizes text for safe inclusion in HTML email templates.
 * Prevents XSS attacks by escaping HTML special characters.
 */
export const sanitizeForEmail = (text: string | null | undefined): string => {
  if (!text) return '';
  
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    // Also handle newlines for proper display
    .replace(/\n/g, '<br />');
};

/**
 * Sanitizes text without converting newlines to <br />.
 * Use for single-line fields like names and emails.
 */
export const sanitizeTextField = (text: string | null | undefined): string => {
  if (!text) return '';
  
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validates that a string looks like an email.
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates that a string is within acceptable length limits.
 */
export const isWithinLength = (text: string | null | undefined, maxLength: number): boolean => {
  if (!text) return true;
  return text.length <= maxLength;
};
