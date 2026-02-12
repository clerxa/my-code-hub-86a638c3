/**
 * Centralized logging utility for better debugging
 * Provides structured, contextual error messages
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  data?: Record<string, unknown>;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: unknown;
}

const isDev = import.meta.env.DEV;

const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ''}`;
  }
  if (typeof error === 'object' && error !== null) {
    return JSON.stringify(error, null, 2);
  }
  return String(error);
};

const createLogEntry = (
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: unknown
): LogEntry => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  context,
  error,
});

const formatLogMessage = (entry: LogEntry): string => {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`,
  ];

  if (entry.context?.component) {
    parts.push(`[${entry.context.component}]`);
  }

  if (entry.context?.action) {
    parts.push(`(${entry.context.action})`);
  }

  parts.push(entry.message);

  return parts.join(' ');
};

/**
 * Logger utility with structured error messages
 */
export const logger = {
  /**
   * Log an error with context
   * @example logger.error('Failed to fetch user', { component: 'UserProfile', action: 'fetchUser' }, error)
   */
  error: (message: string, context?: LogContext, error?: unknown) => {
    const entry = createLogEntry('error', message, context, error);
    const formattedMessage = formatLogMessage(entry);
    
    if (error) {
      console.error(formattedMessage, '\nError details:', formatError(error));
      if (context?.data) {
        console.error('Context data:', context.data);
      }
    } else {
      console.error(formattedMessage, context?.data || '');
    }
  },

  /**
   * Log a warning
   * @example logger.warn('User session expiring soon', { component: 'Auth' })
   */
  warn: (message: string, context?: LogContext) => {
    const entry = createLogEntry('warn', message, context);
    console.warn(formatLogMessage(entry), context?.data || '');
  },

  /**
   * Log info (only in development)
   * @example logger.info('Module loaded', { component: 'ModulesTab', data: { moduleId: 123 } })
   */
  info: (message: string, context?: LogContext) => {
    if (isDev) {
      const entry = createLogEntry('info', message, context);
      console.info(formatLogMessage(entry), context?.data || '');
    }
  },

  /**
   * Log debug info (only in development)
   * @example logger.debug('State updated', { component: 'Form', data: { values } })
   */
  debug: (message: string, context?: LogContext) => {
    if (isDev) {
      const entry = createLogEntry('debug', message, context);
      console.log(formatLogMessage(entry), context?.data || '');
    }
  },

  /**
   * Create a scoped logger for a specific component
   * @example const log = logger.scoped('UserProfile'); log.error('Failed to load');
   */
  scoped: (component: string) => ({
    error: (message: string, error?: unknown, data?: Record<string, unknown>) =>
      logger.error(message, { component, data }, error),
    warn: (message: string, data?: Record<string, unknown>) =>
      logger.warn(message, { component, data }),
    info: (message: string, data?: Record<string, unknown>) =>
      logger.info(message, { component, data }),
    debug: (message: string, data?: Record<string, unknown>) =>
      logger.debug(message, { component, data }),
  }),

  /**
   * Log a Supabase error with table context
   * @example logger.supabaseError('profiles', 'select', error)
   */
  supabaseError: (table: string, operation: string, error: unknown) => {
    logger.error(
      `Database operation failed: ${operation} on "${table}"`,
      { component: 'Supabase', action: operation, data: { table } },
      error
    );
  },

  /**
   * Log an API/fetch error
   * @example logger.apiError('/api/users', 'GET', error)
   */
  apiError: (endpoint: string, method: string, error: unknown) => {
    logger.error(
      `API request failed: ${method} ${endpoint}`,
      { component: 'API', action: method, data: { endpoint } },
      error
    );
  },

  /**
   * Log authentication errors
   * @example logger.authError('login', error)
   */
  authError: (action: string, error: unknown) => {
    logger.error(
      `Authentication failed: ${action}`,
      { component: 'Auth', action },
      error
    );
  },
};

export default logger;
