import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface EnvironmentConfig {
	PUBLIC_API_BASE_URL: string;
	PUBLIC_RECAPTCHA_SITE_KEY: string;
}

// Default configuration
const defaultConfig: EnvironmentConfig = {
	PUBLIC_API_BASE_URL: 'http://localhost:3001/api',
	PUBLIC_RECAPTCHA_SITE_KEY: ''
};

// Create writable store for environment configuration
export const envConfig = writable<EnvironmentConfig>(defaultConfig);
export const envLoaded = writable<boolean>(false);
export const envError = writable<string | null>(null);

// Load environment configuration from server
export async function loadEnvironmentConfig(): Promise<EnvironmentConfig> {
	if (!browser) {
		// Server-side: return default config
		return defaultConfig;
	}

	try {
		const response = await fetch('/api/env');

		if (!response.ok) {
			throw new Error(`Failed to load environment config: ${response.status}`);
		}

		const data = await response.json();

		if (data.success && data.environment) {
			const config = data.environment;

			// Update stores
			envConfig.set(config);
			envLoaded.set(true);
			envError.set(null);

			// Also store in window object for immediate access
			if (typeof window !== 'undefined') {
				window.__ENV__ = config;
			}

			console.log('✅ Environment config loaded successfully:', config);
			return config;
		} else {
			throw new Error('Invalid environment config response');
		}
	} catch (error) {
		console.error('❌ Failed to load environment config:', error);

		// Set error state
		envError.set(error instanceof Error ? error.message : 'Unknown error');
		envLoaded.set(true); // Still mark as loaded even if failed

		// Return default config as fallback
		envConfig.set(defaultConfig);
		return defaultConfig;
	}
}

// Get current environment config (synchronous access)
export function getEnvConfig(): EnvironmentConfig {
	let config = defaultConfig;

	// Try to get from store
	envConfig.subscribe((value) => {
		config = value;
	})();

	// Fallback to window object
	if (browser && typeof window !== 'undefined' && window.__ENV__) {
		const windowEnv = window.__ENV__;
		return {
			PUBLIC_API_BASE_URL: windowEnv.PUBLIC_API_BASE_URL || defaultConfig.PUBLIC_API_BASE_URL,
			PUBLIC_RECAPTCHA_SITE_KEY:
				windowEnv.PUBLIC_RECAPTCHA_SITE_KEY || defaultConfig.PUBLIC_RECAPTCHA_SITE_KEY
		};
	}

	return config;
}
