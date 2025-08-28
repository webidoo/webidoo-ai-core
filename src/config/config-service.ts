import { WebidooConfig } from './types';
import { defaultConfig } from './defaults';

/**
 * Configuration service for webidoo-ai-core
 * Manages configuration with dependency injection support
 */
export class ConfigService {
  private config: WebidooConfig;

  /**
   * Creates a new ConfigService instance
   * @param config Optional configuration override
   */
  constructor(config: Partial<WebidooConfig> = {}) {
    this.config = this.mergeWithDefaults(config);
  }

  /**
   * Get the current configuration
   */
  getConfig(): WebidooConfig {
    return this.config;
  }

  /**
   * Get OpenAI configuration
   */
  getOpenAIConfig() {
    return this.config.openai;
  }

  /**
   * Get Redis configuration
   */
  getRedisConfig() {
    return this.config.redis;
  }

  /**
   * Update configuration
   * @param config New configuration to merge with existing
   */
  updateConfig(config: Partial<WebidooConfig>): void {
    this.config = this.mergeWithDefaults(config);
  }

  /**
   * Merges provided config with defaults
   */
  private mergeWithDefaults(config: Partial<WebidooConfig>): WebidooConfig {
    return {
      openai: {
        ...defaultConfig.openai,
        ...(config.openai || {}),
      },
      redis: {
        ...defaultConfig.redis,
        ...(config.redis || {}),
      },
    };
  }

  /**
   * Validates that required configuration is present
   * @throws Error if required configuration is missing
   */
  validate(): void {
    if (!this.config.openai.apiKey) {
      throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable or provide it in the configuration.');
    }
  }
}
