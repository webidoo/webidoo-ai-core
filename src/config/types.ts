/**
 * Configuration types for webidoo-ai-core
 */

/**
 * OpenAI configuration options
 */
export interface OpenAIConfig {
  /**
   * OpenAI API key
   */
  apiKey?: string;
  
  /**
   * OpenAI organization ID
   */
  organization?: string;
  
  /**
   * Base URL for OpenAI API
   */
  baseURL?: string;
}

/**
 * Redis configuration options
 */
export interface RedisConfig {
  /**
   * Redis connection URL
   */
  url?: string;
  
  /**
   * Vector dimension for Redis vector store
   */
  vectorDim?: number;
}

/**
 * Main configuration interface for webidoo-ai-core
 */
export interface WebidooConfig {
  /**
   * OpenAI configuration
   */
  openai: OpenAIConfig;
  
  /**
   * Redis configuration
   */
  redis: RedisConfig;
}
