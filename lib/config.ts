/**
 * Application configuration management
 */

export interface AppConfig {
  // Job processing
  maxConcurrentJobs: number;
  jobTTL: number;
  cleanupInterval: number;
  
  // File limits
  maxFileSize: number;
  maxVideoDuration: number;
  
  // Performance
  processingTimeout: number;
  memoryThreshold: number;
  
  // Feature flags
  enablePerformanceMonitoring: boolean;
  enableErrorLogging: boolean;
  enableCleanupService: boolean;
  
  // Security
  corsOrigin: string;
  rateLimitPerMinute: number;
  
  // Environment
  nodeEnv: string;
  debugMode: boolean;
  verboseLogging: boolean;
}

/**
 * Load configuration from environment variables with defaults
 */
export function loadConfig(): AppConfig {
  return {
    // Job processing
    maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '5'),
    jobTTL: parseInt(process.env.JOB_TTL_MS || '3600000'), // 1 hour
    cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL_MS || '300000'), // 5 minutes
    
    // File limits
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '25') * 1024 * 1024,
    maxVideoDuration: parseInt(process.env.MAX_VIDEO_DURATION_SECONDS || '15'),
    
    // Performance
    processingTimeout: parseInt(process.env.PROCESSING_TIMEOUT_MS || '300000'), // 5 minutes
    memoryThreshold: parseInt(process.env.MEMORY_THRESHOLD_MB || '100') * 1024 * 1024,
    
    // Feature flags
    enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
    enableErrorLogging: process.env.ENABLE_ERROR_LOGGING !== 'false', // Default true
    enableCleanupService: process.env.ENABLE_CLEANUP_SERVICE !== 'false', // Default true
    
    // Security
    corsOrigin: process.env.CORS_ORIGIN || '*',
    rateLimitPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '10'),
    
    // Environment
    nodeEnv: process.env.NODE_ENV || 'development',
    debugMode: process.env.DEBUG_MODE === 'true',
    verboseLogging: process.env.VERBOSE_LOGGING === 'true'
  };
}

/**
 * Validate configuration values
 */
export function validateConfig(config: AppConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate numeric ranges
  if (config.maxConcurrentJobs < 1 || config.maxConcurrentJobs > 20) {
    errors.push('maxConcurrentJobs must be between 1 and 20');
  }

  if (config.jobTTL < 60000 || config.jobTTL > 86400000) { // 1 minute to 24 hours
    errors.push('jobTTL must be between 1 minute and 24 hours');
  }

  if (config.maxFileSize < 1024 * 1024 || config.maxFileSize > 100 * 1024 * 1024) { // 1MB to 100MB
    errors.push('maxFileSize must be between 1MB and 100MB');
  }

  if (config.maxVideoDuration < 1 || config.maxVideoDuration > 60) { // 1 to 60 seconds
    errors.push('maxVideoDuration must be between 1 and 60 seconds');
  }

  if (config.processingTimeout < 10000 || config.processingTimeout > 600000) { // 10 seconds to 10 minutes
    errors.push('processingTimeout must be between 10 seconds and 10 minutes');
  }

  // Validate environment
  if (!['development', 'production', 'test'].includes(config.nodeEnv)) {
    errors.push('nodeEnv must be development, production, or test');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get runtime configuration with validation
 */
export function getConfig(): AppConfig {
  const config = loadConfig();
  const validation = validateConfig(config);

  if (!validation.valid) {
    console.error('Configuration validation failed:', validation.errors);
    
    if (config.nodeEnv === 'production') {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    } else {
      console.warn('Using potentially invalid configuration in non-production environment');
    }
  }

  return config;
}

/**
 * Configuration singleton
 */
let configInstance: AppConfig | null = null;

export function getAppConfig(): AppConfig {
  if (!configInstance) {
    configInstance = getConfig();
  }
  return configInstance;
}

/**
 * Reset configuration (for testing)
 */
export function resetConfig(): void {
  configInstance = null;
}