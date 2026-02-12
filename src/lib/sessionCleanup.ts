import { logger } from './logger';

const CURRENT_PROJECT_REF = 'gbotqqeirtbmmyxqwtzl';

export function cleanupOrphanedSessions(): void {
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const match = key.match(/^sb-([a-z0-9]+)-auth-token$/);
      if (match && match[1] !== CURRENT_PROJECT_REF) {
        const oldRef = match[1];
        // Collect all keys from the old project
        for (let j = 0; j < localStorage.length; j++) {
          const k = localStorage.key(j);
          if (k && k.startsWith(`sb-${oldRef}-`)) {
            keysToRemove.push(k);
          }
        }
      }
    }

    if (keysToRemove.length > 0) {
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      logger.info('Cleaned up orphaned Supabase session', {
        component: 'SessionCleanup',
        data: { removedKeys: keysToRemove.length },
      });
    }
  } catch (e) {
    logger.warn('Failed to cleanup orphaned sessions', { component: 'SessionCleanup' });
  }
}
