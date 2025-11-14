// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			env?: {
				PUBLIC_API_BASE_URL: string;
				PUBLIC_RECAPTCHA_SITE_KEY: string;
			};
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		__ENV__?: {
			PUBLIC_API_BASE_URL?: string;
			PUBLIC_RECAPTCHA_SITE_KEY?: string;
		};
	}
}

export {};
