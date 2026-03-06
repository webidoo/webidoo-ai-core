import type { WebidooConfig } from './types';

/**
 * Default configuration for webidoo-ai-core
 * Uses environment variables if available, otherwise provides sensible defaults
 */
export const defaultConfig: WebidooConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,
    baseURL: process.env.OPENAI_BASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    vectorDim: 1536, // Default dimension for OpenAI embeddings
  }
};
