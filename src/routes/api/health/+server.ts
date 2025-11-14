import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { 
	PUBLIC_VITE_API_BASE_URL as STATIC_API_URL,
	PUBLIC_RECAPTCHA_SITE_KEY as STATIC_RECAPTCHA_KEY 
} from '$env/static/public';

export async function GET() {
	const dynamicApiUrl = env.PUBLIC_VITE_API_BASE_URL;
	const dynamicRecaptchaKey = env.PUBLIC_RECAPTCHA_SITE_KEY;
	
	return json({
		status: 'healthy',
		timestamp: new Date().toISOString(),
		environment: {
			node_env: process.env.NODE_ENV,
			dynamic: {
				api_url: dynamicApiUrl || '[NOT SET]',
				recaptcha_key: dynamicRecaptchaKey ? '[SET]' : '[NOT SET]'
			},
			static: {
				api_url: STATIC_API_URL || '[NOT SET]',
				recaptcha_key: STATIC_RECAPTCHA_KEY ? '[SET]' : '[NOT SET]'
			},
			final: {
				api_url: dynamicApiUrl || STATIC_API_URL || 'http://localhost:3001/api',
				recaptcha_key: (dynamicRecaptchaKey || STATIC_RECAPTCHA_KEY) ? '[SET]' : '[NOT SET]'
			}
		}
	});
}