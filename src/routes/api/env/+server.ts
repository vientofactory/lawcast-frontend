import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import {
	PUBLIC_API_BASE_URL as STATIC_API_URL,
	PUBLIC_RECAPTCHA_SITE_KEY as STATIC_RECAPTCHA_KEY
} from '$env/static/public';

export async function GET() {
	// Server-side environment resolution
	const resolvedApiUrl = env.PUBLIC_API_BASE_URL || STATIC_API_URL || 'http://localhost:3001/api';
	const resolvedRecaptchaKey = env.PUBLIC_RECAPTCHA_SITE_KEY || STATIC_RECAPTCHA_KEY || '';

	return json(
		{
			success: true,
			environment: {
				PUBLIC_API_BASE_URL: resolvedApiUrl,
				PUBLIC_RECAPTCHA_SITE_KEY: resolvedRecaptchaKey
			},
			debug: {
				dynamic: {
					api_url: env.PUBLIC_API_BASE_URL || '[NOT SET]',
					recaptcha_key: env.PUBLIC_RECAPTCHA_SITE_KEY ? '[SET]' : '[NOT SET]'
				},
				static: {
					api_url: STATIC_API_URL || '[NOT SET]',
					recaptcha_key: STATIC_RECAPTCHA_KEY ? '[SET]' : '[NOT SET]'
				}
			}
		},
		{
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate'
			}
		}
	);
}
