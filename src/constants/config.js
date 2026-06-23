// App-wide configuration constants for BHEL Connect Marketplace
export const APP_CONFIG = {
  IMAGE: {
    MAX_COUNT: 5,
    MAX_SIZE_MB: 5,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  },
  CHAT: {
    MAX_LENGTH: 1000,
    POLL_INTERVAL_MS: 30000, // Fallback polling interval
  },
  CAMPAIGN: {
    TOKEN_PERCENTAGE: 0.10, // 10% token amount for reservations
  },
};
