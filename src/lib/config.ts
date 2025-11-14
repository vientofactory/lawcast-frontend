// Simple configuration using SvelteKit's built-in environment variable handling

// Export environment variables with fallback values
export const API_BASE_URL = import.meta.env.PUBLIC_VITE_API_BASE_URL || 'http://localhost:3001/api';
export const RECAPTCHA_SITE_KEY = import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY || '';
