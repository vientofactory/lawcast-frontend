import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	envPrefix: 'PUBLIC_',
	define: {
		// Ensure environment variables are available at build time
		'process.env.PUBLIC_VITE_API_BASE_URL': JSON.stringify(process.env.PUBLIC_VITE_API_BASE_URL),
		'process.env.PUBLIC_RECAPTCHA_SITE_KEY': JSON.stringify(process.env.PUBLIC_RECAPTCHA_SITE_KEY)
	}
});
