import { env } from '$env/dynamic/public';
import {
	PUBLIC_API_BASE_URL as STATIC_API_URL,
	PUBLIC_RECAPTCHA_SITE_KEY as STATIC_RECAPTCHA_KEY
} from '$env/static/public';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Resolve environment variables on server side
	const resolvedApiUrl = env.PUBLIC_API_BASE_URL || STATIC_API_URL || 'http://localhost:3001/api';
	const resolvedRecaptchaKey = env.PUBLIC_RECAPTCHA_SITE_KEY || STATIC_RECAPTCHA_KEY || '';

	// Add environment variables to locals for SSR
	event.locals = {
		...event.locals,
		env: {
			PUBLIC_API_BASE_URL: resolvedApiUrl,
			PUBLIC_RECAPTCHA_SITE_KEY: resolvedRecaptchaKey
		}
	};

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			// Inject environment variables into HTML
			const envScript = `
				<script>
					window.__ENV__ = ${JSON.stringify({
						PUBLIC_API_BASE_URL: resolvedApiUrl,
						PUBLIC_RECAPTCHA_SITE_KEY: resolvedRecaptchaKey
					})};
				</script>
			`;

			// Insert before the closing head tag
			return html.replace('</head>', envScript + '</head>');
		}
	});

	return response;
};
